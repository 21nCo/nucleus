import { Agent } from "$lib/server/common/account/account.type";
import {
  ICloneDownPaginateBody,
  ICloneDownPaginatev2Body
} from "@nucleum/schema/legacy/sync.type";
import { SyncProvider, SyncProviderFactory } from "../providers";

/**
 * TODO - Implement streaming or download via S3 if too many records - as AWS Lambda has a limit of 6MB for response size
 * @param body
 * @param agent
 * @returns
 */
export async function paginate(body: ICloneDownPaginateBody, agent: Agent) {
  const provider = SyncProviderFactory.getProvider();
  const result = await provider.paginate(body, agent);
  if (provider.name === SyncProvider.SURREAL || result.error) {
    return result;
  }
  return [
    {
      ...result,
      result: result.data
    }
  ];
}

export async function paginatev2(body: ICloneDownPaginatev2Body, agent: Agent) {
  const provider = SyncProviderFactory.getProvider();
  const result = await provider.paginatev2(body, agent);
  return result;
}
