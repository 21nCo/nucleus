import { describe, it, expect, vi } from "vitest";
import { cloneUp } from "./index";
import { resolveInsertQuery } from "$lib/shared/utils/surreal.utils";
import { performQueryOnBehalfOfUser } from "../../user/user";
import { ICloneUpBody } from "@nucleum/schema/legacy/sync.type";
import { Resource } from "$lib/client/components/flux/resourceStores/resource.enum";

vi.mock("$lib/shared/utils/surreal.utils", () => ({
  resolveInsertQuery: vi.fn()
}));

vi.mock("../../user/user", () => ({
  performQueryOnBehalfOfUser: vi.fn()
}));

describe("cloneUp", () => {
  it("should successfully clone up records", async () => {
    const mockBody: ICloneUpBody = {
      resource: Resource.node,
      records: [{ id: 1, name: "test" }]
    };

    const mockQuery = "INSERT INTO test_resource...";
    const mockResponse = [{ id: 1, status: "success" }];

    vi.mocked(resolveInsertQuery).mockReturnValue(mockQuery);
    vi.mocked(performQueryOnBehalfOfUser).mockResolvedValue(mockResponse);

    const result = await cloneUp(mockBody, global.testEnv.agent);

    expect(resolveInsertQuery).toHaveBeenCalledWith(
      mockBody.resource,
      mockBody.records
    );
    expect(performQueryOnBehalfOfUser).toHaveBeenCalledWith(
      mockQuery,
      global.testEnv.agent
    );
    expect(result).toBe(mockResponse);
  });

  it("should handle errors and return error message", async () => {
    const mockBody: ICloneUpBody = {
      resource: Resource.node,
      records: [{ id: 1, name: "test" }]
    };
    vi.mocked(resolveInsertQuery).mockImplementation(() => {
      throw new Error("Test error");
    });

    const result = await cloneUp(mockBody, global.testEnv.agent);
    expect(result).toEqual({ error: "Sync failed" });
  });
});
