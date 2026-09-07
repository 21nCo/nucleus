import { writable } from "svelte/store";
import {
  Embed,
  OperatingSystem,
  type IAppContext
} from "@21n/types/context.type";
import { clientStorage } from "@nucleum/persistence/persistence.utils";
import { ClientStorageKey } from "@nucleum/persistence/persistence.type";

const context = initContextStore({
  isEmbed: false,
  isSheet: false,
  protocol: "",
  embed: Embed.NONE,
  os: OperatingSystem.MACOS,
  isTouchDevice: false,
  dapId: "",
  experiments: {
    isEnableRoundedMain: false
  }
});

function initContextStore(val: IAppContext) {
  const { subscribe, set, update } = writable<IAppContext>(val);
  return {
    subscribe,
    set,
    update,
    toggleOfflineMode: async (value: boolean) => {
      try {
        await clientStorage.set(ClientStorageKey.OFFLINE_MODE, value);
        update((ctx) => {
          return { ...ctx, isInOfflineMode: value };
        });
      } catch (error) {
        console.error("Failed to set offline mode in clientStorage:", error);
      }
    }
  };
}

export default context;
