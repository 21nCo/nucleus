import type { UserDate } from "@21n/utils/userDate.type";
import { FileSizeMeasurement } from "@21n/utils/fileSizeMeasurement.enum";
import { ActionType } from "@nucleum/application/commandBar/action.type";

/**
 * @deprecated - use lib/shared/crypto.utils instead
 * @returns
 */
export function generateUID() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}

export function padToTwo(x: number) {
  return x.toString().padStart(2, "0");
}
/**
 * Converts Date String from YYYY-MM-DD format to [DD,Month,YYYY] array
 * @param dateString
 * @returns
 */
export function convertDateStringToArray(dateString: string) {
  const [year, month, day] = dateString.split("-");
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];
  const monthName = monthNames[parseInt(month, 10) - 1];
  return [parseInt(day, 10), monthName, parseInt(year, 10)];
}
export function getUserDate(timestamp: number, dayStart: string = "00:00") {
  let dayStartTimeParts = dayStart.split(":");
  let startHours = +dayStartTimeParts[0];
  let startMinutes = +dayStartTimeParts[1];
  let date = new Date(timestamp);
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let isSameDay =
    hours > startHours
      ? true
      : hours === startHours
        ? minutes >= startMinutes
        : false;
  let userDate = {
    day: date.getDate(),
    month: date.getMonth(),
    year: date.getFullYear()
  };
  userDate = isSameDay ? userDate : getOneDayEarlier(userDate);
  return userDate;
}

export function compareUserDay(x: UserDate, y: UserDate) {
  if (x.day === y.day && x.year === y.year && x.month === y.month) {
    return 0;
  } else if (
    x.year < y.year ||
    (x.year === y.year && x.month < y.month) ||
    (x.year === y.year && x.month === y.month && x.day < y.day)
  ) {
    return -1;
  } else {
    return 1;
  }
}
export function checkIsToday(x: UserDate, dayStart: string = "00:00") {
  let y = getCurrentUserDate(dayStart);
  return compareUserDay(x, y) === 0;
}
export function checkIsTodayUsingTimestamp(
  x: number,
  dayStart: string = "00:00"
) {
  let y = getCurrentUserDate(dayStart);
  return checkDay(y, x);
}

export function checkDay(
  day: UserDate,
  sessionStartTime: number,
  dayStartSetting: string = "00:00"
) {
  let calculatedDate = getUserDate(sessionStartTime, dayStartSetting);
  return (
    day.year === calculatedDate.year &&
    day.month === calculatedDate.month &&
    day.day === calculatedDate.day
  );
}

export function getDayStartTime(date: UserDate, dayStart: string = "00:00") {
  const [hours, minutes] = dayStart.split(":").map(Number);
  const day = new Date(date.year, date.month, date.day);
  day.setHours(hours, minutes, 0, 0);
  return day.getTime();
}

export function getOneDayLater(date: UserDate) {
  let currentDate = new Date(date.year, date.month, date.day);
  const oneDayLater = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  return {
    day: oneDayLater.getDate(),
    month: oneDayLater.getMonth(),
    year: oneDayLater.getFullYear()
  };
}

export function getOneDayEarlier(date: UserDate) {
  let currentDate = new Date(date.year, date.month, date.day);
  const oneDayEarlier = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
  return {
    day: oneDayEarlier.getDate(),
    month: oneDayEarlier.getMonth(),
    year: oneDayEarlier.getFullYear()
  };
}

export function getDateDifferenceFromToday(date: UserDate) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const inputDate = new Date(date.year, date.month, date.day);
  return Math.round((+inputDate - +today) / (1000 * 60 * 60 * 24));
}

export function getCurrentUserDate(dayStart: string = "00:00") {
  const now = new Date().getTime();
  return getUserDate(now, dayStart);
}
export function getJustDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * @deprecated - use generateResourceId instead
 * @param timestamp
 * @returns
 */
export function generatSessionId(timestamp: number) {
  return String(Math.floor(timestamp));
}

export function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}

export function convertFileSize(
  sizeInBytes: number,
  desiredType: FileSizeMeasurement
) {
  switch (desiredType) {
    case FileSizeMeasurement.BITS:
      return sizeInBytes * 8;
    case FileSizeMeasurement.BYTES:
      return sizeInBytes;
    case FileSizeMeasurement.KILOBYTES:
      return Math.round((sizeInBytes / 1000) * 100) / 100;
    case FileSizeMeasurement.MEGABYTES:
      return Math.round((sizeInBytes / 1000000) * 100) / 100;
    case FileSizeMeasurement.GIGABYTES:
      return Math.round((sizeInBytes / 1000000000) * 100) / 100;
    default:
      return sizeInBytes;
  }
}

// export function isClient() {
//   return typeof window !== "undefined";
// }

export function generateCmdType(actionType: ActionType) {
  switch (actionType) {
    case ActionType.PAGE:
      return "page";
    case (ActionType.MODAL, ActionType.FUNCTION):
      return "action";
    case ActionType.LINK:
      return "link";
    default:
      return "action";
  }
}

/**
 * @deprecated - use fileStore.downloadFromBlob instead
 * Downloads a json file
 * @param data stringified json
 * @param label
 */
export function downloadJson(data: string, label: string | null = null) {
  // const blob = new Blob([JSON.stringify(data, null, 2)], {
  //   type: "application/json"
  // });
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = (label ?? "data") + ".json";
  link.click();
  URL.revokeObjectURL(url);
}
/**
 * Used to create a debounced version of a function so that the uneccessary calls to that function can be reduced. Closure is used to remember the previous timer. "this" is used here to remember the context of the func passed and "apply" is used to apply the remembered context.
 * @summary To create a debounced version of a function.
 * @param func the function to be debounced
 * @param timeout recycled wait time before the function is called
 * @returns {Function} the debounced function
 */
export function debouncer(func: any, timeout: number) {
  let timer: any;
  return function (this: any, ...args: any) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout);
  };
}

export const isTrashedResource = (x: any) => x?.trashedAt != null;

export const activeResourceFilter = (x: any) =>
  !x.isArchived && !isTrashedResource(x) && !x.isAncestorInactive;

export const activeResourceFilterIgnoreAncestorInactive = (x: any) =>
  !x.isArchived && !isTrashedResource(x);

export const activeResourceFilterV2 = {
  isArchived: false,
  trashedAt: { $is_null: true },
  isAncestorInactive: false
};

export const archivedResourceFilter = (x: any) =>
  x.isArchived && !isTrashedResource(x) && !x.isAncestorInactive;

export const nonTrashFilter = (x: any) => !isTrashedResource(x);

export const textTruncateMapper = (x: string, length: number = 15) =>
  x?.length > length ? x.slice(0, length) + "..." : x;
