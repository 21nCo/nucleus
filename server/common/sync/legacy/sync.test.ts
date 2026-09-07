import { describe, it, expect } from "vitest";
import { resolveSyncDownQuery } from "./sync.utils";
import { Resource } from "$lib/client/components/flux/resourceStores/resource.enum";
import { syncV2 } from "./sync";
import { SyncMethod } from "@nucleum/schema/legacy/sync.type";
import { Agent } from "../../account/account.type";

describe("syncV2", () => {
  it("should handle SYNC_UP method", async () => {
    const body = {
      mutations: [
        {
          id: "test-mutation",
          timestamp: Date.now(),
          resource: Resource.node,
          operation: "CREATE",
          resourceId: "test-resource",
          dapId: "test-dap-123"
        }
      ],
      lastSyncDown: Date.now(),
      resources: [Resource.node],
      dapId: "test-dap-123"
    };

    const result = await syncV2(body, global.testEnv.agent, SyncMethod.SYNC_UP);
    expect(result).toBeDefined();
  });

  it("should handle SYNC_DOWN method", async () => {
    const body = {
      lastSyncDown: Date.now(),
      resources: [Resource.node],
      dapId: "test-dap-123"
    };

    const result = await syncV2(
      body,
      global.testEnv.agent,
      SyncMethod.SYNC_DOWN
    );
    expect(result).toBeDefined();
  });

  it("should handle CLONE_UP method", async () => {
    const body = {
      resource: Resource.node,
      records: [
        {
          id: "test-record",
          name: "Test Record"
        }
      ]
    };

    const result = await syncV2(
      body,
      global.testEnv.agent,
      SyncMethod.CLONE_UP
    );
    expect(result).toBeDefined();
  });

  it("should handle CLONE_DOWN method", async () => {
    const body = {
      resources: [Resource.node],
      isExtension: false
    };

    const result = await syncV2(
      body,
      global.testEnv.agent,
      SyncMethod.CLONE_DOWN
    );
    expect(result).toBeDefined();
  });

  it("should return error for invalid sync method", async () => {
    const body = {
      resources: [Resource.node],
      isExtension: false
    };

    const result = await syncV2(body, global.testEnv.agent, "invalid_method");
    expect(result).toEqual({ error: "Invalid sync method" });
  });
});

describe("resolveSyncDownQuery", () => {
  it("should generate correct query with single resource", () => {
    const lastSyncDown = 1234567890;
    const resources = [Resource.node];
    const dapId = "test-dap-123";

    const result = resolveSyncDownQuery(lastSyncDown, resources, dapId);
    const expected = `BEGIN TRANSACTION; let $count = array::first(SELECT count() FROM mutation WHERE timestamp > 1234567890 AND dapId IS NOT 'test-dap-123' AND resource IN ['node'] group all); RETURN IF $count.count < 100 THEN SELECT * FROM mutation WHERE timestamp > 1234567890 AND dapId IS NOT 'test-dap-123' AND resource IN ['node'] ORDER BY timestamp ASC ELSE $count.count END; COMMIT TRANSACTION;`;

    expect(result).toBe(expected);
  });

  it("should generate correct query with multiple resources", () => {
    const lastSyncDown = 1234567890;
    const resources = [Resource.node, Resource.collection, Resource.file];
    const dapId = "test-dap-123";

    const result = resolveSyncDownQuery(lastSyncDown, resources, dapId);

    const expected = `BEGIN TRANSACTION; let $count = array::first(SELECT count() FROM mutation WHERE timestamp > 1234567890 AND dapId IS NOT 'test-dap-123' AND resource IN ['node','collection','file'] group all); RETURN IF $count.count < 100 THEN SELECT * FROM mutation WHERE timestamp > 1234567890 AND dapId IS NOT 'test-dap-123' AND resource IN ['node','collection','file'] ORDER BY timestamp ASC ELSE $count.count END; COMMIT TRANSACTION;`;

    expect(result).toBe(expected);
  });

  it("should handle empty resources array", () => {
    const lastSyncDown = 1234567890;
    const resources: Resource[] = [];
    const dapId = "test-dap-123";

    const result = resolveSyncDownQuery(lastSyncDown, resources, dapId);

    const expected = `BEGIN TRANSACTION; let $count = array::first(SELECT count() FROM mutation WHERE timestamp > 1234567890 AND dapId IS NOT 'test-dap-123' AND resource IN [] group all); RETURN IF $count.count < 100 THEN SELECT * FROM mutation WHERE timestamp > 1234567890 AND dapId IS NOT 'test-dap-123' AND resource IN [] ORDER BY timestamp ASC ELSE $count.count END; COMMIT TRANSACTION;`;

    expect(result).toBe(expected);
  });
});
