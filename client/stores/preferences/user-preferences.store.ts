import { AppSkin, Theme } from "@21n/theme/appearance.type";
import type {
  IUserGlobalPreferences,
  UserAppearanceSettings
} from "@nucleum/stores/preferences/user-preferences.type";
import { TimeScale } from "@21n/utils/time.type";
import {
  detectTimeZone,
  detectTimeZoneFallback,
  getTimeZonesWithOffsets
} from "@21n/utils/time.utils";
import { Resource } from "@nucleum/datafn/resource.enum";
import { TranscriptionModel } from "@nucleum/client/runtime/inference/worker.type";
import { tzStore } from "@nucleum/stores/preferences/timezone.store";
import { datafn } from "@nucleum/datafn/datafn.store";
import { get, writable } from "svelte/store";
import {
  acknowledgeOptimisticKvEntries,
  addOptimisticKvEntries,
  applyOptimisticKvEntries,
  removeOptimisticKvEntries
} from "@nucleum/datafn/optimisticKv.utils";
import type { OptimisticKvEntries } from "@nucleum/datafn/optimisticKv.type";

const defaultColorSchemeId = "colorscheme:clean_tidyblue_light";
const defaultDarkColorSchemeId = "colorscheme:clean_tidyblue_dark";
const defaultTimeZone = detectTimeZone();

export const seedUserPreferences: IUserGlobalPreferences = {
  name: "",
  dayStartHour: 0,
  dayStartMinute: 0,
  birthday: new Date(),
  tempColorScheme: "scheme1",
  accessibilitySizingFactor: 1,
  timeScales: [TimeScale.DAYS, TimeScale.MONTHS, TimeScale.YEARS],
  timeFormat: "meridian",
  timeZoneOffset: (defaultTimeZone?.offset ?? 0) * 60,
  timeZoneLabel: defaultTimeZone?.label ?? "UTC",
  timeZone: defaultTimeZone?.zone ?? "UTC",
  isAnonymousAnalyticsEnabled: true,
  lastUsedTranscriptionModel: TranscriptionModel.TINY_EN,
  appearance: {
    skin: AppSkin.Clean,
    isSyncWithSystem: true,
    lightColorSchemeId: defaultColorSchemeId,
    darkColorSchemeId: defaultDarkColorSchemeId,
    userThemeSetting: Theme.LIGHT,
    isBlurredBgForPopups: false,
    isFixedLeftNav: false,
    typeface: "Twenty One Native"
  },
  avatarPicker: {
    skinIndex: 0,
    usedEmojis: [],
    iconColor: "bw",
    filled: false,
    usedIcons: []
  },
  annotations: [],
  mediaGridTestitems: [],
  infiniteGrid: {
    isGridCreated: false,
    grid: []
  },
  localAI: {
    semanticSearch: false,
    audioTranscription: false,
    markdownQAChat: false,
    vectorGenerationInProgress: false
  }
};

const userPreferencesSignal = datafn.kv.signal<IUserGlobalPreferences>(
  Resource.globalPreferences,
  { defaultValue: seedUserPreferences }
);
const userPreferencesLocal = writable<IUserGlobalPreferences>(
  normalizeUserPreferences(seedUserPreferences)
);
const pendingUserPreferenceValues: OptimisticKvEntries = new Map();
let userPreferencesNamespace = datafn.currentNamespace();
let userPreferencesIsInitialized = false;

function resolveStoredTimeZone(data: Partial<IUserGlobalPreferences>) {
  if (typeof data.timeZone === "string" && data.timeZone.trim()) {
    return data.timeZone;
  }
  if (typeof data.timeZoneOffset !== "number") return undefined;
  const timeZones = getTimeZonesWithOffsets();
  const labelMatch =
    typeof data.timeZoneLabel === "string"
      ? timeZones.find((zone) => zone.label === data.timeZoneLabel)
      : undefined;
  return (
    labelMatch?.zone ??
    timeZones.find((zone) => zone.offset * 60 === data.timeZoneOffset)?.zone
  );
}

function normalizeUserPreferences(data?: Partial<IUserGlobalPreferences>) {
  const value = data ?? {};
  return {
    ...seedUserPreferences,
    ...value,
    appearance: {
      ...seedUserPreferences.appearance,
      ...(value.appearance ?? {})
    },
    avatarPicker: {
      ...seedUserPreferences.avatarPicker,
      ...(value.avatarPicker ?? {})
    },
    localAI: {
      ...seedUserPreferences.localAI,
      ...(value.localAI ?? {})
    },
    infiniteGrid: {
      ...seedUserPreferences.infiniteGrid,
      ...(value.infiniteGrid ?? {})
    },
    annotations: value.annotations ?? seedUserPreferences.annotations,
    mediaGridTestitems:
      value.mediaGridTestitems ?? seedUserPreferences.mediaGridTestitems,
    isAnonymousAnalyticsEnabled: value.isAnonymousAnalyticsEnabled ?? true,
    timeZone: resolveStoredTimeZone(value) ?? seedUserPreferences.timeZone
  };
}

