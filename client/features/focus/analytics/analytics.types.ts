import type { TimePeriod } from "@21n/types/time.type";

export type IAnalyticsConfigStore = {
  pages: AnalyticsPage[];
};
export type AnalyticsPage = {
  id: string;
  label: string;
  cards: IAnalyticsCard[];
};

export type IAnalyticsCard = {
  id: string;
  label?: string;
  /**
   * @deprecated
   */
  grouping?: AnalyticsCardGrouping;
  /**
   * @deprecated
   */
  filter?: string[];
  type: AnalyticsCardType;
  period: TimePeriod;
  isGroupByTopLevelObjectives?: boolean;
  stackedBarMode?: "value" | "percentage";
};

export enum AnalyticsCardGrouping {
  DEFAULT = "DEFAULT",
  TOP_LEVEL_OBJECTIVES = "TOP_LEVEL_OBJECTIVES",
  /**
   * @deprecated
   */
  TAGS = "TAGS"
}

export type AnalyticsPageStore = {
  id: string;
  config: AnalyticsPage;
  isRefreshing: boolean;
  data: { cards: any; colors: any; previous: any };
};

export enum AnalyticsCardType {
  PIE = "pie",
  DONUT = "donut",
  BAR = "bar",
  LINE = "line",
  AREA = "area",
  TOP_N = "top_n",
  TARGETS = "targets",
  METRICS = "metrics",
  CALENDAR = "calendar",
  HOURLY = "hourly",
  SUNBURST = "sunburst",
  TREEMAP = "treemap",
  HOURLY_HEATMAP = "hourly_heatmap"
}

export type AnalyticsDataRecord = {
  brek: number;
  focus: number;
  objectiveLabel: string;
  objectiveId: string;
  start: string;
  topLevelObjectiveLabel: string;
};

export type ChartDataRecord = {
  group: string;
  value: number;
  key: string;
};

export type TopNCardDataRecord = {
  label: string;
  value: number;
  previousValue: number;
  color: number;
};

export type IAnalyticsLabelColor = {
  label: string;
  color: number;
};
