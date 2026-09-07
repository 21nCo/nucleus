import { Agent } from "$lib/server/common/account/account.type";
import { ICloneUpBody } from "@nucleum/schema/legacy/sync.type";
import { SyncProviderFactory } from "../providers";

export async function cloneUp(body: ICloneUpBody, agent: Agent) {
  const provider = SyncProviderFactory.getProvider();
  return await provider.cloneUp(body, agent);
}