userPreferencesSignal.subscribe((value) => {
  userPreferencesIsInitialized = true;
  const namespace = datafn.currentNamespace();
  if (namespace !== userPreferencesNamespace) {
    pendingUserPreferenceValues.clear();
    userPreferencesNamespace = namespace;
  }
  const normalized = normalizeUserPreferences(value);
  acknowledgeOptimisticKvEntries(pendingUserPreferenceValues, normalized);
  userPreferencesLocal.set(
    applyOptimisticKvEntries(normalized, pendingUserPreferenceValues)
  );
});

export const userPreferences = {
  seed: seedUserPreferences,
  get isInitialized() {
    return userPreferencesIsInitialized;
  },
  subscribe: userPreferencesLocal.subscribe,
  get() {
    return get(userPreferencesLocal);
  },
  set(value: IUserGlobalPreferences) {
    return this.modify(normalizeUserPreferences(value));
  },
  loader(data: Partial<IUserGlobalPreferences>) {
    userPreferencesLocal.set(normalizeUserPreferences(data));
    return datafn.kv.set(
      Resource.globalPreferences,
      normalizeUserPreferences(data)
    );
  },

  setAppearance(x: Partial<UserAppearanceSettings>) {
    const n = this.get();
    const appearance = { ...n.appearance, ...x };
    this.modify({ appearance });
  },

  setAvatarPicker(x: Partial<IUserGlobalPreferences["avatarPicker"]>) {
    const n = this.get();
    const avatarPicker = { ...n.avatarPicker, ...x };
    this.modify({ avatarPicker });
  },

  setLocalAI(x: Partial<IUserGlobalPreferences["localAI"]>) {
    const n = this.get();
    const localAI = { ...n.localAI, ...x };
    this.modify({ localAI });
  },

  setInfiniteGrid(x: Partial<IUserGlobalPreferences["infiniteGrid"]>) {
    const n = this.get();
    const infiniteGrid = { ...n.infiniteGrid, ...x };
    this.modify({ infiniteGrid });
  },

  setRecentCommands(recentCommands: IUserGlobalPreferences["recentCommands"]) {
    this.modify({ recentCommands });
  },

  setAccessibilitySizingFactor(accessibilitySizingFactor: number) {
    this.modify({ accessibilitySizingFactor });
  },

  _setTimezone(offset: number, label?: string, timezone?: string) {
    this.modify({
      timeZoneOffset: offset,
      timeZoneLabel: label,
      timeZone: timezone
    });
    return { offset, label, timezone };
  },
  /**
   * Sets the timezone offset and label for the user
   * @param offset - The offset of the timezone from UTC in seconds
   * @param label - The label of the timezone
   * @returns
   */
  async setTimeZone(offset?: number, label?: string, timezone?: string) {
    let source = "manual";
    if (offset === undefined) {
      const val = detectTimeZoneFallback();
      offset = val.offset;
      label = val.label;
      timezone = detectTimeZone()?.zone ?? tzStore.resolveTimezone();
      source = "browser";
    }
    const resolvedTimezone =
      timezone ?? label?.split(" (UTC")[0] ?? tzStore.resolveTimezone();
    await tzStore.setTimezone(resolvedTimezone, source);
    return this._setTimezone(offset, label, resolvedTimezone);
  },

  updateUserProfile(x: Partial<IUserGlobalPreferences>) {
    this.modify({ ...x });
  },

  modify(n: Partial<IUserGlobalPreferences>) {
    const mutationTokens = addOptimisticKvEntries(
      pendingUserPreferenceValues,
      n
    );
    userPreferencesLocal.update((current) =>
      normalizeUserPreferences({ ...current, ...n })
    );
    const mutation = datafn.kv.merge(Resource.globalPreferences, n);
    const rollbackPendingValues = () => {
      removeOptimisticKvEntries(pendingUserPreferenceValues, mutationTokens);
      const current = normalizeUserPreferences(
        userPreferencesSignal.get() ?? seedUserPreferences
      );
      userPreferencesLocal.set(
        applyOptimisticKvEntries(current, pendingUserPreferenceValues)
      );
    };
    void mutation.then((result) => {
      if (!result.ok) rollbackPendingValues();
    }, rollbackPendingValues);
    return mutation;
  },

  destroy() {
    userPreferencesSignal.dispose();
    tzStore.destroy();
  }
};
