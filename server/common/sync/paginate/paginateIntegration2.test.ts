import { describe, it, beforeAll } from "vitest";
import { paginate } from "./index";
import { ICloneDownPaginateBody } from "@nucleum/schema/legacy/sync.type";
import { Resource } from "$lib/client/components/flux/resourceStores/resource.enum";
import { SyncProvider, SyncProviderFactory } from "../providers";

describe("Paginate Integration Tests - Sequential Pagination", () => {
  describe("DynamoDB Provider Integration", () => {
    beforeAll(() => {
      process.env.SYNC_PROVIDER = SyncProvider.DYNAMODB;
      SyncProviderFactory.resetProvider();
    });

    it("should paginate nodes using DynamoDB provider", async () => {
      let paginateBody: ICloneDownPaginateBody = {
        resource: Resource.node,
        isExtension: false,
        offset: 100,
        limit: 500
      };

      let result = await paginate(paginateBody, global.testEnv.agent);
      console.log({ offset: paginateBody.offset, result });
      if (result && Array.isArray(result) && result.length > 0) {
        while (result[0].hasMore) {
          paginateBody.offset += paginateBody.limit;
          result = await paginate(paginateBody, global.testEnv.agent);
          console.log({ offset: paginateBody.offset, result });
        }
      }
    }, 100000);
  });
});
