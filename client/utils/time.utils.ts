import type { IUserGlobalPreferences } from "@nucleum/stores/preferences/user-preferences.type";
import type { DatafnDateValue } from "@nucleum/datafn/resource.type";
import {
  TimePeriodType,
  type TimePeriod,
  TimeScale,
  TimeFormat,
  TimeUnit
} from "@21n/utils/time.type";
import type { UserDate } from "@21n/utils/userDate.type";
import { Size } from "@21n/elements/size.enum";
import moment from "moment-timezone";

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
];

const locale =
  typeof window !== "undefined"
    ? navigator.language || navigator.languages[0]
    : undefined;

export function toDateValue(
  value: DatafnDateValue | undefined | null
): Date | undefined {
  if (value === undefined || value === null) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function formatTime(
  userPreferences: IUserGlobalPreferences,
  date: DatafnDateValue,
  params?: { format?: string; isIncludeSeconds?: boolean }
) {
  const resolvedDate = toDateValue(date);
  if (!resolvedDate) return undefined;
  let userPreferredFormat = userPreferences.timeFormat;
  const format = params?.format ?? userPreferredFormat ?? "meridian";
  if (format === "24") {
    let hours = resolvedDate.getHours().toString().padStart(2, "0");
    let minutes = resolvedDate.getMinutes().toString().padStart(2, "0");
    if (!params?.isIncludeSeconds) return `${hours}:${minutes}`;
    let seconds = resolvedDate.getSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  } else if (format === "meridian") {
    let hours = resolvedDate.getHours();
    let minutes = resolvedDate.getMinutes().toString().padStart(2, "0");
    let meridian = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours || 12;
    return `${hours}:${minutes} ${meridian}`;
  }
}

export function formatSeconds(
  seconds: number,
  format: TimeFormat = TimeFormat.VERBOSE,
  params?: {
    isAlwaysShowSecs?: boolean;
    verboseTextSize?: Size.sm | Size.md | Size.lg;
  }
) {
  const numericSeconds =
    typeof seconds === "number" ? seconds : Number(seconds);
  const safeSeconds = Number.isFinite(numericSeconds) ? numericSeconds : 0;
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = Math.floor(safeSeconds % 60);
  if (format === TimeFormat.VERBOSE) {
    const size = params?.verboseTextSize ?? Size.sm;
    const minutesLabel =
      size === Size.sm
        ? "m"
        : size === Size.md
          ? "min"
          : minutes > 1
            ? "minutes"
            : "minute";
    const secondsLabel =
      size === Size.sm
        ? "s"
        : size === Size.md
          ? "sec"
          : secs > 1
            ? "seconds"
            : "second";
    const hoursLabel =
      size === Size.sm
        ? "h"
        : size === Size.md
          ? "hr"
          : hours > 1
            ? "hours"
            : "hour";
    if (hours > 0) {
      return (
        `${hours} ${hoursLabel}` +
        (minutes > 0 ? ` ${minutes} ${minutesLabel}` : "") +
        (+secs > 0 && params?.isAlwaysShowSecs
          ? ` ${secs} ${secondsLabel}`
          : "")
      );
    } else if (minutes > 0) {
      return (
        `${minutes} ${minutesLabel}` +
        (+secs > 0 ? ` ${secs} ${secondsLabel}` : "")
      );
    } else return `${secs} ${secondsLabel}`;
  } else if (format === TimeFormat.CLOCK) {
    const hh = hours.toString().padStart(2, "0");
    const mm = minutes.toString().padStart(2, "0");
    const ss = secs.toString().padStart(2, "0");
    if (hours > 0) return `${hh}:${mm}:${ss}`;
    else return `${mm}:${ss}`;
  } else if (format === TimeFormat.DECIMALS) {
    if (hours > 0) {
      return `${hours}h`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${secs}s`;
    }
  }
}

export function formatSecondsToTimeInDecimals(
  seconds: number,
  toFixed: number = 2,
  scale: string = "hrs",
  isShowUnits: boolean = true
) {
  if (scale === "hrs") {
    return `${(seconds / (60 * 60)).toFixed(toFixed)} ${isShowUnits ? "hr" : ""}`;
  } else if (scale === "min") {
    return `${(seconds / 60).toFixed(toFixed)} ${isShowUnits ? "m" : ""}`;
  }
}

export function toLocalISOString(date: Date) {
  const pad = (number: number) => (number < 10 ? "0" + number : number);
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const milliseconds = (date.getMilliseconds() / 1000).toFixed(3).slice(2, 5);
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
}

export function timePeriodLabel(period: TimePeriod) {
  const { scale, value } = period;
  if (
    value.type === TimePeriodType.RELATIVE ||
    value.type === TimePeriodType.UPPER_RELATIVE
  ) {
    if (typeof value.param != "number") return;
    if (value.param === 0) {
      if (scale === TimeScale.DAYS && value.type === TimePeriodType.RELATIVE)
        return "Today";
      else if (value.type === TimePeriodType.UPPER_RELATIVE) {
        if (scale === TimeScale.DAYS) return "This Month";
        else if (scale === TimeScale.MONTHS) return "This Year";
      } else return `This ${scale.slice(0, scale.length - 1).toLowerCase()}`;
    } else if (value.param === 1) {
      if (scale === TimeScale.DAYS && value.type === TimePeriodType.RELATIVE)
        return "Tomorrow";
      else return `Next ${scale.toLowerCase()}`;
    } else if (value.param === -1) {
      if (scale === TimeScale.DAYS && value.type === TimePeriodType.RELATIVE)
        return "Yesterday";
      else if (value.type === TimePeriodType.UPPER_RELATIVE) {
        if (scale === TimeScale.DAYS) return "Last Month";
        else if (scale === TimeScale.MONTHS) return "Last Year";
      } else return `Last ${scale.toLowerCase().slice(0, scale.length - 1)}`;
    } else if (value.param < 0) {
      return `Last ${Math.abs(value.param)} ${scale.toLowerCase()}`;
    } else if (value.param > 0) {
      return `Next ${value.param} ${scale.toLowerCase()}`;
    }
  } else if (value.type === TimePeriodType.ABSOLUTE) {
    let start = value.param.start.toString();
    let end = value.param.end.toString();
    if (/[a-zA-Z]/.test(start)) {
      start = new Date(value.param.start).toISOString().split("T")[0];
      end = new Date(value.param.end).toISOString().split("T")[0];
    }
    if (start === end) return start;
    return `${start} to ${end}`;
  }
}

export function resolveUpperRelativeTimePeriodTitle(
  scale: TimeScale,
  value: number
) {
  if (scale === TimeScale.DAYS && value === 0)
    return `${new Date().toLocaleDateString("default", {
      month: "long",
      year: "numeric"
    })}`;
  else if (scale === TimeScale.DAYS && value === -1) {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return `${lastMonth.toLocaleDateString("default", {
      month: "long",
      year: "numeric"
    })}`;
  } else if (scale === TimeScale.MONTHS)
    return `${new Date().toLocaleDateString("default", {
      year: "numeric"
    })}`;
}

export function determinePreviousTimePeriod(period: TimePeriod) {
  const val = determineTimePeriodv2(period);
  let previous = val.begin;
  switch (period.scale) {
    case TimeScale.DAYS:
      const numberOfDays = Math.floor(
        (val.end.getTime() - val.begin.getTime()) / (1000 * 60 * 60 * 24)
      );
      previous.setDate(val.begin.getDate() - numberOfDays);
      break;
    case TimeScale.MONTHS:
      const numberOfMonths = Math.floor(
        (val.end.getTime() - val.begin.getTime()) / (1000 * 60 * 60 * 24) / 30
      );
      previous.setMonth(val.begin.getMonth() - numberOfMonths);
      break;
    case TimeScale.YEARS:
      const numberOfYears = Math.floor(
        (val.end.getTime() - val.begin.getTime()) / (1000 * 60 * 60 * 24) / 365
      );
      previous.setFullYear(val.begin.getFullYear() - numberOfYears);
      break;
  }
  return previous;
}

/**
 * @deprecated - Use {@link determineTimePeriodv2} instead
 * @param period
 * @returns
 */
export function determineTimePeriod(period: TimePeriod) {
  let begin = new Date();
  let end = new Date();
  let title;
  if (
    period.value.type === TimePeriodType.ABSOLUTE &&
    period.value instanceof Object &&
    "start" in period.value &&
    "end" in period.value
  ) {
    begin = period.value.param.start;
    end = period.value.param.end;
    return { begin, end, title: "" };
  }
  if (period.scale === TimeScale.DAYS) {
    if (
      period.value.type === TimePeriodType.RELATIVE &&
      typeof period.value.param === "number"
    ) {
      begin.setDate(begin.getDate() + period.value.param);
      title = timePeriodLabel(period);
      if (period.value.param === -1) {
        end.setDate(end.getDate() - 1);
      }
    } else if (
      period.value.type === TimePeriodType.CALENDAR_BOUND &&
      period.value instanceof Array
    ) {
      const year = period.value[0];
      const month = period.value[1];
      begin.setFullYear(year);
      begin.setMonth(month);
      begin.setDate(1);
      end.setFullYear(year);
      end.setMonth(month);
      end.setDate(31);
      title = `Days of ${months[month]} ${year}`;
    }
  } else if (period.scale === TimeScale.MONTHS) {
    if (
      period.value.type === TimePeriodType.RELATIVE &&
      typeof period.value.param === "number"
    ) {
      begin.setMonth(begin.getMonth() + period.value.param);
      title = timePeriodLabel(period);
      if (period.value.param === -1) {
        end.setMonth(end.getMonth() - 1);
      }
      begin.setDate(1);
      end.setDate(31);
    } else if (
      period.value.type === TimePeriodType.CALENDAR_BOUND &&
      period.value instanceof Array
    ) {
      const year = period.value[0];
      begin.setFullYear(year);
      begin.setMonth(0);
      begin.setDate(1);
      end.setFullYear(year);
      end.setMonth(11);
      end.setDate(31);
      title = `Months of ${year}`;
    }
  } else if (period.scale === TimeScale.YEARS) {
    if (
      period.value.type === TimePeriodType.RELATIVE &&
      typeof period.value.param === "number"
    ) {
      begin.setFullYear(begin.getFullYear() + period.value.param);
      title = timePeriodLabel(period);
      if (period.value.param === -1) {
        end.setFullYear(end.getFullYear() - 1);
      }
      begin.setDate(1);
      end.setDate(31);
      begin.setMonth(0);
      end.setMonth(11);
    } else if (
      period.value.type === TimePeriodType.CALENDAR_BOUND &&
      period.value instanceof Array
    ) {
      const year = period.value[0];
      begin.setFullYear(year);
      begin.setMonth(0);
      begin.setDate(1);
      end.setFullYear(year);
      end.setMonth(11);
      end.setDate(31);
      title = `Year ${year}`;
    }
  }
  begin.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { begin, end, title };
}

export function determineTimePeriodv2(period: TimePeriod): {
  begin: Date;
  end: Date;
  title: string;
} {
  let begin = new Date();
  let end = new Date();
  let title = timePeriodLabel(period) ?? "";
  if (
    period.value.type === TimePeriodType.ABSOLUTE &&
    period.value instanceof Object &&
    "start" in period.value.param &&
    "end" in period.value.param
  ) {
    begin = period.value.param.start;
    end = period.value.param.end;
    begin = new Date(period.value.param.start);
    end = new Date(period.value.param.end);
    if (period.scale === TimeScale.YEARS) {
      end.setMonth(11);
    }
    if (period.scale === TimeScale.MONTHS || period.scale === TimeScale.YEARS) {
      const month = (end.getMonth() + 1) % 12;
      const year = month == 0 ? end.getFullYear() + 1 : end.getFullYear();
      const endDate = new Date(Date.UTC(year, month, 0)).getDate();
      end.setDate(endDate);
    }
    return { begin, end, title: "" };
  }
  if (
    period.scale === TimeScale.DAYS &&
    period.value.type === TimePeriodType.RELATIVE &&
    typeof period.value.param === "number"
  ) {
    begin.setDate(begin.getDate() + period.value.param);
    if (period.value.param === -1) {
      end.setDate(end.getDate() - 1);
    }
  } else if (
    ((period.scale === TimeScale.MONTHS &&
      period.value.type === TimePeriodType.RELATIVE) ||
      (period.scale === TimeScale.DAYS &&
        period.value.type === TimePeriodType.UPPER_RELATIVE)) &&
    typeof period.value.param === "number"
  ) {
    begin.setMonth(begin.getMonth() + period.value.param);
    if (period.value.param === -1) {
      end.setMonth(end.getMonth() - 1);
    }
    begin.setDate(1);
    end.setDate(31);
  } else if (
    ((period.scale === TimeScale.YEARS &&
      period.value.type === TimePeriodType.RELATIVE) ||
      (period.scale === TimeScale.MONTHS &&
        period.value.type === TimePeriodType.UPPER_RELATIVE)) &&
    typeof period.value.param === "number"
  ) {
    begin.setFullYear(begin.getFullYear() + period.value.param);
    if (period.value.param === -1) {
      end.setFullYear(end.getFullYear() - 1);
    }
    begin.setDate(1);
    end.setDate(31);
    begin.setMonth(0);
    end.setMonth(11);
  }
  begin.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { begin, end, title };
}

export function getCorrespoingHorizonFrequencyLabel(scale: TimeScale) {
  switch (scale) {
    case TimeScale.DAYS:
      return "Daily";
    case TimeScale.WEEKS:
      return "Weekly";
    case TimeScale.MONTHS:
      return "Monthly";
    case TimeScale.QUARTERS:
      return "Quarterly";
    case TimeScale.YEARS:
      return "Yearly";
  }
}

/**
 * Returns an array of time zones with offsets.
 * @returns Array of time zones with offsets
 */
export const getTimeZonesWithOffsets = () => {
  const zones = moment.tz.names();
  return zones.map((zone) => {
    const offset = moment.tz(zone).utcOffset();
    const formattedOffset =
      (offset >= 0 ? "+" : "-") +
      String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0") +
      ":" +
      String(Math.abs(offset) % 60).padStart(2, "0");
    return {
      label: zone + " (UTC" + formattedOffset + ")",
      offset,
      zone
    };
  });
};

/**
 * Detects the time zone of the user.
 * @returns The time zone of the user.
 */
export function detectTimeZone() {
  const timeZones = getTimeZonesWithOffsets();
  try {
    const detectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timeZone = timeZones.find((x: any) => x.zone === detectedTimeZone);
    return timeZone;
  } catch (error) {
    console.error("Could not detect time zone:", error);
  }
}

/**
 * Date().getTimezoneOffset() returns the offset in minutes and calculates offfset by measuring current user's timezone as 0 and relative measure of UTC from that.
 *
 * Ex: If user is in UTC+5:30, getTimezoneOffset() will return -330 which is UTC is -330 minutes away from current user's timezone.
 *
 * On the database, the offset is stored as an offset of user's zone from UTC, so the offset is stored as +330 for UTC+5:30
 *
 */
export function detectTimeZoneFallback() {
  const offset = -new Date().getTimezoneOffset() * 60;
  const label = detectTimeZone()?.label ?? "UTC";
  return { offset, label };
}

//todo cleanup - this is duplicate of formatSeconds
export function getTimeLabel(time: number) {
  //time in minutes
  const hours = Math.floor(time / 60);
  const minutes = Math.floor(time % 60);
  const seconds = Math.floor((time * 60) % 60);

  const hoursLabel = hours > 1 ? "hrs" : "hr";
  const minutesLabel = minutes > 1 ? "mins" : "min";
  const secondsLabel = seconds > 1 ? "secs" : "sec";

  if (hours > 0) {
    //When more than 60 minutes (at least 1 hour)
    if (minutes === 0) return `${hours} ${hoursLabel}`;
    else return `${hours} ${hoursLabel} ${minutes} ${minutesLabel}`;
  }
  if (minutes > 0) {
    //When between 1 and 60 minutes and hour is 0
    if (minutes < 10 && seconds > 0)
      //When minutes is less than 10 then we want to show seconds as well
      return `${minutes} ${minutesLabel} ${seconds} ${secondsLabel}`;
    return `${minutes} ${minutesLabel}`;
  }
  return `${seconds} ${secondsLabel}`;
}

export function formatUserDate(
  date: UserDate,
  format: string = "verbose"
): string {
  const dd = date.day.toString().padStart(2, "0");
  const mm = (date.month + 1).toString().padStart(2, "0");
  const yy = String(date.year); //.slice(-2);
  if (format === "yyyy:mm:dd") {
    return `${yy}-${mm}-${dd}`;
  } else if (format === "verbose") {
    return `${dd} ${months[date.month]} ${yy}`;
  }
  return `${yy}-${mm}-${dd}`;
}

export function formatDateRelativeToToday(date: UserDate | Date | number) {
  let inputDate: Date;
  let today: Date = new Date();
  let isArchiveFormat: boolean = false;
  if (typeof date === "number") {
    inputDate = new Date(date);
  } else if (date instanceof Date) {
    inputDate = date;
  } else {
    isArchiveFormat = true;
    const now = new Date();
    today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    inputDate = new Date(date.year, date.month, date.day);
  }

  const dayDifference = Math.round(
    (+inputDate - +today) / (1000 * 60 * 60 * 24)
  );
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];

  if (dayDifference === 0) {
    return "Today";
  } else if (dayDifference === -1) {
    return "Yesterday";
  } else if (dayDifference <= -2 && dayDifference >= -6) {
    return `Last ${dayNames[inputDate.getDay()]}`;
  } else {
    if (isArchiveFormat) {
      return formatUserDate(date as UserDate);
    }
    return parseAndFormatDate(inputDate);
  }
}

export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

//generate doc string
/**
 * Increments a date time by a number of hours
 * @param dateTime - date time to increment
 * @param numberOfHours - number of hours to increment by
 * @param isRoundToNearestHour - round to nearest hour
 * @returns
 */
export function incrementTime(
  dateTime: Date,
  numberOfHours: number,
  isRoundToNearestHour: boolean = false
) {
  if (isRoundToNearestHour) {
    const minutes = dateTime.getMinutes();
    const minutesRounded = Math.round(minutes / 60) * 60;
    dateTime.setMinutes(minutesRounded);
  }
  return new Date(dateTime.getTime() + numberOfHours * 60 * 60 * 1000);
}

export function parseAndFormatDate(
  date: Date | number | string,
  format:
    | "iso"
    | "iso-short"
    | "verbose"
    | "mm-dd"
    | "mmm-dd"
    | "mmm-yy"
    | "mmm-yyyy"
    | "week-yyyy"
    | "yyyy" = "verbose"
) {
  if (typeof date === "number") date = new Date(date);
  else if (typeof date === "string") date = new Date(date);
  if (date.toString() === "Invalid Date") return "";
  if (format === "iso" || format === "iso-short") {
    let year = date.getFullYear();
    let month = (1 + date.getMonth()).toString().padStart(2, "0");
    let day = date.getDate().toString().padStart(2, "0");
    if (format === "iso") return `${year}-${month}-${day}T00:00:00.000Z`;
    else return `${year}-${month}-${day}`;
  } else if (format === "verbose") {
    return date.toLocaleDateString(locale, {
      month: "short",
      day: "2-digit",
      year: "numeric"
    });
  } else if (format === "mmm-dd") {
    return date.toLocaleDateString(locale, {
      month: "short",
      day: "2-digit"
    });
  } else if (format === "mm-dd") {
    return date.toLocaleDateString(locale, {
      month: "2-digit",
      day: "2-digit"
    });
  } else if (format === "mmm-yy") {
    return date.toLocaleDateString(locale, {
      month: "short",
      year: "2-digit"
    });
  } else if (format === "mmm-yyyy") {
    return date.toLocaleDateString(locale, {
      month: "short",
      year: "numeric"
    });
  } else if (format === "yyyy") {
    return date.toLocaleDateString(locale, {
      year: "numeric"
    });
  } else if (format === "week-yyyy") {
    const weekNumber = getWeekNumber(date);
    const year = date.getFullYear();
    return `${year}: W${weekNumber}`;
  }
  return "";
}

export function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function isSameDateTime(
  date1: Date,
  date2: Date,
  params?: { isIgnoreSeconds?: boolean }
) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate() &&
    date1.getHours() === date2.getHours() &&
    date1.getMinutes() === date2.getMinutes() &&
    (params?.isIgnoreSeconds || date1.getSeconds() === date2.getSeconds())
  );
}

export function parseRelativeTimeToISO(label: string, now: Date = new Date()) {
  if (!label) return undefined;
  const match = label
    .trim()
    .toLowerCase()
    .match(/(\d+)\s*(s|m|h|d|w|mo|y)\b/);
  if (!match) return undefined;
  const amount = parseInt(match[1], 10);
  const unit = match[2];
  const date = new Date(now);
  if (unit === "s") date.setSeconds(date.getSeconds() - amount);
  else if (unit === "m") date.setMinutes(date.getMinutes() - amount);
  else if (unit === "h") date.setHours(date.getHours() - amount);
  else if (unit === "d") date.setDate(date.getDate() - amount);
  else if (unit === "w") date.setDate(date.getDate() - amount * 7);
  else if (unit === "mo") {
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    let newMonth = currentMonth - amount;
    let newYear = currentYear;
    while (newMonth < 0) {
      newMonth += 12;
      newYear -= 1;
    }
    date.setFullYear(newYear);
    date.setMonth(newMonth);
  } else if (unit === "y") date.setFullYear(date.getFullYear() - amount);
  return date.toISOString();
}

export function parseFullDateTimeString(
  dateTimeString: string
): Date | undefined {
  if (!dateTimeString) return undefined;

  const match = dateTimeString.match(
    /^(\w+)\s+(\d+),\s+(\d+)\s+at\s+(\d+):(\d+)\s+(AM|PM)$/i
  );
  if (!match) return undefined;

  const [, monthName, day, year, hour, minute, period] = match;

  const monthMap: { [key: string]: number } = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11
  };

  const month = monthMap[monthName.toLowerCase()];
  if (month === undefined) return undefined;

  let hour24 = parseInt(hour, 10);
  if (period.toUpperCase() === "PM" && hour24 !== 12) hour24 += 12;
  if (period.toUpperCase() === "AM" && hour24 === 12) hour24 = 0;

  return new Date(
    parseInt(year, 10),
    month,
    parseInt(day, 10),
    hour24,
    parseInt(minute, 10)
  );
}

export function offsetDate(date: Date, offset: number) {
  return new Date(date.getTime() + offset * 24 * 60 * 60 * 1000);
}

/**
 * Attaches time to a date - time is in format HH:MM
 * @param date
 * @param time
 * @returns
 */
export function attachTimeToDate(date: Date, time: string) {
  const [hours, minutes] = time.split(":");
  date.setHours(parseInt(hours));
  date.setMinutes(parseInt(minutes));
  return date;
}

export function formatDatetime(
  userPreferences: IUserGlobalPreferences,
  date: DatafnDateValue
) {
  const resolvedDate = toDateValue(date);
  if (!resolvedDate) return "";
  const formattedDate = parseAndFormatDate(resolvedDate);
  const formattedTime = formatTime(userPreferences, resolvedDate);
  return `${formattedDate} ${formattedTime}`;
}

/**
 * Compares two dates - ignores time
 * @param date1
 * @param date2
 * @param operator
 * @returns
 */
export function compareDates(
  date1: Date,
  date2: Date,
  operator: "==" | ">=" | "<=" | ">" | "<"
) {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());

  if (operator === "==") {
    return d1.getTime() === d2.getTime();
  } else if (operator === ">=") {
    return d1.getTime() >= d2.getTime();
  } else if (operator === "<=") {
    return d1.getTime() <= d2.getTime();
  } else if (operator === ">") {
    return d1.getTime() > d2.getTime();
  } else if (operator === "<") {
    return d1.getTime() < d2.getTime();
  }
  return false;
}

export function resolveDurationInSeconds(duration: {
  value: number;
  unit: TimeUnit;
}) {
  switch (duration.unit) {
    case TimeUnit.SECONDS:
      return duration.value;
    case TimeUnit.MINUTES:
      return duration.value * 60;
    case TimeUnit.HOURS:
      return duration.value * 60 * 60;
    default:
      return duration.value;
  }
}

export function getWeekNumber(date: Date): number {
  const year = date.getFullYear();
  const yearStart = new Date(year, 0, 1);
  const daysSinceYearStart = Math.floor(
    (date.getTime() - yearStart.getTime()) / 86400000
  );
  const yearStartDay = yearStart.getDay();
  const adjustedDays = daysSinceYearStart + yearStartDay;
  return Math.ceil((adjustedDays + 1) / 7);
}
