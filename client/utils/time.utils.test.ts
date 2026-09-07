import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { IUserGlobalPreferences } from "@nucleum/stores/preferences/user-preferences.type";
import {
  TimeFormat,
  TimePeriodType,
  TimeScale,
  TimeUnit
} from "@21n/utils/time.type";
import type { TimePeriod } from "@21n/utils/time.type";
import type { UserDate } from "@21n/utils/userDate.type";

import {
  attachTimeToDate,
  compareDates,
  detectTimeZone,
  detectTimeZoneFallback,
  formatDateRelativeToToday,
  formatDatetime,
  formatSeconds,
  formatSecondsToTimeInDecimals,
  formatTime,
  formatUserDate,
  getCorrespoingHorizonFrequencyLabel,
  getTimeLabel,
  getTimeZonesWithOffsets,
  incrementTime,
  isSameDateTime,
  isSameDay,
  offsetDate,
  parseAndFormatDate,
  parseFullDateTimeString,
  parseRelativeTimeToISO,
  resolveDurationInSeconds,
  resolveUpperRelativeTimePeriodTitle,
  timePeriodLabel,
  toLocalISOString,
  wait,
  determinePreviousTimePeriod,
  determineTimePeriod,
  determineTimePeriodv2
} from "./time.utils";

vi.mock("moment-timezone", () => {
  const offsets: Record<string, number> = {
    UTC: 0,
    "Asia/Kolkata": 330
  };
  const tz = Object.assign(
    (zone: string) => ({
      utcOffset: () => offsets[zone] ?? 0
    }),
    {
      names: () => Object.keys(offsets)
    }
  );
  const moment = { tz };
  return { ...moment, default: moment };
});

const preferences: IUserGlobalPreferences = {
  name: "Test User",
  appearance: {
    skin: "clean" as any,
    isSyncWithSystem: false,
    lightColorSchemeId: "",
    darkColorSchemeId: "",
    userThemeSetting: "light" as any
  },
  dayStartHour: 0,
  dayStartMinute: 0,
  tempColorScheme: "",
  accessibilitySizingFactor: 1,
  isAnonymousAnalyticsEnabled: true,
  timeFormat: "meridian",
  timeZoneOffset: 0,
  timeZoneLabel: "UTC",
  avatarPicker: {
    skinIndex: 0,
    usedEmojis: [] as any,
    iconColor: "",
    filled: false,
    usedIcons: [] as any
  },
  annotations: [],
  lastUsedTranscriptionModel: "base" as any,
  localAI: {
    semanticSearch: false,
    audioTranscription: false,
    markdownQAChat: false,
    vectorGenerationInProgress: false
  }
};

