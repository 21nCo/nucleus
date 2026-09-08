import { afterEach, describe, expect, it, vi } from "vitest";

import { ActionType } from "@nucleum/client/config/action.type";
import { FileSizeMeasurement } from "@21n/utils/fileSizeMeasurement.enum";
import type { UserDate } from "@21n/utils/userDate.type";

import {
  activeResourceFilter,
  activeResourceFilterIgnoreAncestorInactive,
  activeResourceFilterV2,
  archivedResourceFilter,
  checkDay,
  checkIsToday,
  checkIsTodayUsingTimestamp,
  compareUserDay,
  convertDateStringToArray,
  convertFileSize,
  copyToClipboard,
  debouncer,
  downloadJson,
  generatSessionId,
  generateCmdType,
  generateUID,
  getCurrentUserDate,
  getDateDifferenceFromToday,
  getDayStartTime,
  getJustDate,
  getOneDayEarlier,
  getOneDayLater,
  getUserDate,
  nonTrashFilter,
  padToTwo,
  textTruncateMapper
} from "./utils";

describe("client/utils/utils", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("generates deterministic UID when clock/random mocked", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    const randomMock = vi
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.123456789)
      .mockReturnValueOnce(0.987654321);

    const uid = generateUID();

    expect(uid).toBe("loyw3v284fzzzxjyzk00000y");
    expect(randomMock).toHaveBeenCalledTimes(2);
  });

  it("pads numbers to two digits", () => {
    expect(padToTwo(3)).toBe("03");
    expect(padToTwo(12)).toBe("12");
  });

  it("converts ISO date strings to tuple", () => {
    expect(convertDateStringToArray("2023-09-15")).toEqual([15, "September", 2023]);
  });

  describe("user date helpers", () => {
    const baseDate = new Date(2023, 8, 15, 1, 30).getTime();

    it("calculates user date relative to custom day start", () => {
      expect(getUserDate(baseDate, "00:00")).toEqual({ day: 15, month: 8, year: 2023 });
      expect(getUserDate(baseDate, "02:00")).toEqual({ day: 14, month: 8, year: 2023 });
    });

    it("compares two user days", () => {
      const day: UserDate = { day: 15, month: 8, year: 2023 };
      const later: UserDate = { day: 16, month: 8, year: 2023 };
      const earlier: UserDate = { day: 14, month: 8, year: 2023 };

      expect(compareUserDay(day, { ...day })).toBe(0);
      expect(compareUserDay(earlier, day)).toBe(-1);
      expect(compareUserDay(later, day)).toBe(1);
    });

    it("checks if a user day represents today", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2023, 8, 20, 10));
      const today: UserDate = { day: 20, month: 8, year: 2023 };
      expect(checkIsToday(today)).toBe(true);
      expect(checkIsToday({ ...today, day: 19 })).toBe(false);
    });

    it("checks if timestamp belongs to today's user day", () => {
      vi.useFakeTimers();
      const now = new Date(2023, 0, 5, 3, 0);
      vi.setSystemTime(now);
      const timestamp = now.getTime();
      expect(checkIsTodayUsingTimestamp(timestamp)).toBe(true);
      expect(checkIsTodayUsingTimestamp(timestamp - 24 * 60 * 60 * 1000)).toBe(false);
    });

    it("validates day against session start", () => {
      const day = { day: 10, month: 1, year: 2024 };
      const sessionTs = new Date(2024, 1, 10, 6).getTime();
      expect(checkDay(day, sessionTs)).toBe(true);
      expect(checkDay(day, sessionTs + 24 * 60 * 60 * 1000)).toBe(false);
    });

    it("produces day start timestamps", () => {
      const day = { day: 10, month: 1, year: 2024 };
      const ts = getDayStartTime(day, "07:30");
      const expected = new Date(2024, 1, 10, 7, 30).getTime();
      expect(ts).toBe(expected);
    });

    it("shifts dates forward and backward by one day", () => {
      const date = { day: 1, month: 0, year: 2024 };
      expect(getOneDayLater(date)).toEqual({ day: 2, month: 0, year: 2024 });
      expect(getOneDayEarlier(date)).toEqual({ day: 31, month: 11, year: 2023 });
    });

    it("computes difference from today", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2023, 0, 10));
      expect(getDateDifferenceFromToday({ day: 12, month: 0, year: 2023 })).toBe(2);
      expect(getDateDifferenceFromToday({ day: 8, month: 0, year: 2023 })).toBe(-2);
    });

    it("returns current user date", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2022, 5, 2, 10));
      expect(getCurrentUserDate()).toEqual({ day: 2, month: 5, year: 2022 });
    });

    it("strips time from dates", () => {
      const now = new Date(2022, 10, 5, 15, 30, 45, 500);
      const justDate = getJustDate(now);
      expect(justDate.getHours()).toBe(0);
      expect(justDate.getMinutes()).toBe(0);
      expect(justDate.getSeconds()).toBe(0);
      expect(justDate.getFullYear()).toBe(2022);
      expect(justDate.getMonth()).toBe(10);
      expect(justDate.getDate()).toBe(5);
    });
  });

  it("generates session id from timestamp", () => {
    expect(generatSessionId(1234.567)).toBe("1234");
  });

  it("writes to clipboard", () => {
    const writeText = vi.fn();
    const originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    copyToClipboard("hello");

    expect(writeText).toHaveBeenCalledWith("hello");

    if (originalClipboard) {
      Object.defineProperty(navigator, "clipboard", {
        value: originalClipboard,
        configurable: true
      });
    } else {
      delete (navigator as any).clipboard;
    }
  });

  it("converts file sizes", () => {
    const size = 12_345_678;
    expect(convertFileSize(size, FileSizeMeasurement.BITS)).toBe(size * 8);
    expect(convertFileSize(size, FileSizeMeasurement.BYTES)).toBe(size);
    expect(convertFileSize(size, FileSizeMeasurement.KILOBYTES)).toBeCloseTo(12345.68);
    expect(convertFileSize(size, FileSizeMeasurement.MEGABYTES)).toBeCloseTo(12.35);
    expect(convertFileSize(size, FileSizeMeasurement.GIGABYTES)).toBeCloseTo(0.01);
  });

  it("maps action types to command strings", () => {
    expect(generateCmdType(ActionType.PAGE)).toBe("page");
    expect(generateCmdType(ActionType.MODAL)).toBe("action");
    expect(generateCmdType(ActionType.FUNCTION)).toBe("action");
    expect(generateCmdType(ActionType.LINK)).toBe("link");
    expect(generateCmdType(999 as ActionType)).toBe("action");
  });

  it("downloads JSON content", () => {
    const blobUrl = "blob://test";
    const createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue(blobUrl);
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL");
    const anchor = {
      href: "",
      download: "",
      click: vi.fn()
    } as unknown as HTMLAnchorElement;
    const createElementSpy = vi.fn().mockReturnValue(anchor);
    const originalDocument = globalThis.document;
    (globalThis as any).document = { createElement: createElementSpy };

    downloadJson("{\"foo\":1}", "sample");

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(anchor.download).toBe("sample.json");
    expect(anchor.href).toBe(blobUrl);
    expect(anchor.click).toHaveBeenCalledTimes(1);
    expect(revokeSpy).toHaveBeenCalledWith(blobUrl);

    if (originalDocument) {
      (globalThis as any).document = originalDocument;
    } else {
      delete (globalThis as any).document;
    }
  });

  it("debounces rapid calls", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debouncer(fn, 200);

    debounced(1);
    debounced(2);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(199);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(2);
  });

  it("filters active and archived resources", () => {
    const base = { isArchived: false, trashedAt: null, isAncestorInactive: false };
    expect(activeResourceFilter({ ...base })).toBe(true);
    expect(activeResourceFilter({ ...base, isArchived: true })).toBe(false);
    expect(activeResourceFilter({ ...base, trashedAt: 123 })).toBe(false);

    expect(activeResourceFilterIgnoreAncestorInactive({ ...base })).toBe(true);
    expect(activeResourceFilterIgnoreAncestorInactive({ ...base, isArchived: true })).toBe(false);
    expect(activeResourceFilterIgnoreAncestorInactive({ ...base, trashedAt: 123 })).toBe(false);

    expect(activeResourceFilterV2).toEqual({
      isArchived: false,
      trashedAt: { $is_null: true },
      isAncestorInactive: false
    });

    expect(archivedResourceFilter({ ...base, isArchived: true })).toBe(true);
    expect(archivedResourceFilter({ ...base, isArchived: true, trashedAt: 123 })).toBe(false);
    expect(nonTrashFilter({ trashedAt: null })).toBe(true);
    expect(nonTrashFilter({ trashedAt: 123 })).toBe(false);
  });

  it("truncates text when exceeding length", () => {
    expect(textTruncateMapper("short", 10)).toBe("short");
    expect(textTruncateMapper("abcdefghijklmnop", 5)).toBe("abcde...");
  });
});
