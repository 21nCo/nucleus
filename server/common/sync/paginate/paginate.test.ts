import { ICloneDownPaginateBody } from "@nucleum/schema/legacy/sync.type";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { paginate as cloneDownPaginate } from "./index";
import { performQueryOnBehalfOfUser } from "../../user/user";
import { Resource } from "$lib/client/components/flux/resourceStores/resource.enum";

describe("cloneDownPaginate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should construct correct query with limit and offset", async () => {
    const resource = Resource.node;
    const body: ICloneDownPaginateBody = {
      resource,
      offset: 100,
      limit: 50,
      isExtension: false
    };
    const expectedQuery =
      "select *, meta::id(id) as id from node LIMIT 50 START 100;";

    vi.mocked(performQueryOnBehalfOfUser).mockResolvedValueOnce([
      { success: true }
    ]);

    const result = await cloneDownPaginate(body, global.testEnv.agent);
    expect(performQueryOnBehalfOfUser).toHaveBeenCalledWith(
      expectedQuery,
      global.testEnv.agent
    );
    expect(result).toEqual([{ success: true }]);
  });

  it("should return error on query failure", async () => {
    const resource = Resource.node;
    vi.mocked(performQueryOnBehalfOfUser).mockRejectedValueOnce(
      new Error("Query failed")
    );

    const result = await cloneDownPaginate(
      { resource, offset: 0, limit: 10, isExtension: false },
      global.testEnv.agent
    );

    expect(result).toEqual({ error: "Sync failed" });
  });

  it("should return query response on success", async () => {
    const resource = Resource.node;
    const mockResponse = [{ id: 1, name: "Test Account" }];

    vi.mocked(performQueryOnBehalfOfUser).mockResolvedValueOnce(mockResponse);

    const result = await cloneDownPaginate(
      { resource, offset: 0, limit: 10, isExtension: false },
      global.testEnv.agent
    );

    expect(result).toEqual(mockResponse);
  });
});
