import { IReconcileBody } from "@nucleum/schema/legacy/sync.type";
import { Agent } from "$lib/server/common/account/account.type";
import { SyncProviderFactory } from "../providers";

export async function reconcile(body: IReconcileBody, agent: Agent) {
  const provider = SyncProviderFactory.getProvider();
  return await provider.reconcile(body, agent);
}
