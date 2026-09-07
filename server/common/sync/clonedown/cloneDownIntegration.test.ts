import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { cloneDown } from "./index";
import { cloneUp } from "../cloneup";
import { Resource } from "$lib/client/components/flux/resourceStores/resource.enum";
import { SyncProviderFactory, SyncProvider } from "../providers";
import { ICloneDownBody, ICloneUpBody } from "@nucleum/schema/legacy/sync.type";

describe("CloneDown Integration Tests", () => {
  // Reset provider instance before each test to ensure clean state
  beforeEach(() => {
    SyncProviderFactory.resetProvider();
  });

  afterEach(() => {
    SyncProviderFactory.resetProvider();
  });

  describe.skip("SurrealDB Provider Integration", () => {
    beforeEach(() => {
      process.env.SYNC_PROVIDER = SyncProvider.SURREAL;
    });

    it("should return error when no resources are provided", async () => {
      const body: ICloneDownBody = {
        resources: [],
        isExtension: false
      };

      const result = await cloneDown(body, global.testEnv.agent);
      expect(result).toEqual({ error: "No resources found" });
    });

    it("should clone down nodes for non-extension clients", async () => {
      // First, clone up some test data
      const testRecords = [
        {
          id: "node:integration-test-1",
          title: "Integration Test Node 1",
          content: "Test content 1",
          modifiedAt: new Date().toISOString()
        },
        {
          id: "node:integration-test-2",
          title: "Integration Test Node 2",
          content: "Test content 2",
          modifiedAt: new Date().toISOString()
        }
      ];

      const cloneUpBody: ICloneUpBody = {
        resource: Resource.node,
        records: testRecords
      };

      await cloneUp(cloneUpBody, global.testEnv.agent);

      // Now clone down the data
      const cloneDownBody: ICloneDownBody = {
        resources: [Resource.node],
        isExtension: false,
        limit: 100
      };

      const result = await cloneDown(cloneDownBody, global.testEnv.agent);

      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result) && result[0]) {
        const nodes = result[0].result;
        expect(Array.isArray(nodes)).toBe(true);

        // Find our test records
        const testNode1 = nodes.find(
          (node: any) => node.id === "node:integration-test-1"
        );
        const testNode2 = nodes.find(
          (node: any) => node.id === "node:integration-test-2"
        );

        expect(testNode1).toBeDefined();
        expect(testNode1.title).toBe("Integration Test Node 1");
        expect(testNode2).toBeDefined();
        expect(testNode2.title).toBe("Integration Test Node 2");
      }
    });

    it("should clone down multiple resource types", async () => {
      // Clone up test data for multiple resources
      const nodeRecords = [
        {
          id: "node:multi-test-1",
          title: "Multi Resource Test Node",
          modifiedAt: new Date().toISOString()
        }
      ];

      const collectionRecords = [
        {
          id: "collection:multi-test-1",
          name: "Multi Resource Test Collection",
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

      // Clone down multiple resources
      const cloneDownBody: ICloneDownBody = {
        resources: [Resource.node, Resource.collection],
        isExtension: false,
        limit: 100
      };

      const result = await cloneDown(cloneDownBody, global.testEnv.agent);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);

      // Check nodes result
      if (result[0]) {
        const testNode = result[0].result.find(
          (node: any) => node.id === "node:multi-test-1"
        );
        expect(testNode).toBeDefined();
        expect(testNode.title).toBe("Multi Resource Test Node");
      }

      // Check collections result
      if (result[1]) {
        const testCollection = result[1].result.find(
          (collection: any) => collection.id === "collection:multi-test-1"
        );
        expect(testCollection).toBeDefined();
        expect(testCollection.name).toBe("Multi Resource Test Collection");
      }
    });

    it("should handle extension client requests differently", async () => {
      // Clone up test data
      const testRecords = [
        {
          id: "node:extension-test-1",
          title: "Extension Test Node",
          modifiedAt: new Date().toISOString()
        }
      ];

      await cloneUp(
        { resource: Resource.node, records: testRecords },
        global.testEnv.agent
      );

      // Clone down for extension client
      const cloneDownBody: ICloneDownBody = {
        resources: [Resource.node],
        isExtension: true,
        limit: 100
      };

      const result = await cloneDown(cloneDownBody, global.testEnv.agent);

      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result) && result[0]) {
        const nodes = result[0].result;
        const testNode = nodes.find(
          (node: any) => node.id === "node:extension-test-1"
        );
        expect(testNode).toBeDefined();
        expect(testNode.title).toBe("Extension Test Node");
      }
    });

    it("should respect limit parameter", async () => {
      // Clone up multiple records
      const testRecords = Array.from({ length: 10 }, (_, i) => ({
        id: `node:limit-test-${i}`,
        title: `Limit Test Node ${i}`,
        modifiedAt: new Date().toISOString()
      }));

      await cloneUp(
        { resource: Resource.node, records: testRecords },
        global.testEnv.agent
      );

      // Clone down with limit
      const cloneDownBody: ICloneDownBody = {
        resources: [Resource.node],
        isExtension: false,
        limit: 5
      };

      const result = await cloneDown(cloneDownBody, global.testEnv.agent);

      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result) && result[0]) {
        const nodes = result[0].result;
        const limitTestNodes = nodes.filter((node: any) =>
          node.id?.startsWith("node:limit-test-")
        );
        // Should return at most the limit number of our test records
        expect(limitTestNodes.length).toBeLessThanOrEqual(5);
      }
    });

    it("should handle database query errors gracefully", async () => {
      // Use an invalid agent to trigger an error
      const invalidAgent = {
        ...global.testEnv.agent,
        db: "nonexistent_database_12345"
      };

      const cloneDownBody: ICloneDownBody = {
        resources: [Resource.node],
        isExtension: false
      };

      const result = await cloneDown(cloneDownBody, invalidAgent);
      expect(result).toEqual({ error: "Sync failed" });
    });
  });

  describe("DynamoDB Provider Integration", () => {
    beforeEach(() => {
      process.env.SYNC_PROVIDER = SyncProvider.DYNAMODB;
    });

    it("should return error when no resources are provided", async () => {
      const body: ICloneDownBody = {
        resources: [],
        isExtension: false
      };

      const result = await cloneDown(body, global.testEnv.agent);
      expect(result).toEqual({ error: "No resources found" });
    });

    it("should clone down nodes using DynamoDB provider", async () => {
      // First, clone up some test data
      const testRecords = [
        {
          id: "node:dynamo-test-1",
          title: "DynamoDB Test Node 1",
          content: "Test content 1",
          modifiedAt: new Date().toISOString()
        },
        {
          id: "node:dynamo-test-2",
          title: "DynamoDB Test Node 2",
          content: "Test content 2",
          modifiedAt: new Date().toISOString()
        }
      ];

      const cloneUpBody: ICloneUpBody = {
        resource: Resource.node,
        records: testRecords
      };

      await cloneUp(cloneUpBody, global.testEnv.agent);

      // Now clone down the data
      const cloneDownBody: ICloneDownBody = {
        resources: [Resource.node],
        isExtension: false,
        limit: 100
      };

      const result = await cloneDown(cloneDownBody, global.testEnv.agent);

      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result) && result[0]) {
        const nodes = result[0].result;
        expect(Array.isArray(nodes)).toBe(true);

        // Find our test records
        const testNode1 = nodes.find(
          (node: any) => node.id === "node:dynamo-test-1"
        );
        const testNode2 = nodes.find(
          (node: any) => node.id === "node:dynamo-test-2"
        );

        expect(testNode1).toBeDefined();
        expect(testNode1.title).toBe("DynamoDB Test Node 1");
        expect(testNode2).toBeDefined();
        expect(testNode2.title).toBe("DynamoDB Test Node 2");
      }
    });

    it("should handle extension vs non-extension clients differently", async () => {
      // Clone up test data
      const testRecords = [
        {
          id: "node:dynamo-extension-test-1",
          title: "DynamoDB Extension Test Node",
          modifiedAt: new Date().toISOString()
        }
      ];

      await cloneUp(
        { resource: Resource.node, records: testRecords },
        global.testEnv.agent
      );

      // Test non-extension client (should include id field)
      const nonExtensionBody: ICloneDownBody = {
        resources: [Resource.node],
        isExtension: false
      };

      const nonExtensionResult = await cloneDown(
        nonExtensionBody,
        global.testEnv.agent
      );

      // Test extension client (raw data)
      const extensionBody: ICloneDownBody = {
        resources: [Resource.node],
        isExtension: true
      };

      const extensionResult = await cloneDown(
        extensionBody,
        global.testEnv.agent
      );

      // Both should return valid data but may have different structures
      expect(Array.isArray(nonExtensionResult)).toBe(true);
      expect(Array.isArray(extensionResult)).toBe(true);

      if (nonExtensionResult[0]) {
        const testNode = nonExtensionResult[0].result.find(
          (node: any) =>
            node.id === "node:dynamo-extension-test-1" ||
            node.title === "DynamoDB Extension Test Node"
        );
        expect(testNode).toBeDefined();
      }

      if (extensionResult[0]) {
        const testNode = extensionResult[0].result.find(
          (node: any) =>
            node.id === "node:dynamo-extension-test-1" ||
            node.title === "DynamoDB Extension Test Node"
        );
        expect(testNode).toBeDefined();
      }
    });

    it("should respect limit parameter with DynamoDB", async () => {
      // Clone up multiple records
      const testRecords = Array.from({ length: 8 }, (_, i) => ({
        id: `node:dynamo-limit-test-${i}`,
        title: `DynamoDB Limit Test Node ${i}`,
        modifiedAt: new Date().toISOString()
      }));

      await cloneUp(
        { resource: Resource.node, records: testRecords },
        global.testEnv.agent
      );

      // Clone down with limit
      const cloneDownBody: ICloneDownBody = {
        resources: [Resource.node],
        isExtension: false,
        limit: 3
      };

      const result = await cloneDown(cloneDownBody, global.testEnv.agent);

      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result) && result[0]) {
        const nodes = result[0].result;
        const limitTestNodes = nodes.filter(
          (node: any) =>
            node.id?.startsWith("node:dynamo-limit-test-") ||
            node.title?.startsWith("DynamoDB Limit Test Node")
        );
        // Should return at most the limit number of our test records
        expect(limitTestNodes.length).toBeLessThanOrEqual(3);
      }
    });
  });

  describe.skip("Cross-Provider Consistency", () => {
    it("should return consistent results across providers for the same data", async () => {
      const testRecords = [
        {
          id: "node:consistency-test-1",
          title: "Consistency Test Node",
          content: "Test content for consistency",
          modifiedAt: new Date().toISOString()
        }
      ];

      // Test with Surreal provider
      process.env.SYNC_PROVIDER = SyncProvider.SURREAL;
      SyncProviderFactory.resetProvider();

      await cloneUp(
        { resource: Resource.node, records: testRecords },
        global.testEnv.agent
      );

      const surrealResult = await cloneDown(
        {
          resources: [Resource.node],
          isExtension: false,
          limit: 100
        },
        global.testEnv.agent
      );

      // Test with DynamoDB provider
      process.env.SYNC_PROVIDER = SyncProvider.DYNAMODB;
      SyncProviderFactory.resetProvider();

      await cloneUp(
        { resource: Resource.node, records: testRecords },
        global.testEnv.agent
      );

      const dynamoResult = await cloneDown(
        {
          resources: [Resource.node],
          isExtension: false,
          limit: 100
        },
        global.testEnv.agent
      );

      // Both should return valid array results
      expect(Array.isArray(surrealResult)).toBe(true);
      expect(Array.isArray(dynamoResult)).toBe(true);

      // Both should have data for the same resource
      if (surrealResult[0] && dynamoResult[0]) {
        const surrealNode = surrealResult[0].find(
          (node: any) => node.id === "node:consistency-test-1"
        );
        const dynamoNode = dynamoResult[0].result.find(
          (node: any) =>
            node.id === "node:consistency-test-1" ||
            node.title === "Consistency Test Node"
        );

        expect(surrealNode).toBeDefined();
        expect(dynamoNode).toBeDefined();

        if (surrealNode && dynamoNode) {
          expect(surrealNode.title).toBe(dynamoNode.title);
          expect(surrealNode.content).toBe(dynamoNode.content);
        }
      }
    });

    it("should handle errors consistently across providers", async () => {
      const invalidAgent = {
        ...global.testEnv.agent,
        db: "invalid_database_name_12345"
      };

      const cloneDownBody: ICloneDownBody = {
        resources: [Resource.node],
        isExtension: false
      };

      // Test Surreal provider error handling
      process.env.SYNC_PROVIDER = SyncProvider.SURREAL;
      SyncProviderFactory.resetProvider();
      const surrealResult = await cloneDown(cloneDownBody, invalidAgent);

      // Test DynamoDB provider error handling
      process.env.SYNC_PROVIDER = SyncProvider.DYNAMODB;
      SyncProviderFactory.resetProvider();
      const dynamoResult = await cloneDown(cloneDownBody, invalidAgent);

      // Both should return error objects
      expect(surrealResult).toEqual({ error: "Sync failed" });
      expect(dynamoResult).toEqual({ error: "Sync failed" });
    });
  });
});
