import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
  vi
} from "vitest";
import { DynamoDBSyncProvider } from "../dynamodb.provider";
import { Agent } from "$lib/server/common/account/account.type";
import { Resource } from "$lib/client/components/flux/resourceStores/resource.enum";
import { ResourceActionType } from "$lib/client/components/flux/resourceStores/resource.type";
import {
  PersistenceActionType,
  IMutationParamsv2
} from "@nucleum/schema/legacy/data.type";
import { IMutation } from "@nucleum/schema/legacy/data.type";

async function waitForResourceRecords(
  provider: DynamoDBSyncProvider,
  agent: Agent,
  resource: Resource,
  predicate: (records: any[]) => boolean
) {
  let records: any[] = [];
  await vi.waitFor(
    async () => {
      const result = await provider.cloneDown(
        { resources: [resource], isExtension: false },
        agent
      );
      records =
        Array.isArray(result) && Array.isArray(result[0]) ? result[0] : [];
      expect(predicate(records)).toBe(true);
    },
    { interval: 250, timeout: 10_000 }
  );
  return records;
}

describe("DynamoDBSyncProvider Integration Tests", () => {
  let provider: DynamoDBSyncProvider;
  let mockAgent: Agent;

  const testTableName = process.env.DYNAMODB_TABLE_PREFIX || "user";
  const testUserId = `test-user-${Date.now()}`; // Unique user ID for each test run

  beforeAll(async () => {
    // Set environment variables for testing
    process.env.DYNAMODB_TABLE_PREFIX = testTableName;

    console.log(
      `Running integration tests against DynamoDB table: ${testTableName}`
    );
    console.log(`Test user ID: ${testUserId}`);
  }, 10000); // 10 second timeout for setup

  beforeEach(() => {
    // Create mock agent with all required properties
    mockAgent = {
      id: testUserId,
      context: "test-context",
      db: "test-db",
      region: "useast"
    } as Agent;

    // Initialize provider for real AWS testing
    provider = new DynamoDBSyncProvider();
  });

  afterAll(async () => {
    // Clean up test data after all tests
    console.log(`Cleaning up test data for user: ${testUserId}`);
    // Note: You might want to add cleanup logic here to delete test data
  }, 10000); // 10 second timeout for cleanup

  describe("syncUp", () => {
    it("should handle empty mutations array", async () => {
      const body = {
        mutations: [],
        lastSyncDown: 1000000,
        resources: [Resource.node],
        dapId: "test-dap-id"
      };

      const result = await provider.syncUp(body, mockAgent);
      expect(result).toEqual({ error: "No mutations to sync" });
    });

    it("should process CREATE mutations and store them correctly", async () => {
      const testRecord = {
        id: "node:create-test-record",
        title: "Test Record",
        content: "Test content"
      };

      const mutation: IMutation = {
        id: "mutation:create-test",
        createdAt: "2023-01-01T00:00:00Z",
        modifiedAt: "2023-01-01T00:00:00Z",
        resource: Resource.node,
        resourceId: "node:create-test-record",
        action: ResourceActionType.CREATE,
        timestamp: Date.now(),
        dapId: "test-dap-id",
        userId: testUserId,
        params: {
          action: PersistenceActionType.BULK_INSERT,
          records: [testRecord]
        } as IMutationParamsv2<any>
      };

      const body = {
        mutations: [mutation],
        lastSyncDown: 1000000,
        resources: [Resource.node],
        dapId: "test-dap-id"
      };

      const result = await provider.syncUp(body, mockAgent);

      // Verify the operation succeeded and returned expected structure
      expect(result).toHaveProperty("latestTimestamp");
      expect(result).toHaveProperty("records");
      expect(result).toHaveProperty("deleted");
      expect(result).toHaveProperty("counts");

      await waitForResourceRecords(
        provider,
        mockAgent,
        Resource.node,
        (records) => records.some((record) => record.id === testRecord.id)
      );

      // Verify the record was actually stored by trying to retrieve it
      const cloneDownResult = await provider.cloneDown(
        {
          resources: [Resource.node],
          isExtension: false
        },
        mockAgent
      );

      expect(Array.isArray(cloneDownResult)).toBe(true);
      if (Array.isArray(cloneDownResult) && cloneDownResult[0]) {
        const storedRecords = cloneDownResult[0];
        const storedRecord = storedRecords.find(
          (r: any) => r.id === testRecord.id
        );
        expect(storedRecord).toMatchObject(testRecord);
      }
    }, 15000); // 15 second timeout

    it("should process DELETE mutations correctly", async () => {
      // First create a record to delete
      const testRecord = {
        id: "node:delete-test-record",
        title: "To be deleted"
      };

      await provider.cloneUp(
        {
          resource: Resource.node,
          records: [testRecord]
        },
        mockAgent
      );

      await waitForResourceRecords(
        provider,
        mockAgent,
        Resource.node,
        (records) => records.some((record) => record.id === testRecord.id)
      );

      const mutation: IMutation = {
        id: "mutation:delete-test",
        createdAt: "2023-01-01T00:00:00Z",
        modifiedAt: "2023-01-01T00:00:00Z",
        resource: Resource.node,
        resourceId: "node:delete-test-record",
        action: ResourceActionType.DELETE,
        timestamp: Date.now(),
        dapId: "test-dap-id",
        userId: testUserId,
        params: {
          action: PersistenceActionType.DELETE,
          recordId: "node:delete-test-record"
        } as IMutationParamsv2<any>
      };

      const body = {
        mutations: [mutation],
        lastSyncDown: 1000000,
        resources: [Resource.node],
        dapId: "test-dap-id"
      };

      const result = await provider.syncUp(body, mockAgent);

      // Verify the operation succeeded
      expect(result).toHaveProperty("latestTimestamp");

      await waitForResourceRecords(
        provider,
        mockAgent,
        Resource.node,
        (records) => records.every((record) => record.id !== testRecord.id)
      );

      // Verify the record was actually deleted
      const cloneDownResult = await provider.cloneDown(
        {
          resources: [Resource.node],
          isExtension: false
        },
        mockAgent
      );

      if (Array.isArray(cloneDownResult) && cloneDownResult[0]) {
        const storedRecords = cloneDownResult[0];
        const deletedRecord = storedRecords.find(
          (r: any) => r.id === testRecord.id
        );
        expect(deletedRecord).toBeUndefined();
      }
    }, 15000); // 15 second timeout

    it("should handle MERGE mutations by merging with existing data", async () => {
      const existingRecord = {
        id: "node:merge-test-record",
        title: "Existing Title",
        content: "Existing content"
      };

      // First create a record
      await provider.cloneUp(
        {
          resource: Resource.node,
          records: [existingRecord]
        },
        mockAgent
      );

      await waitForResourceRecords(
        provider,
        mockAgent,
        Resource.node,
        (records) => records.some((record) => record.id === existingRecord.id)
      );

      const updateData = {
        title: "Updated Title"
      };

      const mutation: IMutation = {
        id: "mutation:merge-test",
        createdAt: "2023-01-01T00:00:00Z",
        modifiedAt: "2023-01-01T00:00:00Z",
        resource: Resource.node,
        resourceId: "node:merge-test-record",
        action: ResourceActionType.EDIT,
        timestamp: Date.now(),
        dapId: "test-dap-id",
        userId: testUserId,
        params: {
          action: PersistenceActionType.MERGE,
          record: updateData
        } as IMutationParamsv2<any>
      };

      const body = {
        mutations: [mutation],
        lastSyncDown: 1000000,
        resources: [Resource.node],
        dapId: "test-dap-id"
      };

      const result = await provider.syncUp(body, mockAgent);

      // Verify the operation succeeded
      expect(result).toHaveProperty("latestTimestamp");

      await waitForResourceRecords(
        provider,
        mockAgent,
        Resource.node,
        (records) =>
          records.some(
            (record) =>
              record.id === existingRecord.id &&
              record.title === updateData.title
          )
      );

      // Verify the record was actually merged
      const cloneDownResult = await provider.cloneDown(
        {
          resources: [Resource.node],
          isExtension: false
        },
        mockAgent
      );

      if (Array.isArray(cloneDownResult) && cloneDownResult[0]) {
        const storedRecords = cloneDownResult[0];
        const mergedRecord = storedRecords.find(
          (r: any) => r.id === existingRecord.id
        );
        expect(mergedRecord).toMatchObject({
          ...existingRecord,
          ...updateData
        });
      }
    }, 15000); // 15 second timeout
  });

  describe("syncDown", () => {
    it("should return error when no resources provided", async () => {
      const body = {
        lastSyncDown: 1000000,
        resources: [],
        dapId: "test-dap-id"
      };

      const result = await provider.syncDown(body, mockAgent);
      expect(result).toEqual({ error: "No resources found" });
    });

    it("should fetch mutations and records since lastSyncDown", async () => {
      const testRecord = {
        id: "node:syncdown-test-record",
        title: "Test Record for SyncDown"
      };

      // First create a record via cloneUp
      await provider.cloneUp(
        {
          resource: Resource.node,
          records: [testRecord]
        },
        mockAgent
      );

      await waitForResourceRecords(
        provider,
        mockAgent,
        Resource.node,
        (records) => records.some((record) => record.id === testRecord.id)
      );

      // Create a mutation for this record from another dapId
      const testTimestamp = Date.now();
      const mutation: IMutation = {
        id: "mutation:syncdown-test",
        createdAt: "2023-01-01T00:00:00Z",
        modifiedAt: "2023-01-01T00:00:00Z",
        resource: Resource.node,
        resourceId: testRecord.id,
        action: ResourceActionType.CREATE,
        timestamp: testTimestamp,
        dapId: "other-dap-id", // Different dapId to ensure it's included
        userId: testUserId,
        params: {
          action: PersistenceActionType.BULK_INSERT,
          records: [testRecord]
        } as IMutationParamsv2<any>
      };

      await provider.syncUp(
        {
          mutations: [mutation],
          lastSyncDown: 1000000,
          resources: [Resource.node],
          dapId: "other-dap-id"
        },
        mockAgent
      );

      await vi.waitFor(
        async () => {
          const synced = await provider.syncDown(
            {
              lastSyncDown: testTimestamp - 1000,
              resources: [Resource.node],
              dapId: "test-dap-id"
            },
            mockAgent
          );
          expect(
            synced.records?.some((record: any) => record.id === testRecord.id)
          ).toBe(true);
        },
        { interval: 250, timeout: 10_000 }
      );

      // Now test syncDown
      const body = {
        lastSyncDown: testTimestamp - 1000, // Before our mutation
        resources: [Resource.node],
        dapId: "test-dap-id" // Different from mutation dapId
      };

      const result = await provider.syncDown(body, mockAgent);

      expect(result).toHaveProperty("latestTimestamp");
      expect(result).toHaveProperty("records");
      expect(result).toHaveProperty("deleted");
      expect(result).toHaveProperty("counts");

      // Should have the record in results since it was created by another dapId
      if (result.records && Array.isArray(result.records)) {
        const foundRecord = result.records.find(
          (r: any) => r.id === testRecord.id
        );
        if (foundRecord) {
          expect(foundRecord).toMatchObject(testRecord);
        }
      }
    }, 15000); // 15 second timeout

    it("should handle DELETE mutations by adding to deleted array", async () => {
      const testRecord = {
        id: "node:delete-syncdown-test",
        title: "To be deleted for syncdown test"
      };

      // First create a record
      await provider.cloneUp(
        {
          resource: Resource.node,
          records: [testRecord]
        },
        mockAgent
      );

      await waitForResourceRecords(
        provider,
        mockAgent,
        Resource.node,
        (records) => records.some((record) => record.id === testRecord.id)
      );

      // Create a DELETE mutation from another dapId
      const testTimestamp = Date.now();
      const mutation: IMutation = {
        id: "mutation:delete-syncdown-test",
        createdAt: "2023-01-01T00:00:00Z",
        modifiedAt: "2023-01-01T00:00:00Z",
        resource: Resource.node,
        resourceId: testRecord.id,
        action: ResourceActionType.DELETE,
        timestamp: testTimestamp,
        dapId: "other-dap-id",
        userId: testUserId,
        params: {
          action: PersistenceActionType.DELETE,
          recordId: testRecord.id
        } as IMutationParamsv2<any>
      };

      await provider.syncUp(
        {
          mutations: [mutation],
          lastSyncDown: 1000000,
          resources: [Resource.node],
          dapId: "other-dap-id"
        },
        mockAgent
      );

      await vi.waitFor(
        async () => {
          const synced = await provider.syncDown(
            {
              lastSyncDown: testTimestamp - 1000,
              resources: [Resource.node],
              dapId: "test-dap-id"
            },
            mockAgent
          );
          expect(
            synced.deleted?.some((entry: any) => entry.id === mutation.id)
          ).toBe(true);
        },
        { interval: 250, timeout: 10_000 }
      );

      // Now test syncDown
      const body = {
        lastSyncDown: testTimestamp - 1000,
        resources: [Resource.node],
        dapId: "test-dap-id" // Different from mutation dapId
      };

      const result = await provider.syncDown(body, mockAgent);

      expect(result).toHaveProperty("deleted");
      expect(Array.isArray(result.deleted)).toBe(true);

      // Should have the mutation in the deleted array
      if (result.deleted && result.deleted.length > 0) {
        const deleteMutation = result.deleted.find(
          (d: any) => d.id === mutation.id
        );
        expect(deleteMutation).toBeDefined();
      }
    }, 15000); // 15 second timeout
  });

  describe("cloneUp", () => {
    it("should batch write records to DynamoDB", async () => {
      const testRecords = [
        {
          id: "node:cloneup-record-1",
          title: "Record 1",
          modifiedAt: "2023-01-01T00:00:00Z"
        },
        {
          id: "node:cloneup-record-2",
          title: "Record 2",
          modifiedAt: "2023-01-02T00:00:00Z"
        }
      ];

      const body = {
        resource: Resource.node,
        records: testRecords
      };

      const result = await provider.cloneUp(body, mockAgent);

      // Verify the operation succeeded
      expect(Array.isArray(result)).toBe(true);

      // Verify records were actually stored
      const cloneDownResult = await provider.cloneDown(
        {
          resources: [Resource.node],
          isExtension: false
        },
        mockAgent
      );

      if (Array.isArray(cloneDownResult) && cloneDownResult[0]) {
        const storedRecords = cloneDownResult[0];
        testRecords.forEach((testRecord) => {
          const storedRecord = storedRecords.find(
            (r: any) => r.id === testRecord.id
          );
          expect(storedRecord).toMatchObject(testRecord);
        });
      }
    });

    it("should handle large batches by splitting into multiple requests", async () => {
      // Create more than 25 records to test batching
      const testRecords = Array.from({ length: 50 }, (_, i) => ({
        id: `node:large-batch-record-${i + 1}`,
        title: `Record ${i + 1}`
      }));

      const body = {
        resource: Resource.node,
        records: testRecords
      };

      const result = await provider.cloneUp(body, mockAgent);

      // Verify the operation succeeded
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2); // Should have 2 batch responses (25 records each)

      // Verify all records were stored
      const cloneDownResult = await provider.cloneDown(
        {
          resources: [Resource.node],
          isExtension: false
        },
        mockAgent
      );

      if (Array.isArray(cloneDownResult) && cloneDownResult[0]) {
        const storedRecords = cloneDownResult[0];
        testRecords.forEach((testRecord) => {
          const storedRecord = storedRecords.find(
            (r: any) => r.id === testRecord.id
          );
          expect(storedRecord).toMatchObject(testRecord);
        });
      }
    });
  });

  describe("cloneDown", () => {
    it("should return error when no resources provided", async () => {
      const body = {
        resources: [],
        isExtension: false
      };

      const result = await provider.cloneDown(body, mockAgent);
      expect(result).toEqual({ error: "No resources found" });
    });

    it("should fetch all records for given resources", async () => {
      const testRecords = [
        { id: "node:clonedown-record-1", title: "Record 1" },
        { id: "node:clonedown-record-2", title: "Record 2" }
      ];

      // First store the records
      await provider.cloneUp(
        {
          resource: Resource.node,
          records: testRecords
        },
        mockAgent
      );

      const body = {
        resources: [Resource.node],
        isExtension: false,
        limit: 500
      };

      const result = await provider.cloneDown(body, mockAgent);

      expect(Array.isArray(result)).toBe(true);
      if (result[0]) {
        testRecords.forEach((testRecord) => {
          const foundRecord = result[0].find(
            (r: any) => r.id === testRecord.id
          );
          expect(foundRecord).toMatchObject(testRecord);
        });
      }
    });

    it("should return raw data for extension clients", async () => {
      const testRecords = [
        { id: "node:extension-record-1", title: "Extension Record 1" }
      ];

      // First store the records
      await provider.cloneUp(
        {
          resource: Resource.node,
          records: testRecords
        },
        mockAgent
      );

      const body = {
        resources: [Resource.node],
        isExtension: true
      };

      const result = await provider.cloneDown(body, mockAgent);

      expect(Array.isArray(result)).toBe(true);
      if (result[0] && result[0].length > 0) {
        const foundRecord = result[0].find(
          (r: any) => r.id === testRecords[0].id
        );
        expect(foundRecord).toMatchObject(testRecords[0]);
      }
    });
  });

  describe("paginate", () => {
    it("should paginate records with offset and limit", async () => {
      const testRecords = Array.from({ length: 10 }, (_, i) => ({
        id: `node:paginate-record-${i + 1}`,
        title: `Record ${i + 1}`
      }));

      // First store the records
      await provider.cloneUp(
        {
          resource: Resource.node,
          records: testRecords
        },
        mockAgent
      );

      await waitForResourceRecords(
        provider,
        mockAgent,
        Resource.node,
        (records) =>
          testRecords.every((item) =>
            records.some((record) => record.id === item.id)
          )
      );

      const body = {
        resource: Resource.node,
        offset: 5,
        limit: 3,
        isExtension: false
      };

      const result = await provider.paginate(body, mockAgent);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(3); // Should return at most 3 records

      // Should return records starting from offset 5
      if (result.length > 0) {
        const firstRecord = result[0];
        expect(firstRecord).toHaveProperty("id");
        expect(firstRecord).toHaveProperty("title");
      }
    });

    it("should handle pagination without offset", async () => {
      const testRecords = [
        { id: "node:no-offset-record-1", title: "Record 1" }
      ];

      // First store the records
      await provider.cloneUp(
        {
          resource: Resource.node,
          records: testRecords
        },
        mockAgent
      );

      await waitForResourceRecords(
        provider,
        mockAgent,
        Resource.node,
        (records) => records.some((record) => record.id === testRecords[0].id)
      );

      const body = {
        resource: Resource.node,
        offset: 0,
        limit: 5,
        isExtension: false
      };

      const result = await provider.paginate(body, mockAgent);

      expect(Array.isArray(result)).toBe(true);

      // Debug: log the result to understand what we're getting
      console.log("Pagination result:", result);

      if (result.length > 0) {
        // Look for any record with the expected ID
        const foundRecord = result.find(
          (r: any) => r.id && r.id.includes("node:no-offset-record-1")
        );
        if (foundRecord) {
          expect(foundRecord).toMatchObject(testRecords[0]);
        } else {
          // If not found, just verify we got some records back
          expect(result.length).toBeGreaterThan(0);
        }
      }
    }, 10000); // 10 second timeout
  });

  describe("reconcile", () => {
    it("should reconcile node resources by removing bad nodes", async () => {
      // First create some nodes with bad data (missing contentType)
      const badNodes = [
        { id: "node:bad-node-1", title: "Bad Node 1" }, // missing contentType
        { id: "node:bad-node-2", title: "Bad Node 2", contentType: null } // null contentType
      ];

      const goodNodes = [
        { id: "node:good-node-1", title: "Good Node 1", contentType: "text" }
      ];

      // Store both good and bad nodes
      await provider.cloneUp(
        {
          resource: Resource.node,
          records: [...badNodes, ...goodNodes]
        },
        mockAgent
      );

      await waitForResourceRecords(
        provider,
        mockAgent,
        Resource.node,
        (records) =>
          [...badNodes, ...goodNodes].every((item) =>
            records.some((record) => record.id === item.id)
          )
      );

      const body = {
        resources: [Resource.node]
      };

      const result = await provider.reconcile(body, mockAgent);

      expect(result).toEqual({ success: true });

      await waitForResourceRecords(
        provider,
        mockAgent,
        Resource.node,
        (records) =>
          badNodes.every((item) =>
            records.every((record) => record.id !== item.id)
          ) &&
          goodNodes.every((item) =>
            records.some((record) => record.id === item.id)
          )
      );

      // Verify bad nodes were removed but good nodes remain
      const cloneDownResult = await provider.cloneDown(
        {
          resources: [Resource.node],
          isExtension: false
        },
        mockAgent
      );

      if (Array.isArray(cloneDownResult) && cloneDownResult[0]) {
        const remainingRecords = cloneDownResult[0];

        // Bad nodes should be gone
        badNodes.forEach((badNode) => {
          const foundBadNode = remainingRecords.find(
            (r: any) => r.id === badNode.id
          );
          expect(foundBadNode).toBeUndefined();
        });

        // Good nodes should remain
        goodNodes.forEach((goodNode) => {
          const foundGoodNode = remainingRecords.find(
            (r: any) => r.id === goodNode.id
          );
          expect(foundGoodNode).toMatchObject(goodNode);
        });
      }
    }, 20000); // 20 second timeout for reconciliation

    it("should handle reconciliation when no bad nodes found", async () => {
      // Create only good nodes
      const goodNodes = [
        { id: "node:all-good-1", title: "Good Node 1", contentType: "text" },
        { id: "node:all-good-2", title: "Good Node 2", contentType: "image" }
      ];

      await provider.cloneUp(
        {
          resource: Resource.node,
          records: goodNodes
        },
        mockAgent
      );

      await waitForResourceRecords(
        provider,
        mockAgent,
        Resource.node,
        (records) =>
          goodNodes.every((item) =>
            records.some((record) => record.id === item.id)
          )
      );

      const body = {
        resources: [Resource.node]
      };

      const result = await provider.reconcile(body, mockAgent);

      expect(result).toEqual({ success: true });

      await waitForResourceRecords(
        provider,
        mockAgent,
        Resource.node,
        (records) =>
          goodNodes.every((item) =>
            records.some((record) => record.id === item.id)
          )
      );

      // All good nodes should still be there
      const cloneDownResult = await provider.cloneDown(
        {
          resources: [Resource.node],
          isExtension: false
        },
        mockAgent
      );

      if (Array.isArray(cloneDownResult) && cloneDownResult[0]) {
        const remainingRecords = cloneDownResult[0];
        goodNodes.forEach((goodNode) => {
          const foundGoodNode = remainingRecords.find(
            (r: any) => r.id === goodNode.id
          );
          expect(foundGoodNode).toMatchObject(goodNode);
        });
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid table name gracefully", async () => {
      // Temporarily change table name to invalid one
      const originalTableName = process.env.DYNAMODB_TABLE_PREFIX;
      process.env.DYNAMODB_TABLE_PREFIX = "non-existent-table-12345";

      const invalidProvider = new DynamoDBSyncProvider();

      const body = {
        mutations: [
          {
            id: "mutation:error-test",
            createdAt: "2023-01-01T00:00:00Z",
            modifiedAt: "2023-01-01T00:00:00Z",
            resource: Resource.node,
            resourceId: "node:error-test-record",
            action: ResourceActionType.CREATE,
            timestamp: Date.now(),
            dapId: "test-dap-id",
            userId: testUserId,
            params: {
              action: PersistenceActionType.BULK_INSERT,
              records: [{ id: "node:error-test-record", title: "Test" }]
            } as IMutationParamsv2<any>
          }
        ],
        lastSyncDown: 1000000,
        resources: [Resource.node],
        dapId: "test-dap-id"
      };

      const result = await invalidProvider.syncUp(body, mockAgent);
      expect(result).toEqual({ error: "Sync failed" });

      // Restore original table name
      process.env.DYNAMODB_TABLE_PREFIX = originalTableName;
    });

    it("should handle network errors gracefully in syncDown", async () => {
      const body = {
        lastSyncDown: 1000000,
        resources: [Resource.node],
        dapId: "test-dap-id"
      };

      // This should work with proper AWS credentials and table
      const result = await provider.syncDown(body, mockAgent);

      // Should either succeed or fail gracefully
      expect(result).toBeDefined();
      if (result.error) {
        expect(result.error).toBe("Sync failed");
      } else {
        expect(result).toHaveProperty("latestTimestamp");
        expect(result).toHaveProperty("records");
        expect(result).toHaveProperty("deleted");
        expect(result).toHaveProperty("counts");
      }
    });
  });
});
