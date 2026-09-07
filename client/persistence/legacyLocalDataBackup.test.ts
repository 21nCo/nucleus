import { describe, expect, it } from "vitest";
import { Product } from "@21n/types/product.type";
import {
  convertLegacyLocalDataBackupToDatafnImport,
  hasRecoverableLegacyLocalData,
  resolveLegacyLocalDataRecordCount,
  type LegacyLocalDataBackup,
  type LegacyLocalDataSummary
} from "@nucleum/persistence/legacyLocalDataBackup";

const dateMarker = (value: string) => ({
  __legacyIndexedDbType: "Date",
  value
});

function createBackup(
  stores: LegacyLocalDataBackup["databases"][number]["stores"]
) {
  return {
    schema: "nucleum-legacy-local-data-backup",
    version: 1,
    exportedAt: "2026-06-17T00:00:00.000Z",
    product: Product.POINTRON,
    databases: [
      {
        name: "local-user-1",
        version: 120,
        provider: "dexie",
        stores
      }
    ]
  } satisfies LegacyLocalDataBackup;
}

describe("legacyLocalDataBackup", () => {
  it("counts recoverable legacy records from summaries and backups", () => {
    const summary: LegacyLocalDataSummary = {
      isSupported: true,
      databases: [
        {
          name: "local-user-1",
          version: 120,
          provider: "dexie",
          stores: [
            { name: "goal", count: 2 },
            { name: "task", count: 1 }
          ]
        }
      ]
    };

    expect(resolveLegacyLocalDataRecordCount(summary)).toBe(3);
    expect(hasRecoverableLegacyLocalData(summary)).toBe(true);
  });

  it("converts legacy focus resources and links into DataFn import payloads", () => {
    const backup = createBackup([
      {
        name: "goal",
        keyPath: "id",
        autoIncrement: false,
        indexes: [],
        records: [
          {
            key: "goal:root",
            value: {
              id: "goal:root",
              label: "Root",
              type: "INDEFINITE",
              status: "IN_PROGRESS",
              createdAt: dateMarker("2026-01-01T00:00:00.000Z"),
              modifiedAt: dateMarker("2026-01-02T00:00:00.000Z")
            }
          },
          {
            key: "goal:child",
            value: {
              id: "goal:child",
              label: "Child",
              type: "DEFINITE",
              status: "NOT_STARTED",
              parent: ["goal:root"],
              subGoalsLayout: "TREE",
              isParentInactive: true,
              trashInformation: {
                deletedAt: dateMarker("2026-01-03T00:00:00.000Z"),
                deletedBy: "user:1"
              }
            }
          }
        ]
      },
      {
        name: "task",
        keyPath: "id",
        autoIncrement: false,
        indexes: [],
        records: [
          {
            key: "task:1",
            value: {
              id: "task:1",
              label: "Task",
              checked: true,
              goalId: "goal:child",
              dateUnix: 1767225600
            }
          }
        ]
      },
      {
        name: "sessionLog",
        keyPath: "id",
        autoIncrement: false,
        indexes: [],
        records: [
          {
            key: "sessionLog:1",
            value: {
              id: "sessionLog:1",
              startUnix: 1767225600,
              endUnix: 1767229200,
              sessionId: "session:1",
              goalId: "goal:child",
              taskId: "task:1"
            }
          }
        ]
      },
      {
        name: "link",
        keyPath: "id",
        autoIncrement: false,
        indexes: [],
        records: [
          {
            key: "link:1",
            value: {
              id: "link:1",
              in: "goal:child",
              out: "task:1",
              linkType: "DIRECT",
              tags: ["linkTag:1"]
            }
          }
        ]
      }
    ]);

    const payload = convertLegacyLocalDataBackupToDatafnImport(backup);

    expect(payload.resources.objective).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "goal:root",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z"
        }),
        expect.objectContaining({
          id: "goal:child",
          parentId: "goal:root",
          parentPath: "goal:root",
          subObjectivesLayout: "TREE",
          isAncestorInactive: true,
          trashedAt: "2026-01-03T00:00:00.000Z",
          trashedBy: "user:1"
        })
      ])
    );
    expect(payload.resources.task).toEqual([
      expect.objectContaining({
        id: "task:1",
        isChecked: true,
        objectiveId: "goal:child"
      })
    ]);
    expect(payload.resources.sessionLog).toEqual([
      expect.objectContaining({
        id: "sessionLog:1",
        objectiveId: "goal:child"
      })
    ]);
    expect(payload.joins?.join_objective_links_task).toEqual([
      expect.objectContaining({
        from: "goal:child",
        to: "task:1",
        fromResource: "objective",
        toResource: "task",
        linkType: "DIRECT",
        tags: ["linkTag:1"]
      })
    ]);
  });

  it("converts embedded collection and property arrays into DataFn join rows", () => {
    const backup = createBackup([
      {
        name: "collection",
        keyPath: "id",
        autoIncrement: false,
        indexes: [],
        records: [
          {
            key: "collection:1",
            value: {
              id: "collection:1",
              label: "Areas",
              type: "TYPED",
              resource: "goal",
              properties: ["property:1"],
              views: ["view:1"]
            }
          }
        ]
      },
      {
        name: "goal",
        keyPath: "id",
        autoIncrement: false,
        indexes: [],
        records: [
          {
            key: "goal:1",
            value: {
              id: "goal:1",
              label: "Goal",
              type: "INDEFINITE",
              status: "IN_PROGRESS",
              collections: ["collection:1"],
              properties: [
                {
                  id: "property:1",
                  value: "High",
                  collectionId: "collection:1"
                }
              ]
            }
          }
        ]
      }
    ]);

    const payload = convertLegacyLocalDataBackupToDatafnImport(backup);

    expect(payload.resources.collection).toEqual([
      expect.objectContaining({
        id: "collection:1",
        resource: "objective"
      })
    ]);
    expect(payload.joins?.join_collection_properties_property).toEqual([
      expect.objectContaining({
        from: "collection:1",
        to: "property:1",
        sortOrder: 0
      })
    ]);
    expect(payload.joins?.join_collection_views_view).toEqual([
      expect.objectContaining({
        from: "collection:1",
        to: "view:1",
        sortOrder: 0
      })
    ]);
    expect(payload.joins?.join_objective_collections_collection).toEqual([
      expect.objectContaining({
        from: "goal:1",
        to: "collection:1"
      })
    ]);
    expect(payload.joins?.join_objective_propertyValues_property).toEqual([
      expect.objectContaining({
        from: "goal:1",
        to: "property:1",
        collectionId: "collection:1",
        value: "High"
      })
    ]);
  });
});
