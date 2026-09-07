import { Product } from "@21n/types/product.type";

import type { DatafnSeedTransport } from "../../fixtures/datafn-seed";

export type SeededCollection = {
  id: string;
  label: string;
  viewId: string;
};

export type SeededObjectiveCollection = {
  alphaLabel: string;
  alphaObjectiveLabel: string;
  betaLabel: string;
  betaObjectiveLabel: string;
  collectionId: string;
  collectionName: string;
  propertyLabel: string;
};

export type SeedCollectionOptions = {
  isStarred?: boolean;
  label?: string;
  prefix?: string;
  resource?: "node" | "objective";
};

/** Seeds collections together with their required default view relation. */
export class CollectionSeed {
  constructor(private readonly transport: DatafnSeedTransport) {}

  /** Seeds one collection and its default board view. */
  async collection(options: SeedCollectionOptions = {}) {
    const [collection] = await this.collections(1, options);
    return collection;
  }

  /** Seeds multiple collections with valid default views. */
  async collections(count: number, options: SeedCollectionOptions = {}) {
    const collections = Array.from({ length: count }, (_, index) => {
      const id = this.transport.createId("collection");
      const viewId = this.transport.createId("view");
      const label =
        count === 1 && options.label
          ? options.label
          : this.transport.createLabel(
              `${options.prefix ?? "E2E collection"}${count > 1 ? ` ${index + 1}` : ""}`
            );
      return { id, label, viewId };
    });
    await this.transport.mutate(
      "view",
      collections.map((collection) => ({
        operation: "insert",
        id: collection.viewId,
        record: {
          id: collection.viewId,
          label: "Default",
          layout: "BOARD",
          tabBy: "none",
          groupBy: "none",
          subGroupBy: "none"
        }
      }))
    );
    const resource =
      options.resource ??
      (this.transport.projectName === Product.POINTRON ? "objective" : "node");
    for (const collection of collections) {
      await this.transport.mutate("collection", [
        {
          operation: "insert",
          id: collection.id,
          record: {
            id: collection.id,
            label: collection.label,
            description: "",
            isCaptureShortcutEnabled: true,
            isStarred: options.isStarred ?? false,
            resource,
            type: "TYPED",
            typeToExtend: ""
          }
        },
        {
          operation: "relate",
          id: collection.id,
          relations: {
            views: [{ $ref: collection.viewId, sortOrder: 0 }]
          }
        }
      ]);
    }
    return collections;
  }

  /** Changes archive state through the collection domain helper. */
  async setArchived(
    collection: SeededCollection | string,
    isArchived: boolean
  ) {
    await this.transport.mutate(
      "collection",
      {
        operation: isArchived ? "archive" : "unarchive",
        id: typeof collection === "string" ? collection : collection.id,
        context: "library"
      },
      { trackInserts: false }
    );
  }

  /** Seeds an objective collection configured with a tabbed single-select property. */
  async objectivePropertyView(): Promise<SeededObjectiveCollection> {
    const collectionId = this.transport.createId("collection");
    const propertyId = this.transport.createId("property");
    const viewId = this.transport.createId("view");
    const alphaObjectiveId = this.transport.createId("objective");
    const betaObjectiveId = this.transport.createId("objective");
    const collectionName = this.transport.createLabel("E2E objective props");
    const propertyLabel = this.transport.createLabel("E2E Status");
    const alphaLabel = this.transport.createLabel("Alpha");
    const betaLabel = this.transport.createLabel("Beta");
    const alphaValue = this.transport.createEmbeddedId("option");
    const betaValue = this.transport.createEmbeddedId("option");
    const alphaObjectiveLabel = this.transport.createLabel(
      "E2E objective alpha"
    );
    const betaObjectiveLabel = this.transport.createLabel("E2E objective beta");
    await this.transport.mutate("property", {
      operation: "insert",
      id: propertyId,
      record: {
        id: propertyId,
        label: propertyLabel,
        type: "single-select",
        resource: "objective",
        config: {
          options: [
            { id: alphaValue, label: alphaLabel },
            { id: betaValue, label: betaLabel }
          ],
          groups: []
        },
        order: 0
      }
    });
    await this.transport.mutate("view", {
      operation: "insert",
      id: viewId,
      record: {
        id: viewId,
        label: "Default",
        layout: "BOARD",
        tabBy: propertyId,
        groupBy: "none",
        subGroupBy: "none",
        properties: [propertyId],
        arrangement: "LIST",
        density: 1
      }
    });
    await this.transport.mutate("collection", [
      {
        operation: "insert",
        id: collectionId,
        record: {
          id: collectionId,
          label: collectionName,
          type: "TYPED",
          resource: "objective"
        }
      },
      {
        operation: "relate",
        id: collectionId,
        relations: {
          properties: [{ $ref: propertyId, sortOrder: 0 }],
          views: [{ $ref: viewId, sortOrder: 0 }]
        }
      }
    ]);
    await this.transport.mutate("objective", [
      {
        operation: "insert",
        id: alphaObjectiveId,
        record: {
          id: alphaObjectiveId,
          label: alphaObjectiveLabel,
          type: "INDEFINITE",
          status: "NOT_STARTED",
          isPinnedForQuickFocus: false
        }
      },
      {
        operation: "insert",
        id: betaObjectiveId,
        record: {
          id: betaObjectiveId,
          label: betaObjectiveLabel,
          type: "INDEFINITE",
          status: "NOT_STARTED",
          isPinnedForQuickFocus: false
        }
      },
      {
        operation: "relate",
        id: alphaObjectiveId,
        relations: {
          collections: [
            {
              $ref: collectionId,
              fromResource: "objective",
              sortOrder: 0
            }
          ],
          propertyValues: [
            {
              $ref: propertyId,
              fromResource: "objective",
              collectionId,
              value: alphaValue
            }
          ]
        }
      },
      {
        operation: "relate",
        id: betaObjectiveId,
        relations: {
          collections: [
            {
              $ref: collectionId,
              fromResource: "objective",
              sortOrder: 1
            }
          ],
          propertyValues: [
            {
              $ref: propertyId,
              fromResource: "objective",
              collectionId,
              value: betaValue
            }
          ]
        }
      }
    ]);
    return {
      alphaLabel,
      alphaObjectiveLabel,
      betaLabel,
      betaObjectiveLabel,
      collectionId,
      collectionName,
      propertyLabel
    };
  }
}
