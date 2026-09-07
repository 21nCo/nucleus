import { writable } from "svelte/store";
import { Display } from "@21n/elements/display.enum";
import { type IViewStore } from "@nucleum/stores/view.type";
import { ObservableStore } from "@nucleum/stores/client.store";

/**
 * Programmatically set the screen size - Refer tidigit.tailwind.cjs for more details
 * @param width
 * @param height
 * @returns
 */
function calculateScreen(width: number, height: number): Display {
  let display: Display = Display.DP;
  if (width <= 600 && height <= 1000) {
    display = Display.MO;
  }
  if (width >= 600 && height >= 500) {
    display = Display.TP;
  }
  if (width >= 1024 && height >= 700) {
    display = Display.LP;
  }
  if (width >= 1500 && height >= 700) {
    display = Display.DP;
  }
  if (width >= 2000 && height >= 1000) {
    display = Display.TK;
  }
  if (width <= 600) {
    display = Display.CW;
  }
  if (width >= 4000) {
    display = Display.UW;
  }
  if (height <= 600) {
    display = Display.CH;
  }
  if (height >= 1500) {
    display = Display.VM;
  }
  return display;
}

/**
 * @deprecated - use ViewStore instead
 */
const viewV1 = initViewStore({
  height: 0,
  width: 0,
  landscapiness: 0,
  scale: 1,
  isPortrait: false,
  firstLoad: new Date().getTime(),
  currentPath: "",
  isMenuHidden: false,
  display: Display.DP,
  isConstrainedWidth: false
});

/**
 * @deprecated - use ViewStore instead
 */
function initViewStore(settings: IViewStore) {
  const { subscribe, set, update } = writable<IViewStore>(settings);
  return {
    subscribe,
    set,
    reset: (view: IViewStore) => {
      set(view);
    },
    update: (width: number, height: number) => {
      update((n: IViewStore) => {
        n = {
          ...n,
          height: height,
          width: width,
          landscapiness: width / height,
          scale: (width / 1000 + height / 1000) / 2,
          isPortrait: false,
          isConstrainedWidth: width <= 800
        };
        n.display = calculateScreen(width, height);
        n.isPortrait = n.landscapiness < 1;
        return n;
      });
    }
  };
}

class ViewStore extends ObservableStore<IViewStore> {
  constructor() {
    super("view");
    if (typeof window !== "undefined")
      this.refresh(window.innerWidth, window.innerHeight);
    else this.refresh(1080, 900);
  }

  reset(view: IViewStore) {
    this.set(view);
  }

  refresh(width: number, height: number) {
    this.update((n: IViewStore) => {
      n = {
        ...n,
        height: height,
        width: width,
        landscapiness: width / height,
        scale: (width / 1000 + height / 1000) / 2,
        isPortrait: false,
        isConstrainedWidth: width <= 800
      };
      n.display = calculateScreen(width, height);
      n.isPortrait = n.landscapiness < 1;
      return n;
    });
  }
}

const view = new ViewStore();
export default view;
