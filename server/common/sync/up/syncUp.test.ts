import { describe, it, expect, beforeEach, vi } from "vitest";
import { syncUp } from ".";
import { resolveSyncDownQuery } from "../legacy/sync.utils";
import { performQueryOnBehalfOfUser } from "../../user/user";
import { Resource } from "$lib/client/components/flux/resourceStores/resource.enum";
import { ISyncUpBody } from "@nucleum/schema/legacy/sync.type";
import { mockMutations, mockMutationWithLargeData } from "$tests/fixtures";
import { resolveMutationQueryV2 } from "$lib/shared/utils/surreal.utils";

vi.mock("../../user/user", () => ({
  performQueryOnBehalfOfUser: vi.fn()
}));

vi.mock("$lib/shared/utils/surreal.utils", () => ({
  resolveMutationQueryV2: vi.fn()
}));
vi.mock("../sync.utils", () => ({
  resolveSyncDownQuery: vi.fn()
}));

describe("syncUp", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(resolveMutationQueryV2).mockReturnValue("MOCK_MUTATION_QUERY");
    vi.mocked(resolveSyncDownQuery).mockReturnValue("MOCK_SYNC_DOWN_QUERY");
  });

  it("should return an error if no mutations are provided", async () => {
    const body: ISyncUpBody = {
      mutations: [],
      lastSyncDown: 0,
      resources: [],
      dapId: ""
    };
    const result = await syncUp(body, global.testEnv.agent);
    expect(performQueryOnBehalfOfUser).not.toHaveBeenCalled();
    expect(result).toEqual({ error: "No mutations to sync" });
  });

  it("should handle small mutations correctly", async () => {
    const body: ISyncUpBody = {
      mutations: [mockMutations[0]],
      lastSyncDown: 123456789,
      resources: [Resource.node],
      dapId: "dap123"
    };

    vi.mocked(performQueryOnBehalfOfUser).mockResolvedValueOnce("mockResponse");

    const result = await syncUp(body, global.testEnv.agent);

    expect(resolveSyncDownQuery).toHaveBeenCalledWith(
      body.lastSyncDown,
      body.resources,
      body.dapId
    );
    expect(resolveMutationQueryV2).toHaveBeenCalledTimes(1);
    expect(performQueryOnBehalfOfUser).toHaveBeenCalledWith(
      expect.stringMatching(/.*MOCK_MUTATION_QUERY.*MOCK_SYNC_DOWN_QUERY.*/),
      global.testEnv.agent
    );

    expect(result).toBe("mockResponse");
  });

  it("should handle large mutations correctly", async () => {
    const body: ISyncUpBody = {
      mutations: [mockMutationWithLargeData],
      lastSyncDown: 123456789,
      resources: [Resource.node],
      dapId: "dap123"
    };

    vi.mocked(performQueryOnBehalfOfUser)
      .mockResolvedValueOnce(["insertResponse"])
      .mockResolvedValueOnce(["mutationResponse"])
      .mockResolvedValueOnce(["fetchBackResponse"]);

    const result = await syncUp(body, global.testEnv.agent);

    expect(performQueryOnBehalfOfUser).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("INSERT INTO"),
      global.testEnv.agent
    );
    expect(resolveMutationQueryV2).toHaveBeenCalledTimes(1);

    expect(performQueryOnBehalfOfUser).toHaveBeenNthCalledWith(
      2,
      "MOCK_MUTATION_QUERY",
      global.testEnv.agent
    );
    expect(resolveSyncDownQuery).toHaveBeenCalledWith(
      body.lastSyncDown,
      body.resources,
      body.dapId
    );
    expect(performQueryOnBehalfOfUser).toHaveBeenNthCalledWith(
      3,
      "MOCK_SYNC_DOWN_QUERY",
      global.testEnv.agent
    );

    expect(performQueryOnBehalfOfUser).toHaveBeenCalledTimes(3);
    expect(result).toEqual(["mutationResponse", "fetchBackResponse"]);
  });

  it("should return an error if transaction fails", async () => {
    const body: ISyncUpBody = {
      mutations: [mockMutations[0]],
      lastSyncDown: 123456789,
      resources: [Resource.node],
      dapId: "dap123"
    };

    vi.mocked(performQueryOnBehalfOfUser).mockResolvedValueOnce(null);

    const result = await syncUp(body, global.testEnv.agent);
    expect(result).toEqual(
      expect.objectContaining({
        error: expect.stringMatching(/^(Sync failed|transaction failed)$/)
      })
    );
  });
});
