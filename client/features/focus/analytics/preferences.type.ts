export type AnalyticsFilters = {
  objectives: string[];
  tags: string[];
  isAggregateSubObjectives: boolean;
  isShowTargetLines: boolean;
};

/**
 * @deprecated Use `AnalyticsChartRawDataRecord` instead.
 */
export type HorizonChartDataRecord = {
  brek: number;
  focus: number;
  objectiveLabel: string;
  objectiveId: string;
  start: string;
  topLevelObjectiveLabel: string;
};
