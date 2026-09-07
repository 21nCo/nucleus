import type {
  ITimezone,
  ITimezoneCapture
} from "@nucleum/components/settings/timezone/tz.type";
import { TimeScale, TimeScaleUnit, type TimePeriod } from "@21n/types/time.type";
import { determineTimePeriodv2 } from "@21n/utils/time.utils";
import { resolveUnixTimestamp } from "@21n/shared-utils/time.utils";
import { datafn, datafnRuntime } from "@nucleum/datafn/datafn.store";
import {
  createTimezoneResolver,
  resolveTemporalDateParts,
  resolveTemporalLocalTime,
  resolveTemporalPeriodRange,
  type DatafnTemporalScale
} from "@datafn/client";
import {
  get,
  writable,
  type Subscriber,
  type Unsubscriber
} from "svelte/store";

export type DfqlRangeFilter<T = number> = {
  $gte: T;
  $lte: T;
};

class TimezoneStore {
  private records = writable<ITimezone[]>([]);
  private unsubscribers: Unsubscriber[] = [];
  private refreshGeneration = 0;

  constructor() {
    this.ensureSubscriptions();
  }

  subscribe = (
    run: Subscriber<ITimezone[]>,
    invalidate?: () => void
  ) => {
    this.ensureSubscriptions();
    return this.records.subscribe(run, invalidate);
  };

  get() {
    this.ensureSubscriptions();
    return get(this.records);
  }

  destroy() {
    this.refreshGeneration += 1;
    for (const unsubscribe of this.unsubscribers) {
      unsubscribe();
    }
    this.unsubscribers = [];
  }

  private ensureSubscriptions() {
    if (this.unsubscribers.length > 0) return;
    this.unsubscribers = [
      datafnRuntime.subscribe(() => {
        void this.refresh({ isSkipEnsureSubscriptions: true });
      }),
      datafn.subscribe((event) => {
        if (
          event.type === "mutation_applied" ||
          event.type === "sync_applied"
        ) {
          void this.refresh({ isSkipEnsureSubscriptions: true });
        }
      })
    ];
  }

  async refresh(params?: { isSkipEnsureSubscriptions?: boolean }) {
    if (!params?.isSkipEnsureSubscriptions) {
      this.ensureSubscriptions();
    }
    const generation = ++this.refreshGeneration;
    const records = await datafn.temporal.listTimezoneChanges().catch(() => []);
    if (generation === this.refreshGeneration) {
      this.records.set(records);
    }
    return records;
  }

  async create(input: ITimezoneCapture | ITimezoneCapture[]) {
    const values = Array.isArray(input) ? input : [input];
    const records: ITimezone[] = [];
    for (const value of values) {
      const timezone =
        value.timezone ??
        value.zone ??
        this.resolveTimezoneFromLabel(value.label) ??
        datafn.temporal.detectTimezone() ??
        "UTC";
      const result = await datafn.temporal.recordTimezoneChange({
        timezone,
        effectiveFrom:
          value.effectiveFrom ??
          value.dateUnix ??
          (value.date ? resolveUnixTimestamp(value.date) : undefined),
        recordedAt: value.recordedAt,
        source: value.source ?? "manual"
      });
      if (result.ok) records.push(result.record);
    }
    await this.refresh();
    return records;
  }

  async setTimezone(timezone: string, source = "manual") {
    const result = await datafn.temporal.setTimezone(timezone, { source });
    await this.refresh();
    return result;
  }

  resolveTimezone(instant = Date.now(), records?: ITimezone[]) {
    const resolver = createTimezoneResolver(records ?? this.get(), {
      defaultTimezone: () => datafn.temporal.detectTimezone() ?? "UTC"
    });
    return (
      resolver({
        instant,
        field: "timezone"
      }) ?? datafn.temporal.detectTimezone() ?? "UTC"
    );
  }

  private resolveInputDate(day: Date | string | number): Date {
    return day instanceof Date ? day : new Date(day);
  }

  private resolveTimezoneFromLabel(label?: string) {
    return label?.split(" (UTC")[0] || undefined;
  }

  private resolveTemporalScale(scale: TimeScaleUnit): DatafnTemporalScale {
    if (scale === TimeScaleUnit.WEEK) return "week";
    if (scale === TimeScaleUnit.MONTH) return "month";
    if (scale === TimeScaleUnit.QUARTER) return "quarter";
    if (scale === TimeScaleUnit.YEAR) return "year";
    return "day";
  }

  private resolveScaleFromTimePeriod(period: TimePeriod): TimeScaleUnit {
    if (period.scale === TimeScale.WEEKS) return TimeScaleUnit.WEEK;
    if (period.scale === TimeScale.MONTHS) return TimeScaleUnit.MONTH;
    if (period.scale === TimeScale.QUARTERS) return TimeScaleUnit.QUARTER;
    if (period.scale === TimeScale.YEARS) return TimeScaleUnit.YEAR;
    return TimeScaleUnit.DAY;
  }