describe("client/utils/time.utils", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats time according to preferences", () => {
    expect(formatTime(preferences, new Date(2024, 0, 1, 13, 30))).toBe(
      "1:30 PM"
    );
    expect(
      formatTime({ ...preferences, timeFormat: "24" }, new Date(2024, 0, 1, 13, 30))
    ).toBe("13:30");
    expect(
      formatTime(
        { ...preferences, timeFormat: "24" },
        new Date(2024, 0, 1, 13, 30, 45),
        { isIncludeSeconds: true }
      )
    ).toBe("13:30:45");
  });

  it("formats seconds in various styles", () => {
    expect(formatSeconds(3661, TimeFormat.VERBOSE)).toContain("1 h 1 m");
    expect(formatSeconds(125, TimeFormat.CLOCK)).toBe("02:05");
    expect(formatSeconds(45, TimeFormat.DECIMALS)).toBe("45s");
  });

  it("formats non-finite seconds as zero", () => {
    expect(formatSeconds(Number.NaN, TimeFormat.VERBOSE)).toBe("0 s");
    expect(formatSeconds(Number.POSITIVE_INFINITY, TimeFormat.CLOCK)).toBe(
      "00:00"
    );
  });

  it("converts seconds to decimal durations", () => {
    expect(formatSecondsToTimeInDecimals(7200)).toBe("2.00 hr");
    expect(formatSecondsToTimeInDecimals(180, 1, "min")).toBe("3.0 m");
  });

  it("produces local ISO strings", () => {
    const iso = toLocalISOString(new Date(Date.UTC(2024, 0, 1, 0, 0, 0)));
    expect(iso).toMatch(/^2024-01-01T/);
  });

  it("labels time periods", () => {
    const period: TimePeriod = {
      scale: TimeScale.DAYS,
      value: { type: TimePeriodType.RELATIVE, param: 0 }
    };
    expect(timePeriodLabel(period)).toBe("Today");
    expect(resolveUpperRelativeTimePeriodTitle(TimeScale.DAYS, 0)).toMatch(/\d{4}/);
  });

  it("determines previous time period", () => {
    const period: TimePeriod = {
      scale: TimeScale.DAYS,
      value: { type: TimePeriodType.RELATIVE, param: 0 }
    };
    const prev = determinePreviousTimePeriod(period);
    expect(prev.getDate()).toBeLessThanOrEqual(new Date().getDate());
  });

  it("computes time periods", () => {
    const period: TimePeriod = {
      scale: TimeScale.MONTHS,
      value: { type: TimePeriodType.RELATIVE, param: -1 }
    };
    const legacy = determineTimePeriod(period);
    const modern = determineTimePeriodv2(period);
    expect(legacy.begin <= legacy.end).toBe(true);
    expect(modern.begin <= modern.end).toBe(true);
  });

  it("provides horizon labels", () => {
    expect(getCorrespoingHorizonFrequencyLabel(TimeScale.WEEKS)).toBe("Weekly");
  });

  it("enumerates timezones and detects current zone", () => {
    const zones = getTimeZonesWithOffsets();
    expect(zones.length).toBeGreaterThan(0);
    const detector = vi
      .spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions")
      .mockReturnValue({ timeZone: "UTC" } as any);
    const tz = detectTimeZone();
    expect(tz?.zone).toBe("UTC");
    detector.mockRestore();
    const fallback = detectTimeZoneFallback();
    expect(typeof fallback.offset).toBe("number");
  });

  it("creates readable time labels", () => {
    expect(getTimeLabel(135)).toBe("2 hrs 15 mins");
  });

  it("formats user dates", () => {
    const userDate: UserDate = { day: 5, month: 0, year: 2024 };
    expect(formatUserDate(userDate)).toBe("05 Jan 2024");
    expect(formatUserDate(userDate, "yyyy:mm:dd")).toBe("2024-01-05");
  });

  it("describes dates relative to today", () => {
    const today = new Date();
    expect(formatDateRelativeToToday(today)).toBe("Today");
    const past = new Date();
    past.setDate(past.getDate() - 2);
    expect(formatDateRelativeToToday(past)).toMatch(/Last/);
  });

  it("awaits specified duration", async () => {
    vi.useFakeTimers();
    const promise = wait(1000);
    vi.advanceTimersByTime(1000);
    await expect(promise).resolves.toBeUndefined();
  });

  it("increments time with optional rounding", () => {
    const base = new Date(Date.UTC(2024, 0, 1, 10, 15, 0));
    const rounded = incrementTime(new Date(base), 2, true);
    expect(rounded.getUTCHours()).toBe(12);
  });

  it("parses and formats dates in multiple ways", () => {
    const date = new Date(Date.UTC(2024, 1, 3));
    expect(parseAndFormatDate(date, "iso")).toBe("2024-02-03T00:00:00.000Z");
    expect(parseAndFormatDate(date, "mm-dd")).toMatch(/02/);
    expect(parseAndFormatDate("invalid")).toBe("");
  });

  it("compares date equality", () => {
    const a = new Date(Date.UTC(2024, 0, 1, 0, 0, 0));
    const b = new Date(Date.UTC(2024, 0, 1, 10, 0, 0));
    expect(isSameDay(a, b)).toBe(true);
    expect(isSameDateTime(a, b, { isIgnoreSeconds: true })).toBe(false);
  });

  it("parses relative durations into ISO timestamps", () => {
    const now = new Date(Date.UTC(2024, 0, 10, 0, 0, 0));
    const iso = parseRelativeTimeToISO("5d", now);
    expect(iso).toMatch(/2024-01-05/);
  });

  it("parses verbose date time strings", () => {
    const parsed = parseFullDateTimeString("January 5, 2024 at 10:30 AM");
    expect(parsed?.getHours()).toBe(10);
  });

  it("shifts dates and attaches time", () => {
    const base = new Date(Date.UTC(2024, 0, 1, 0, 0, 0));
    const shifted = offsetDate(base, 2);
    expect(shifted.getUTCDate()).toBe(3);
    const attached = attachTimeToDate(new Date(base), "15:45");
    expect(attached.getHours()).toBe(15);
  });

  it("formats complete datetime string", () => {
    const result = formatDatetime(preferences, new Date(Date.UTC(2024, 0, 1, 8, 0, 0)));
    expect(result).toMatch(/Jan/);
  });

  it("formats numeric datetime values", () => {
    const result = formatDatetime(preferences, Date.UTC(2024, 0, 1, 8, 0, 0));
    expect(result).toMatch(/Jan/);
  });

  it("compares dates using operators", () => {
    const a = new Date("2024-01-01");
    const b = new Date("2024-01-02");
    expect(compareDates(a, b, "<")).toBe(true);
  });

  it("converts durations to seconds", () => {
    expect(resolveDurationInSeconds({ value: 2, unit: TimeUnit.HOURS })).toBe(
      7200
    );
  });
});
