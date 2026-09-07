import { clientStorage } from "@nucleum/persistence/persistence.utils";
import { ClientStorageKey } from "@nucleum/persistence/persistence.type";

/** Resolves offline mode from the saved preference and current network state. */
export async function determineIfOffline() {
  const isOfflineMode = await clientStorage.get(ClientStorageKey.OFFLINE_MODE);
  const isNetworkInducedOfflineMode = !navigator.onLine;
  return (
    (isOfflineMode && isOfflineMode === "true") || isNetworkInducedOfflineMode
  );
}
