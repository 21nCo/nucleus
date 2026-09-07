import type { TimeScale } from "@21n/types/time.type";

export enum TileAppearance {
  DEFAULT,
  FTile,
  MTile,
  LTile
}

export enum TileScale {
  DAYS = "Days",
  MONTHS = "Months",
  YEARS = "Years"
}

export enum CalendarHmVariant {
  /**
   * Years will shown and user can select a particular year
   */
  YEARS_SWITCH,
  /**
   * Tile scale will be shown as switcher. User can switch between days, months and years
   */
  SCALE_SWITCH,
  /**
   * No switcher will be shown
   */
  PLAIN
}

export type DailyData = {
  date: string; //YYYY-MM-DD
  value: number;
  display?: TileAppearance;
  color?: number;
};

export type MonthlyData = {
  month: string; //YYYY-MM
  value: number;
  display?: TileAppearance;
  color?: number;
};

export type YearlyData = {
  year: number; //YYYY
  value: number;
  display?: TileAppearance;
  color?: number;
};

export interface ICalendarHeatMapDataProvider {
  fetchDailyJournal: (start: Date, end: Date) => Promise<HeatmapDataItem[]>;
  fetchJournal: (
    scale: TimeScale.MONTHS | TimeScale.YEARS,
    start: number,
    end: number
  ) => Promise<HeatmapDataItem[]>;
}

export type HeatmapDataItem = {
  date: Date;
  value: number;
  target?: number;
};

export type CalendarHeatmapOptions = {
  isShowStreakline?: boolean;
  selectedYear?: number;
};
