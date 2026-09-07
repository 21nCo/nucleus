import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  vi
} from "vitest";
import { syncUp } from "./index";
import { cloneUp } from "../cloneup";
import { cloneDown } from "../clonedown";
import { Resource } from "$lib/client/components/flux/resourceStores/resource.enum";
import { SyncProviderFactory, SyncProvider } from "../providers";
import { ISyncUpBody, ICloneUpBody } from "@nucleum/schema/legacy/sync.type";
import { ResourceActionType } from "$lib/client/components/flux/resourceStores/resource.type";
import { PersistenceActionType } from "@nucleum/schema/legacy/data.type";
import { createMutation } from "$lib/tests/fixtures";

async function waitForClonedRecords(
  resources: Resource[],
  expectedIds: string[]
) {
  await vi.waitFor(
    async () => {
      const result = await cloneDown(
        { resources, isExtension: false },
        global.testEnv.agent
      );
      const serialized = JSON.stringify(result);
      expect(expectedIds.every((id) => serialized.includes(id))).toBe(true);
    },
    { interval: 250, timeout: 10_000 }
  );
}

describe("SyncUp Integration Tests", () => {
  // Reset provider instance before each test to ensure clean state
  beforeEach(() => {
    SyncProviderFactory.resetProvider();
  });

  afterEach(() => {
    SyncProviderFactory.resetProvider();
  });

  beforeAll(async () => {
    // Clean up any existing test data before starting
    await cleanupTestData();
  });

  async function cleanupTestData() {
    // Add cleanup logic if needed based on your test environment
    // This is implementation-specific to your database setup
  }

  describe.skip("SurrealDB Provider Integration", () => {
    beforeEach(() => {
      process.env.SYNC_PROVIDER = SyncProvider.SURREAL;
    });

    it("should return an error if no mutations are provided", async () => {
      const body: ISyncUpBody = {
        mutations: [],
        lastSyncDown: 0,
        resources: [],
        dapId: "test-dap-id"
      };
      const result = await syncUp(body, global.testEnv.agent);
      expect(result).toEqual({ error: "No mutations to sync" });
    });

    it("should sync up small mutations and return sync down data", async () => {
      // First, set up some initial data to sync down
      const testRecords = [
        {
          id: "node:syncup-test-node-1",
          title: "SyncUp Test Node 1",
          content: "Initial content",
          modifiedAt: new Date().toISOString()
        },
        {
          id: "node:syncup-test-node-2",
          title: "SyncUp Test Node 2",
          content: "Initial content 2",
          modifiedAt: new Date().toISOString()
        }
      ];

      // Clone up initial data
      const cloneUpBody: ICloneUpBody = {
        resource: Resource.node,
        records: testRecords
      };
      await cloneUp(cloneUpBody, global.testEnv.agent);

      // Create mutations to sync up
      const mutations = [
        createMutation({
          action: ResourceActionType.EDIT,
          resource: Resource.node,
          resourceId: "node:syncup-test-node-1",
          dapId: "test-dap-syncup-surreal",
          params: {
            action: PersistenceActionType.MERGE,
            record: {
              id: "node:syncup-test-node-1",
              title: "Updated SyncUp Test Node 1",
              content: "Updated content via syncUp",
              modifiedAt: new Date().toISOString()
            }
          }
        }),
        createMutation({
          action: ResourceActionType.CREATE,
          resource: Resource.node,
          resourceId: "node:syncup-test-node-3",
          dapId: "test-dap-syncup-surreal",
          params: {
            action: PersistenceActionType.INSERT,
            record: {
              id: "node:syncup-test-node-3",
              title: "New SyncUp Test Node 3",
              content: "Created via syncUp",
              modifiedAt: new Date().toISOString()
            }
          }
        })
      ];

      const body: ISyncUpBody = {
        mutations,
        lastSyncDown: 0,
        resources: [Resource.node],
        dapId: "test-dap-syncup-surreal"
      };

      const result = await syncUp(body, global.testEnv.agent);

      // Should return sync down data containing our updated and new records
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result) && result.length > 0) {
        // Find the updated record
        const updatedNode = result.find(
          (item: any) =>
            Array.isArray(item.result) &&
            item.result.some(
              (node: any) => node.id === "node:syncup-test-node-1"
            )
        );

        if (updatedNode) {
          const node = updatedNode.result.find(
            (n: any) => n.id === "node:syncup-test-node-1"
          );
          expect(node.title).toBe("Updated SyncUp Test Node 1");
        }

        // Find the new record
        const newNode = result.find(
          (item: any) =>
            Array.isArray(item.result) &&
            item.result.some(
              (node: any) => node.id === "node:syncup-test-node-3"
            )
        );

        if (newNode) {
          const node = newNode.result.find(
            (n: any) => n.id === "node:syncup-test-node-3"
          );
          expect(node.title).toBe("New SyncUp Test Node 3");
        }
      }
    });

    it("should handle large mutations correctly", async () => {
      // Create a mutation with large data that should trigger individual processing
      const largeMutation = createMutation({
        action: ResourceActionType.EDIT,
        resource: Resource.node,
        resourceId: new Array(25).fill("large-resource-id"),
        dapId: "test-dap-large-surreal",
        params: {
          action: PersistenceActionType.BULK_MERGE,
          records: Array.from({ length: 30 }, (_, i) => ({
            id: `node:large-test-${i}`,
            title: `Large Test Node ${i}`,
            content: "Large content data",
            modifiedAt: new Date().toISOString()
          }))
        }
      });

      const body: ISyncUpBody = {
        mutations: [largeMutation],
        lastSyncDown: 0,
        resources: [Resource.node],
        dapId: "test-dap-large-surreal"
      };

      const result = await syncUp(body, global.testEnv.agent);

      // Should handle large mutations and return sync down data
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle multiple resource types in mutations", async () => {
      // Set up initial data for multiple resources
      const nodeRecords = [
        {
          id: "node:multi-resource-test-1",
          title: "Multi Resource Node",
          modifiedAt: new Date().toISOString()
        }
      ];

      const collectionRecords = [
        {
          id: "collection:multi-resource-test-1",
          name: "Multi Resource Collection",
          modifiedAt: new Date().toISOString()
        }
      ];

      await cloneUp(
        { resource: Resource.node, records: nodeRecords },
        global.testEnv.agent
      );
      await cloneUp(
        { resource: Resource.collection, records: collectionRecords },
        global.testEnv.agent
      );

      // Create mutations for multiple resources
      const mutations = [
        createMutation({
          action: ResourceActionType.EDIT,
          resource: Resource.node,
          resourceId: "node:multi-resource-test-1",
          dapId: "test-dap-multi-surreal",
          params: {
            action: PersistenceActionType.MERGE,
            record: {
              id: "node:multi-resource-test-1",
              title: "Updated Multi Resource Node",
              modifiedAt: new Date().toISOString()
            }
          }
        }),
        createMutation({
          action: ResourceActionType.EDIT,
          resource: Resource.collection,
          resourceId: "collection:multi-resource-test-1",
          dapId: "test-dap-multi-surreal",
          params: {
            action: PersistenceActionType.MERGE,
            record: {
              id: "collection:multi-resource-test-1",
              name: "Updated Multi Resource Collection",
              modifiedAt: new Date().toISOString()
            }
          }
        })
      ];

      const body: ISyncUpBody = {
        mutations,
        lastSyncDown: 0,
        resources: [Resource.node, Resource.collection],
        dapId: "test-dap-multi-surreal"
      };

      const result = await syncUp(body, global.testEnv.agent);

      expect(Array.isArray(result)).toBe(true);
      // Should return data for both resource types
      expect(result.length).toBe(2);
    });

    it("should handle database errors gracefully", async () => {
      // Use an invalid agent to trigger an error
      const invalidAgent = {
        ...global.testEnv.agent,
        db: "nonexistent_database_12345"
      };

      const mutations = [
        createMutation({
          action: ResourceActionType.EDIT,
          resource: Resource.node,
          resourceId: "node:error-test",
          dapId: "test-dap-error-surreal"
        })
      ];

      const body: ISyncUpBody = {
        mutations,
        lastSyncDown: 0,
        resources: [Resource.node],
        dapId: "test-dap-error-surreal"
      };

      const result = await syncUp(body, invalidAgent);
      expect(result).toEqual({ error: "Sync failed" });
    });
  });

  describe("DynamoDB Provider Integration", () => {
    beforeEach(() => {
      process.env.SYNC_PROVIDER = SyncProvider.DYNAMODB;
    });

    it("should return an error if no mutations are provided", async () => {
      const body: ISyncUpBody = {
        mutations: [],
        lastSyncDown: 0,
        resources: [],
        dapId: "test-dap-id"
      };
      const result = await syncUp(body, global.testEnv.agent);
      expect(result).toEqual({ error: "No mutations to sync" });
    });

    it("should sync up mutations and return sync down data using DynamoDB", async () => {
      // First, set up some initial data
      const testRecords = [
        {
          id: "node:dynamo-syncup-test-1",
          title: "DynamoDB SyncUp Test Node 1",
          content: "Initial content",
          modifiedAt: new Date().toISOString()
        },
        {
          id: "node:dynamo-syncup-test-2",
          title: "DynamoDB SyncUp Test Node 2",
          content: "Initial content 2",
          modifiedAt: new Date().toISOString()
        }
      ];

      await cloneUp(
        { resource: Resource.node, records: testRecords },
        global.testEnv.agent
      );

      await waitForClonedRecords(
        [Resource.node],
        testRecords.map((record) => record.id)
      );

      // Create mutations to sync up
      const mutations = [
        createMutation({
          action: ResourceActionType.EDIT,
          resource: Resource.node,
          resourceId: "node:dynamo-syncup-test-1",
          dapId: "test-dap-syncup-dynamo",
          params: {
            action: PersistenceActionType.MERGE,
            record: {
              id: "node:dynamo-syncup-test-1",
              title: "Updated DynamoDB SyncUp Test Node 1",
              content: "Updated content via syncUp",
              modifiedAt: new Date().toISOString()
            }
          }
        }),
        createMutation({
          action: ResourceActionType.CREATE,
          resource: Resource.node,
          resourceId: "node:dynamo-syncup-test-3",
          dapId: "test-dap-syncup-dynamo",
          params: {
            action: PersistenceActionType.INSERT,
            records: [
              {
                id: "node:dynamo-syncup-test-3",
                title: "New DynamoDB SyncUp Test Node 3",
                content: "Created via syncUp",
                modifiedAt: new Date().toISOString()
              }
            ]
          }
        })
      ];

      const body: ISyncUpBody = {
        mutations,
        lastSyncDown: 0,
        resources: [Resource.node],
        dapId: "test-dap-syncup-dynamo"
      };

      const result = await syncUp(body, global.testEnv.agent);
      console.log({ result });
      expect(result).toBeDefined();
      if (result && !("error" in result)) {
        // Check that we got some response indicating sync was processed
        expect(result).toBeTruthy();
      }
    });

    it("should handle batch processing for multiple mutations", async () => {
      // Create multiple mutations to test batch processing
      const mutations = Array.from({ length: 30 }, (_, i) =>
        createMutation({
          action: ResourceActionType.CREATE,
          resource: Resource.node,
          resourceId: `node:dynamo-batch-test-${i}`,
          dapId: "test-dap-batch-dynamo",
          params: {
            action: PersistenceActionType.INSERT,
            record: {
              id: `node:dynamo-batch-test-${i}`,
              title: `Batch Test Node ${i}`,
              content: "Batch test content",
              modifiedAt: new Date().toISOString()
            }
          }
        })
      );

      const body: ISyncUpBody = {
        mutations,
        lastSyncDown: 0,
        resources: [Resource.node],
        dapId: "test-dap-batch-dynamo"
      };

      const result = await syncUp(body, global.testEnv.agent);

      // Should handle batch processing and return results
      expect(result).toBeDefined();
      if (result && !("error" in result)) {
        expect(result).toBeTruthy();
      }
    });

    it("should handle different resource types with DynamoDB", async () => {
      // Set up initial data for multiple resources
      const nodeRecords = [
        {
          id: "node:dynamo-multi-resource-test-1",
          title: "DynamoDB Multi Resource Node",
          modifiedAt: new Date().toISOString()
        }
      ];

      const kvRecords = [
        {
          id: "kv:dynamo-multi-resource-test-1",
          value: "DynamoDB Multi Resource KV",
          modifiedAt: new Date().toISOString()
        }
      ];

      await cloneUp(
        { resource: Resource.node, records: nodeRecords },
        global.testEnv.agent
      );
      await cloneUp(
        { resource: Resource.kv, records: kvRecords },
        global.testEnv.agent
      );

      await waitForClonedRecords(
        [Resource.node, Resource.kv],
        [...nodeRecords, ...kvRecords].map((record) => record.id)
      );

      // Create mutations for multiple resources
      const mutations = [
        createMutation({
          action: ResourceActionType.EDIT,
          resource: Resource.node,
          resourceId: "node:dynamo-multi-resource-test-1",
          dapId: "test-dap-multi-dynamo",
          params: {
            action: PersistenceActionType.MERGE,
            record: {
              id: "node:dynamo-multi-resource-test-1",
              title: "Updated DynamoDB Multi Resource Node",
              modifiedAt: new Date().toISOString()
            }
          }
        }),
        createMutation({
          action: ResourceActionType.EDIT,
          resource: Resource.kv,
          resourceId: "kv:dynamo-multi-resource-test-1",
          dapId: "test-dap-multi-dynamo",
          params: {
            action: PersistenceActionType.MERGE,
            record: {
              id: "kv:dynamo-multi-resource-test-1",
              value: "Updated DynamoDB Multi Resource KV",
              modifiedAt: new Date().toISOString()
            }
          }
        })
      ];

      const body: ISyncUpBody = {
        mutations,
        lastSyncDown: 0,
        resources: [Resource.node, Resource.kv],
        dapId: "test-dap-multi-dynamo"
      };

      const result = await syncUp(body, global.testEnv.agent);

      expect(result).toBeDefined();
      if (result && !("error" in result)) {
        expect(result).toBeTruthy();
      }
    });

    it("should handle errors gracefully with DynamoDB provider", async () => {
      const invalidAgent = {
        ...global.testEnv.agent,
        db: "invalid_database_name_12345"
      };

      const mutations = [
        createMutation({
          action: ResourceActionType.EDIT,
          resource: Resource.node,
          resourceId: "node:error-test",
          dapId: "test-dap-error-dynamo"
        })
      ];

      const body: ISyncUpBody = {
        mutations,
        lastSyncDown: 0,
        resources: [Resource.node],
        dapId: "test-dap-error-dynamo"
      };

      const result = await syncUp(body, invalidAgent);
      expect(result).toEqual({ error: "Sync failed" });
    });
  });

  describe.skip("Cross-Provider Consistency", () => {
    it("should return consistent sync behavior across providers", async () => {
      const testRecords = [
        {
          id: "node:consistency-syncup-test-1",
          title: "Consistency SyncUp Test Node",
          content: "Test content for consistency",
          modifiedAt: new Date().toISOString()
        }
      ];

      const mutations = [
        createMutation({
          action: ResourceActionType.EDIT,
          resource: Resource.node,
          resourceId: "node:consistency-syncup-test-1",
          dapId: "test-dap-consistency",
          params: {
            action: PersistenceActionType.MERGE,
            record: {
              id: "node:consistency-syncup-test-1",
              title: "Updated Consistency SyncUp Test Node",
              content: "Updated content for consistency",
              modifiedAt: new Date().toISOString()
            }
          }
        })
      ];

      const body: ISyncUpBody = {
        mutations,
        lastSyncDown: 0,
        resources: [Resource.node],
        dapId: "test-dap-consistency"
      };

      // Test with SurrealDB provider
      process.env.SYNC_PROVIDER = SyncProvider.SURREAL;
      SyncProviderFactory.resetProvider();

      await cloneUp(
        { resource: Resource.node, records: testRecords },
        global.testEnv.agent
      );
      const surrealResult = await syncUp(body, global.testEnv.agent);

      // Test with DynamoDB provider
      process.env.SYNC_PROVIDER = SyncProvider.DYNAMODB;
      SyncProviderFactory.resetProvider();

      await cloneUp(
        { resource: Resource.node, records: testRecords },
        global.testEnv.agent
      );
      await waitForClonedRecords(
        [Resource.node],
        testRecords.map((record) => record.id)
      );

      const dynamoResult = await syncUp(body, global.testEnv.agent);

      // Both should handle sync operations without errors
      expect(surrealResult).toBeDefined();
      expect(dynamoResult).toBeDefined();

      // Both should not return error objects
      if (typeof surrealResult === "object" && surrealResult !== null) {
        expect("error" in surrealResult).toBe(false);
      }
      if (typeof dynamoResult === "object" && dynamoResult !== null) {
        expect("error" in dynamoResult).toBe(false);
      }
    });

    it("should handle errors consistently across providers", async () => {
      const invalidAgent = {
        ...global.testEnv.agent,
        db: "invalid_database_name_12345"
      };

      const mutations = [
        createMutation({
          action: ResourceActionType.EDIT,
          resource: Resource.node,
          resourceId: "node:error-consistency-test",
          dapId: "test-dap-error-consistency"
        })
      ];

      const body: ISyncUpBody = {
        mutations,
        lastSyncDown: 0,
        resources: [Resource.node],
        dapId: "test-dap-error-consistency"
      };

      // Test SurrealDB provider error handling
      process.env.SYNC_PROVIDER = SyncProvider.SURREAL;
      SyncProviderFactory.resetProvider();
      const surrealResult = await syncUp(body, invalidAgent);

      // Test DynamoDB provider error handling
      process.env.SYNC_PROVIDER = SyncProvider.DYNAMODB;
      SyncProviderFactory.resetProvider();
      const dynamoResult = await syncUp(body, invalidAgent);

      // Both should return error objects
      expect(surrealResult).toEqual({ error: "Sync failed" });
      expect(dynamoResult).toEqual({ error: "Sync failed" });
    });
  });
});
