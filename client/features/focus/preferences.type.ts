import type {
  SessionComposition,
  SessionCompositionType
} from "@nucleum/features/focus/sessionComposition.type";
import type { TimerMode } from "@nucleum/features/focus/timerMode.enum";
import type { ChartType } from "@nucleum/components/charts/analytics.type";
import type { Cloud } from "@nucleum/persistence/cloud.enum";
import type { Layout } from "@21n/layout/layout-mode.type";
import type { TimePeriod, TimeScale } from "@21n/utils/time.type";
import type { AnalyticsFilters } from "@nucleum/features/focus/analytics/preferences.type";

export type HorizonChart = {
  id: string;
  period: TimePeriod;
  type: ChartType;
};

export interface IPointronPreferences {
  isEnableAgeCounter: boolean;
  breakEndSound?: string;
  focusEndSound?: string;
  sessionFinishSound?: string;
  extendDuration: number;
  presets: SessionComposition[];
  isEnableAutoStartInterval: boolean;
  /**
   * Whether to automatically activate Picture-in-Picture (PiP) on focus start
   */
  isEnableAutoPiP: boolean;
  isIncludeBreakInAnalytics: boolean;
  timerMode: TimerMode;
  breakReminder: number;
  /**
   * @deprecated - use appMenu store instead
   */
  appMenu: string[];
  cloudProvider?: Cloud;
  manualEntryQuickDurations?: number[];
  horizonCharts: HorizonChart[];
  horizonChartFilters?: AnalyticsFilters;
  horizonsWithTarget?: TimeScale[];
  horizonTargets?: { scale: TimeScale; target: number }[];
  uiStates: {
    all: LocalUiState;
    desktop: LocalUiState;
    portrait: LocalUiState;
  };
}

type LocalUiState = {
  quickFocusLayout: Layout;
  advancedComposeType: SessionCompositionType;
  advancedMode: number;
};
