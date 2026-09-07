import { Agent } from "$lib/server/common/account/account.type";
import { ISyncDownBody } from "@nucleum/schema/legacy/sync.type";
import { SyncProvider, SyncProviderFactory } from "../providers";

export async function syncDown(body: ISyncDownBody, agent: Agent) {
  const provider = SyncProviderFactory.getProvider();
  const result = await provider.syncDown(body, agent);
  if (provider.name === SyncProvider.SURREAL || result.error) {
    return result;
  }
  return [
    {
      result
    },
    ...(result.counts || []).map((count) => ({
      result: count
    }))
  ];
}
