import { writable } from "svelte/store";

/** Playback state shared by focus products. */
export const backgroundSoundStore = initBackgroundSoundStore();

function initBackgroundSoundStore() {
  const { subscribe, set, update } = writable<{
    systemSound?: string;
    youtubeUrl?: string;
  }>({});
  return {
    subscribe,
    set,
    playYoutube: (url: string) => {
      set({ youtubeUrl: url });
    },
    resetYoutube: () => {
      update((x) => {
        x.youtubeUrl = undefined;
        return x;
      });
    },
    reset: () => {
      set({ systemSound: undefined });
    }
  };
}
