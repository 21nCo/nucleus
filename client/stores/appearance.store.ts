import { get, writable } from "svelte/store";
import { Resource } from "@nucleum/datafn/resource.enum";
import {
  AppSkin,
  Theme,
  type AppearanceStore,
  type ColorScheme
} from "@21n/types/appearance.type";
import colorSchemes from "@21n/theme/colorschemes.json";
import { StoreDataType } from "@21n/types/data.type";
import { dispatchCustomEvent } from "@21n/utils/browser.utils";
import {
  persistLocally,
  retrieveLocally
} from "@nucleum/persistence/persistence.utils";
import type { UserAppearanceSettings } from "@21n/types/preferences.type";
import { GlobalEvent } from "@21n/types/event.enum";
import type { JsonValue } from "@21n/types/json.type";
const defaultLightColorSchemeId = "colorscheme:clean_tidyblue_light";
// const defaultDarkColorSchemeId = "colorscheme:clean_tidyblue_dark";
const defaultDarkColorSchemeId = "colorscheme:clean_tidyblue_dark";

export const fallBackTypefaceString =
  "Sen, Sen Variable, Space Grotesk, Hanken Grotesk, Hanken Grotesk Variable, Nunito, Teachers, Montserrat, Proxima Nova,  Poppins, Noto Sans";

type AppearanceState = Omit<AppearanceStore, "get">;

const seedAppearance: AppearanceState = {
  id: Resource.appearance,
  dataType: StoreDataType.NA,
  theme: Theme.LIGHT,
  isSyncWithSystem: true,
  userThemeSetting: Theme.LIGHT,
  systemTheme: Theme.LIGHT,
  lightColorSchemeId: defaultLightColorSchemeId,
  darkColorSchemeId: defaultDarkColorSchemeId,
  colorScheme:
    colorSchemes.find((cs) => cs.id == defaultLightColorSchemeId) ??
    colorSchemes[0],
  accessibilitySizingFactor: 1
};
const cachedAppearance = retrieveLocally(
  Resource.appearance
) as AppearanceState | null;

export const appearance = initAppearanceStore();

function initAppearanceStore() {
  const defaultData = {
    ...seedAppearance,
    ...(cachedAppearance ?? {})
  };
  const { subscribe, set, update } = writable<AppearanceState>(defaultData);

  const cache = (store: AppearanceState) => {
    persistLocally(Resource.appearance, store as unknown as JsonValue);
  };

  const persist = (store: AppearanceState) => {
    dispatchCustomEvent(GlobalEvent.PERSIST_APPEARANCE_USER, {
      isSyncWithSystem: store.isSyncWithSystem,
      lightColorSchemeId: store.lightColorSchemeId.toString(),
      darkColorSchemeId: store.darkColorSchemeId.toString(),
      userThemeSetting: store.userThemeSetting
    });
    cache(store);
  };

  const switchTheme = (theme: Theme, a: AppearanceState) => {
    let modified = { ...a, theme };
    if (theme === Theme.LIGHT) {
      if (!a.lightColorSchemeId && a.darkColorSchemeId) {
        a.lightColorSchemeId =
          colorSchemes.find((x) =>
            x.label.includes(a.darkColorSchemeId.split("_")[1])
          )?.id ?? defaultLightColorSchemeId;
      } else if (!a.lightColorSchemeId) {
        a.lightColorSchemeId = defaultLightColorSchemeId;
      }
      modified.colorScheme =
        (colorSchemes.find(
          (cs) => cs.id == a.lightColorSchemeId
        ) as ColorScheme) ?? colorSchemes[0];
    }
    if (theme === Theme.DARK) {
      if (!a.darkColorSchemeId && a.lightColorSchemeId) {
        a.darkColorSchemeId =
          colorSchemes.find((x) =>
            x.label.includes(a.lightColorSchemeId.split("_")[1])
          )?.id ?? defaultDarkColorSchemeId;
      } else if (!a.darkColorSchemeId) {
        a.darkColorSchemeId = defaultDarkColorSchemeId;
      }
      modified.colorScheme =
        (colorSchemes.find(
          (cs) => cs.id == a.darkColorSchemeId
        ) as ColorScheme) ?? colorSchemes[0];
    }
    // console.log("switching theme", { x: theme, modified });
    return modified;
  };

  return {
    subscribe,
    set,
    update,
    syncAppearanceFromCloud: (x: UserAppearanceSettings) => {
      update((a) => {
        let modified = {
          ...a,
          lightColorSchemeId: x.lightColorSchemeId.toString(),
          darkColorSchemeId: x.darkColorSchemeId.toString(),
          isSyncWithSystem: x.isSyncWithSystem,
          userThemeSetting: x.userThemeSetting
        };
        const currentTheme = modified.isSyncWithSystem
          ? modified.systemTheme
          : modified.userThemeSetting;
        modified = switchTheme(currentTheme, modified);
        cache(modified);
        return modified;
      });
    },

    // rename to setAppearance
    setTheme: (skin: AppSkin, colorSchemeId: string) => {
      let cs = colorSchemes.find((cs) => cs.id == colorSchemeId);
      if (!cs) cs = colorSchemes[0];
      if (!cs) return;
      update((a) => {
        const modified = { ...a, skin, colorScheme: cs as ColorScheme };
        persist(modified);
        return modified;
      });
    },

    setColorScheme: (colorSchemeId: string) => {
      let cs = colorSchemes.find((cs) => cs.id == colorSchemeId);
      if (!cs) return;
      update((a) => {
        let modified: AppearanceState = { ...a };
        if (!cs.isDark) modified.lightColorSchemeId = colorSchemeId;
        else modified.darkColorSchemeId = colorSchemeId;
        const activeTheme = modified.isSyncWithSystem
          ? modified.systemTheme
          : modified.userThemeSetting;
        modified = switchTheme(activeTheme, modified);
        persist(modified);
        return modified;
      });
    },

    modifyUserThemeSetting: (theme: Theme) => {
      update((a) => {
        let modified: AppearanceState = { ...a, userThemeSetting: theme };
        if (!a.isSyncWithSystem) {
          modified = switchTheme(theme, modified);
        } else {
          modified = switchTheme(a.systemTheme, modified);
        }
        persist(modified);
        return modified;
      });
    },

    modifySyncWithSystem: (isSync: boolean) => {
      update((a) => {
        let modified = { ...a, isSyncWithSystem: isSync };
        if (isSync) {
          modified = switchTheme(a.systemTheme, modified);
        } else {
          modified = switchTheme(a.userThemeSetting, modified);
        }
        persist(modified);
        return modified;
      });
    },

    /**
     * Sets the system theme in appearance store to either light or dark based on `prefers-color-scheme: dark` media query and updates color scheme accordingly.
     * @param isDark boolean value to set the system theme to dark or light
     */
    setSystemTheme: (isDark: boolean) => {
      const current = get(appearance);
      const theme = isDark ? Theme.DARK : Theme.LIGHT;
      if (current.systemTheme === theme) return;
      update((a) => {
        let modified: AppearanceState = { ...a, systemTheme: theme };
        if (a.isSyncWithSystem) {
          modified = switchTheme(theme, modified);
        }
        persist(modified);
        return modified;
      });
    },

    switchTheme: (theme: Theme) => {
      update((a) => {
        const modified = switchTheme(theme, a);
        persist(modified);
        return modified;
      });
    }
  };
}

export default appearance;
