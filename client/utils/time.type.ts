export enum TimeScale {
  DAYS = "DAYS",
  WEEKS = "WEEKS",
  MONTHS = "MONTHS",
  QUARTERS = "QUARTERS",
  YEARS = "YEARS"
}

export enum TimeScaleUnit {
  PART = "PART",
  DAY = "DAY",
  WEEK = "WEEK",
  MONTH = "MONTH",
  QUARTER = "QUARTER",
  YEAR = "YEAR"
}

export enum TimePeriodType {
  /**
   * A relative time period is a time period that is relative to the current time. For example, a relative time period with {@link TimePeriodValue} of -1 would be the time period from now to 1 day ago.
   */
  RELATIVE = "RELATIVE",
  UPPER_RELATIVE = "UPPER_RELATIVE",
  /**
   * @deprecated - Use UPPER_RELATIVE or ABSOLUTE instead
   * A calendar bound time period is a time period that is bound by a specific date or a month or a year. For example, a calendar bound time period with {@link TimePeriodValue} of [2021, 02] would be the time period from 1st February 2021 to 28th February 2021.
   */
  CALENDAR_BOUND = "CALENDAR_BOUND",
  /**
   * An absolute time period is a time period that is bound by two specific dates or months or years according to the scale chosen. For example, an absolute time period with {@link TimePeriodValue} of {start: 1st February 2021, end: 28th February 2021} would be the time period from 1st February 2021 to 28th February 2021.
   */
  ABSOLUTE = "ABSOLUTE"
}

export type TimePeriod<T = TimePeriodValue> = {
  scale: TimeScale;
  value: T;
};

export type TimePeriodValue =
  | RelativeTimePeriodValue
  | { type: TimePeriodType.CALENDAR_BOUND; param: number[] }
  | { type: TimePeriodType.ABSOLUTE; param: { start: Date; end: Date } };

export type RelativeTimePeriodValue = {
  type: TimePeriodType.RELATIVE | TimePeriodType.UPPER_RELATIVE;
  param: number;
};

export type ITimePeriodResolved = {
  begin: number;
  end: number;
  title: string;
};

export enum TimeFormat {
  /**
   * For formats like 2h 15m 30s, 1h 30m, 45m 30s
   */
  VERBOSE = "verbose",
  /**
   * For formats like 02:15:30, 01:30:00, 45:30:00
   */
  CLOCK = "clock",
  /**
   * For formats like 2.4h, 1.5m, 30s
   */
  DECIMALS = "decimals"
}

export enum TimeUnit {
  SECONDS = "seconds",
  MINUTES = "minutes",
  HOURS = "hours"
}

export type TimeSuggestion = {
  label: string;
  value: number;
  unit: TimeUnit;
};
