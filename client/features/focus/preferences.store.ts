import { get, writable } from "svelte/store";

import { Resource } from "@nucleum/datafn/resource.enum";
import { TimerMode } from "@21n/types/pointron/timerMode.enum";
import {
  SessionCompositionType,
  type SessionComposition,
  BreakCompositionType
} from "@21n/types/pointron/sessionComposition.type";
import { ChartType } from "@21n/types/analytics.type";
import { TimePeriodType, TimeScale } from "@21n/types/time.type";
import { Layout } from "@21n/types/layout.type";
import type {
  HorizonChart,
  IPointronPreferences
} from "@21n/types/pointron/pointronPreferences.type";
import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";
import { datafn } from "@nucleum/datafn/datafn.store";

function generateSeedPresets(): SessionComposition[] {
  return [
    {
      id: generateSimpleRandomId(),
      type: SessionCompositionType.POMODORO,
      numberOfFocusRounds: 4,
      focusDuration: 28 * 60,
      breakDuration: 2 * 60,
      totalDuration: 0,
      breakReminder: 600,
      numberOfBreaks: 1,
      name: "Sample preset 1",
      breakType: BreakCompositionType.PREDEFINED
    },
    {
      id: generateSimpleRandomId(),
      type: SessionCompositionType.POMODORO,
      numberOfFocusRounds: 3,
      focusDuration: 10 * 60,
      breakDuration: 2 * 60,
      totalDuration: 0,
      breakReminder: 600,
      numberOfBreaks: 1,
      name: "Sample focus preset 2",
      breakType: BreakCompositionType.PREDEFINED
    },
    {
      id: generateSimpleRandomId(),
      type: SessionCompositionType.TOTAL_DURATION,
      focusDuration: 0,
      breakDuration: 10 * 60,
      totalDuration: 10 * 60 * 60,
      numberOfBreaks: 9,
      breakReminder: 600,
      name: "Sample preset 3",
      breakType: BreakCompositionType.PREDEFINED
    }
  ];
}

export const defaultHorizonChartConfiguration: HorizonChart[] = [
  {
    id: "topleft",
    period: {
      scale: TimeScale.DAYS,
      value: {
        type: TimePeriodType.RELATIVE,
        param: -1
      }
    },
    type: ChartType.PIE
  },
  {
    id: "topright",
    period: {
      scale: TimeScale.DAYS,
      value: {
        type: TimePeriodType.RELATIVE,
        param: 0
      }
    },
    type: ChartType.PIE
  },
  {
    id: "bottomleft",
    period: {
      scale: TimeScale.DAYS,
      value: {
        type: TimePeriodType.RELATIVE,
        param: -7
      }
    },
    type: ChartType.STACKEDBAR
  },
  {
    id: "bottomright",
    period: {
      scale: TimeScale.MONTHS,
      value: {
        type: TimePeriodType.RELATIVE,
        param: -6
      }
    },
    type: ChartType.STACKEDBAR
  }
];

const userLocalPreferencesId = Resource.pointronPreferences;
export const seedLocalPreferences: IPointronPreferences = {
  isEnableAgeCounter: false,
  extendDuration: 5,
  presets: generateSeedPresets(),
  isEnableAutoStartInterval: true,
  isEnableAutoPiP: false,
  isIncludeBreakInAnalytics: false,
  timerMode: TimerMode.JOURNAL,
  appMenu: [],
  manualEntryQuickDurations: [5, 10, 15, 30, 60],
  horizonCharts: defaultHorizonChartConfiguration,
  horizonsWithTarget: [],
  horizonTargets: [],
  breakReminder: 60 * 30,
  uiStates: {
    all: {
      quickFocusLayout: Layout.LIST,
      advancedComposeType: SessionCompositionType.POMODORO,
      advancedMode: 0
    },
    desktop: {
      quickFocusLayout: Layout.LIST,
      advancedComposeType: SessionCompositionType.POMODORO,
      advancedMode: 0
    },
    portrait: {
      quickFocusLayout: Layout.GRID,
      advancedComposeType: SessionCompositionType.POMODORO,
      advancedMode: 0
    }
  }
};

