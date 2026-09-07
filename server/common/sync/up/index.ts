import { ISyncUpBody } from "@nucleum/schema/legacy/sync.type";
import { Agent } from "$lib/server/common/account/account.type";
import { SyncProvider, SyncProviderFactory } from "../providers";

export async function syncUp(body: ISyncUpBody, agent: Agent) {
  const provider = SyncProviderFactory.getProvider();
  const result = await provider.syncUp(body, agent);
  if (provider.name === SyncProvider.SURREAL || result.error) {
    return result;
  }
  return [
    {
      result
    }
  ];
}
