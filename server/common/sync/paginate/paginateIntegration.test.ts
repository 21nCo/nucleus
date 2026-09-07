import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { paginate } from "./index";
import { cloneUp } from "../cloneup";
import { cloneDown } from "../clonedown";
import {
  ICloneUpBody,
  ICloneDownPaginateBody
} from "@nucleum/schema/legacy/sync.type";
import { Resource } from "$lib/client/components/flux/resourceStores/resource.enum";
import { SyncProvider, SyncProviderFactory } from "../providers";

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

describe("Paginate Integration Tests", () => {
  beforeAll(async () => {
    // Clean up any existing test data before starting
    await cleanupTestData();
  });

  afterAll(async () => {
    // Clean up test data after tests complete
    await cleanupTestData();
  });

  async function cleanupTestData() {
    // Add cleanup logic if needed based on your test environment
    // This is implementation-specific to your database setup
  }

  describe.skip("SurrealDB Provider Integration", () => {
    beforeAll(() => {
      process.env.SYNC_PROVIDER = SyncProvider.SURREAL;
      SyncProviderFactory.resetProvider();
    });

    it("should paginate nodes for non-extension clients", async () => {
      // First, clone up some test data
      const testRecords = Array.from({ length: 20 }, (_, i) => ({
        id: `node:paginate-integration-test-${i + 1}`,
        title: `Paginate Integration Test Node ${i + 1}`,
        content: `Test content ${i + 1}`,
        modifiedAt: new Date().toISOString()
      }));

      const cloneUpBody: ICloneUpBody = {
        resource: Resource.node,
        records: testRecords
      };

      await cloneUp(cloneUpBody, global.testEnv.agent);

      // Now paginate the data - first page
      const paginateBody: ICloneDownPaginateBody = {
        resource: Resource.node,
        isExtension: false,
        offset: 0,
        limit: 5
      };

      const firstPageResult = await paginate(
        paginateBody,
        global.testEnv.agent
      );

      expect(Array.isArray(firstPageResult)).toBe(true);
      expect(firstPageResult.length).toBeLessThanOrEqual(5);

      // Check that results contain our test records
      if (firstPageResult.length > 0) {
        const testNode = firstPageResult.find((node: any) =>
          node.id?.startsWith("node:paginate-integration-test-")
        );
        if (testNode) {
          expect(testNode.title).toMatch(/Paginate Integration Test Node \d+/);
        }
      }

      // Test second page
      const secondPageBody: ICloneDownPaginateBody = {
        resource: Resource.node,
        isExtension: false,
        offset: 5,
        limit: 5
      };

      const secondPageResult = await paginate(
        secondPageBody,
        global.testEnv.agent
      );

      expect(Array.isArray(secondPageResult)).toBe(true);
      expect(secondPageResult.length).toBeLessThanOrEqual(5);

      // Verify pagination returns different results
      if (firstPageResult.length > 0 && secondPageResult.length > 0) {
        const firstPageIds = firstPageResult.map((node: any) => node.id);
        const secondPageIds = secondPageResult.map((node: any) => node.id);

        // Should have no overlap between pages
        const intersection = firstPageIds.filter((id: string) =>
          secondPageIds.includes(id)
        );
        expect(intersection.length).toBe(0);
      }
    });

    it("should handle extension client requests differently", async () => {
      // Clone up test data
      const testRecords = [
        {
          id: "node:paginate-extension-test-1",
          title: "Paginate Extension Test Node",
          modifiedAt: new Date().toISOString()
        }
      ];

      await cloneUp(
        { resource: Resource.node, records: testRecords },
        global.testEnv.agent
      );

      // Paginate for extension client
      const paginateBody: ICloneDownPaginateBody = {
        resource: Resource.node,
        isExtension: true,
        offset: 0,
        limit: 10
      };

      const result = await paginate(paginateBody, global.testEnv.agent);

      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        const testNode = result.find(
          (node: any) => node.id === "node:paginate-extension-test-1"
        );
        if (testNode) {
          expect(testNode.title).toBe("Paginate Extension Test Node");
        }
      }
    });

    it("should respect offset and limit parameters", async () => {
      // Clone up multiple records
      const testRecords = Array.from({ length: 15 }, (_, i) => ({
        id: `node:paginate-limit-test-${i}`,
        title: `Paginate Limit Test Node ${i}`,
        modifiedAt: new Date().toISOString()
      }));

      await cloneUp(
        { resource: Resource.node, records: testRecords },
        global.testEnv.agent
      );

      // Paginate with specific offset and limit
      const paginateBody: ICloneDownPaginateBody = {
        resource: Resource.node,
        isExtension: false,
        offset: 5,
        limit: 3
      };

      const result = await paginate(paginateBody, global.testEnv.agent);

      expect(Array.isArray(result)).toBe(true);

      // Should return at most the limit number of records
      const paginateTestNodes = result.filter((node: any) =>
        node.id?.startsWith("node:paginate-limit-test-")
      );
      expect(paginateTestNodes.length).toBeLessThanOrEqual(3);
    });

    it("should handle database query errors gracefully", async () => {
      // Use an invalid agent to trigger an error
      const invalidAgent = {
        ...global.testEnv.agent,
        db: "nonexistent_database_12345"
      };

      const paginateBody: ICloneDownPaginateBody = {
        resource: Resource.node,
        isExtension: false,
        offset: 0,
        limit: 10
      };

      const result = await paginate(paginateBody, invalidAgent);
      expect(result).toEqual({ error: "Sync failed" });
    });
  });

  describe("DynamoDB Provider Integration", () => {
    beforeAll(() => {
      process.env.SYNC_PROVIDER = SyncProvider.DYNAMODB;
      SyncProviderFactory.resetProvider();
    });

    it("should paginate nodes using DynamoDB provider", async () => {
      // Clone up test data for pagination
      const testRecords = Array.from({ length: 12 }, (_, i) => ({
        id: `node:dynamo-paginate-test-${i + 1}`,
        title: `DynamoDB Paginate Test Node ${i + 1}`,
        content: `DynamoDB test content ${i + 1}`,
        modifiedAt: new Date().toISOString()
      }));

      const cloneUpBody: ICloneUpBody = {
        resource: Resource.node,
        records: testRecords
      };

      await cloneUp(cloneUpBody, global.testEnv.agent);

      await waitForClonedRecords(
        [Resource.node],
        testRecords.map((record) => record.id)
      );

      // Test pagination
      const paginateBody: ICloneDownPaginateBody = {
        resource: Resource.node,
        isExtension: false,
        offset: 0,
        limit: 5
      };

      const result = await paginate(paginateBody, global.testEnv.agent);

      expect(Array.isArray(result[0].result)).toBe(true);

      const testNodes = result[0].result.filter((node: any) =>
        node.id?.startsWith("node:dynamo-")
      );

      console.log({ testNodes, result: result[0].result });
      expect(testNodes.length).toBeGreaterThan(0);
      expect(testNodes.length).toBeLessThanOrEqual(5);

      //   if (testNodes.length > 0) {
      //     expect(testNodes[0].title).toMatch(/DynamoDB/);
      //   }
    });

    it("should handle extension vs non-extension clients differently", async () => {
      // Clone up test data
      const testRecords = [
        {
          id: "node:dynamo-paginate-extension-test-1",
          title: "DynamoDB Paginate Extension Test Node",
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

      // Test non-extension client (should include id field and result wrapper)
      const nonExtensionBody: ICloneDownPaginateBody = {
        resource: Resource.node,
        isExtension: false,
        offset: 0,
        limit: 10
      };

      const nonExtensionResult = await paginate(
        nonExtensionBody,
        global.testEnv.agent
      );

      // Test extension client (raw data wrapped in result)
      const extensionBody: ICloneDownPaginateBody = {
        resource: Resource.node,
        isExtension: true,
        offset: 0,
        limit: 10
      };

      const extensionResult = await paginate(
        extensionBody,
        global.testEnv.agent
      );

      // Both should return data wrapped in result object for DynamoDB
      expect(nonExtensionResult[0]).toHaveProperty("result");
      expect(extensionResult[0]).toHaveProperty("result");
      expect(Array.isArray(nonExtensionResult[0].result)).toBe(true);
      expect(Array.isArray(extensionResult[0].result)).toBe(true);
    });

    it("should handle errors gracefully with DynamoDB provider", async () => {
      const invalidAgent = {
        ...global.testEnv.agent,
        db: "invalid_database_name_12345"
      };

      const paginateBody: ICloneDownPaginateBody = {
        resource: Resource.node,
        isExtension: false,
        offset: 0,
        limit: 10
      };

      const result = await paginate(paginateBody, invalidAgent);
      expect([{ error: "Sync failed" }, [{ result: [] }]]).toContainEqual(
        result
      );
    });
  });

  describe.skip("Cross-Provider Consistency", () => {
    it("should return consistent data across providers for pagination", async () => {
      // Clone up test data
      const testRecords = Array.from({ length: 8 }, (_, i) => ({
        id: `node:cross-provider-paginate-test-${i + 1}`,
        title: `Cross Provider Paginate Test Node ${i + 1}`,
        content: `Cross provider test content ${i + 1}`,
        modifiedAt: new Date().toISOString()
      }));

      // Test with Surreal provider
      process.env.SYNC_PROVIDER = SyncProvider.SURREAL;
      SyncProviderFactory.resetProvider();

      await cloneUp(
        { resource: Resource.node, records: testRecords },
        global.testEnv.agent
      );

      const paginateBody: ICloneDownPaginateBody = {
        resource: Resource.node,
        isExtension: false,
        offset: 0,
        limit: 3
      };

      const surrealResult = await paginate(paginateBody, global.testEnv.agent);

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

      const dynamoResult = await paginate(paginateBody, global.testEnv.agent);

      // Surreal returns array directly, DynamoDB wraps in result object
      expect(Array.isArray(surrealResult)).toBe(true);
      expect(dynamoResult[0]).toHaveProperty("result");
      expect(Array.isArray(dynamoResult[0].result)).toBe(true);

      // Both should have data for the same resource
      const surrealNodes = surrealResult.filter((node: any) =>
        node.id?.startsWith("node:cross-provider-paginate-test-")
      );
      const dynamoNodes = dynamoResult.result.filter((node: any) =>
        node.id?.startsWith("node:cross-provider-paginate-test-")
      );

      expect(surrealNodes.length).toBeGreaterThan(0);
      expect(dynamoNodes.length).toBeGreaterThan(0);

      if (surrealNodes.length > 0 && dynamoNodes.length > 0) {
        // Compare similar records - they should have consistent structure
        expect(surrealNodes[0]).toHaveProperty("title");
        expect(dynamoNodes[0]).toHaveProperty("title");
      }
    });

    it("should handle errors consistently across providers for pagination", async () => {
      const invalidAgent = {
        ...global.testEnv.agent,
        db: "invalid_database_name_12345"
      };

      const paginateBody: ICloneDownPaginateBody = {
        resource: Resource.node,
        isExtension: false,
        offset: 0,
        limit: 10
      };

      // Test Surreal provider error handling
      process.env.SYNC_PROVIDER = SyncProvider.SURREAL;
      SyncProviderFactory.resetProvider();
      const surrealResult = await paginate(paginateBody, invalidAgent);

      // Test DynamoDB provider error handling
      process.env.SYNC_PROVIDER = SyncProvider.DYNAMODB;
      SyncProviderFactory.resetProvider();
      const dynamoResult = await paginate(paginateBody, invalidAgent);

      // Both should return error objects or empty results
      expect([{ error: "Sync failed" }, [{ result: [] }]]).toContainEqual(
        surrealResult
      );
      expect([{ error: "Sync failed" }, [{ result: [] }]]).toContainEqual(
        dynamoResult
      );
    });
  });
});