const pointronPreferencesSignal = datafn.kv.signal<IPointronPreferences>(
  Resource.pointronPreferences,
  { defaultValue: seedLocalPreferences }
);
const pointronPreferencesLocal = writable<IPointronPreferences>(
  normalizePointronPreferences(seedLocalPreferences)
);

type LegacySessionComposition = SessionComposition & {
  goals?: SessionComposition["objectives"];
};

function normalizeSessionComposition(
  preset: LegacySessionComposition
): SessionComposition {
  const { goals, ...currentPreset } = preset;
  return {
    ...currentPreset,
    objectives: currentPreset.objectives ?? goals,
    additional: currentPreset.additional?.map((item) =>
      normalizeSessionComposition(item as LegacySessionComposition)
    )
  };
}

function normalizePointronPreferences(data?: Partial<IPointronPreferences>) {
  const value = {
    ...seedLocalPreferences,
    ...(data ?? {})
  };
  if (!value.uiStates) value.uiStates = seedLocalPreferences.uiStates;
  if (!value.presets) value.presets = generateSeedPresets();
  value.presets = value.presets.map((preset) =>
    normalizeSessionComposition(preset as LegacySessionComposition)
  );
  return value;
}

pointronPreferencesSignal.subscribe((value) => {
  pointronPreferencesLocal.set(normalizePointronPreferences(value));
});

/** Shared focus preferences persisted under the existing Pointron resource key. */
export const pointronPreferences = {
  subscribe: pointronPreferencesLocal.subscribe,
  get() {
    return get(pointronPreferencesLocal);
  },
  loader(data: IPointronPreferences) {
    pointronPreferencesLocal.set(normalizePointronPreferences(data));
    return datafn.kv.set(
      Resource.pointronPreferences,
      normalizePointronPreferences(data)
    );
  },
  async set(newValue: IPointronPreferences) {
    const value = normalizePointronPreferences(newValue);
    if (value.horizonsWithTarget) {
      value.horizonTargets = value.horizonTargets?.filter((x) =>
        value.horizonsWithTarget?.some((y) => y === x.scale)
      );
    }
    pointronPreferencesLocal.set(value);
    return datafn.kv.set(Resource.pointronPreferences, value);
  },
  resetHorizonChartConfiguration() {
    this.modify({ horizonCharts: defaultHorizonChartConfiguration });
  },
  async updatePreset(preset: SessionComposition) {
    let m = this.get();
    let n = m.presets;
    let currentPresetIndex = n.findIndex((p) => p.id == preset.id);
    let presetsToRight = n.slice(currentPresetIndex + 1);
    n = n.slice(0, currentPresetIndex);
    n = [...n, preset];
    n = n.concat(presetsToRight);
    return this.modify({ presets: n });
  },
  async removePreset(presetId: string) {
    let m = this.get();
    let n = m.presets;
    n = n.filter((x: SessionComposition) => x.id != presetId);
    return this.modify({ presets: n });
  },
  async addPreset(preset: SessionComposition) {
    let m = this.get();
    m.presets.push(preset);
    return this.modify({ presets: m.presets });
  },

  async setSeedManualEntryQuickDurations() {
    return this.modify({
      manualEntryQuickDurations: [10, 15, 30, 60, 120]
    });
  },

  async updateManualEntryQuickDurations(durations: number[]) {
    return this.modify({ manualEntryQuickDurations: durations });
  },

  modify(
    n: Partial<IPointronPreferences>,
    params: { isPersist?: boolean } = { isPersist: true }
  ) {
    pointronPreferencesLocal.update((current) =>
      normalizePointronPreferences({ ...current, ...n })
    );
    if (params.isPersist === false) return;
    return datafn.kv.merge(Resource.pointronPreferences, n);
  },

  destroy() {
    pointronPreferencesSignal.dispose();
  }
};