  private resolveDateParts(date: Date) {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
      millisecond: date.getMilliseconds()
    };
  }

  private resolveCalendarPeriodFilter(
    day: Date | string | number,
    scale: TimeScaleUnit
  ): DfqlRangeFilter<number> {
    const date = this.resolveInputDate(day);
    const timezone = this.resolveTimezone(date.getTime());
    const at = resolveTemporalLocalTime(
      {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: 12
      },
      timezone
    );
    const range = resolveTemporalPeriodRange(
      { scale: this.resolveTemporalScale(scale), at },
      timezone
    );
    return {
      $gte: range.start,
      $lte: range.end
    };
  }

  resolveTimePeriodFilter(
    day: Date | string | number,
    params: {
      scale?: TimeScaleUnit;
      isReturnAsDateObjectFilter: true;
    }
  ): DfqlRangeFilter<Date>;
  resolveTimePeriodFilter(
    day: Date | string | number,
    params?: {
      scale?: TimeScaleUnit;
      isReturnAsDateObjectFilter?: false;
    }
  ): DfqlRangeFilter<number>;
  resolveTimePeriodFilter(
    day: Date | string | number,
    params?: {
      scale?: TimeScaleUnit;
      isReturnAsDateObjectFilter?: boolean;
    }
  ): DfqlRangeFilter<number> | DfqlRangeFilter<Date> {
    const scale = params?.scale ?? TimeScaleUnit.DAY;
    const result = this.resolveCalendarPeriodFilter(day, scale);
    if (!params?.isReturnAsDateObjectFilter) return result;
    return {
      $gte: new Date(result.$gte),
      $lte: new Date(result.$lte)
    };
  }

  resolveTimePeriodFilterForDay(
    day: Date | string | number
  ): DfqlRangeFilter<number> {
    return this.resolveCalendarPeriodFilter(day, TimeScaleUnit.DAY);
  }

  resolveTimePeriodFilterForMonth(
    day: Date | string | number
  ): DfqlRangeFilter<number> {
    return this.resolveCalendarPeriodFilter(day, TimeScaleUnit.MONTH);
  }

  resolveTimePeriodFilterForYear(
    day: Date | string | number
  ): DfqlRangeFilter<number> {
    return this.resolveCalendarPeriodFilter(day, TimeScaleUnit.YEAR);
  }

  resolveTimePeriodCorrectedByTz(
    period: { begin: number; end: number } | TimePeriod,
    params?: {
      tzRecords?: ITimezone[];
    }
  ) {
    let begin = 0;
    let end = 0;
    let resolvedTimePeriod: ReturnType<typeof determineTimePeriodv2> | undefined;
    if ("value" in period) {
      resolvedTimePeriod = determineTimePeriodv2(period);
      begin = resolveUnixTimestamp(resolvedTimePeriod.begin);
      end = resolveUnixTimestamp(resolvedTimePeriod.end);
    } else {
      begin = period.begin;
      end = period.end;
    }
    const correctedBegin = this.resolveTimezoneCorrectedTimestamp(
      begin,
      params
    );
    const correctedEnd = this.resolveTimezoneCorrectedTimestamp(end, params);
    return {
      begin,
      end,
      resolvedTimePeriod,
      correctedBegin,
      correctedEnd,
      filter: {
        $gte: correctedBegin,
        $lte: correctedEnd
      }
    };
  }

  resolveTimePeriodFilterForPeriod(
    period: TimePeriod,
    params?: {
      tzRecords?: ITimezone[];
    }
  ): DfqlRangeFilter<number> {
    if (
      period.value.type !== "ABSOLUTE" &&
      (period.value.param === 0 || period.value.param === undefined)
    ) {
      const resolved = determineTimePeriodv2(period);
      return this.resolveCalendarPeriodFilter(
        resolved.begin,
        this.resolveScaleFromTimePeriod(period)
      );
    }
    return this.resolveTimePeriodCorrectedByTz(period, params).filter;
  }

  resolveTimezoneCorrectedTimestamp(
    timestamp: number,
    params?: {
      tzRecords?: ITimezone[];
    }
  ) {
    const historicalTimezone = this.resolveTimezone(
      timestamp,
      params?.tzRecords
    );
    const currentTimezone = this.resolveTimezone(Date.now(), params?.tzRecords);
    return resolveTemporalLocalTime(
      resolveTemporalDateParts(timestamp, historicalTimezone),
      currentTimezone
    );
  }
}

export const tzStore = new TimezoneStore();
