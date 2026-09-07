import { describe, expect, it } from "vitest";

import { TimeScale } from "@21n/utils/time.type";

import {
  determineCarbonChartTimeInterval,
  pieLabelFormatter
} from "./carbon.utils";

describe("client/utils/carbon.utils", () => {
  it("formats pie chart labels based on percentage", () => {
    expect(pieLabelFormatter({ percentageValue: 4 })).toBe("");
    expect(pieLabelFormatter({ percentageValue: 7.123, value: 1.23 })).toBe(
      "7.1%"
    );
    expect(pieLabelFormatter({ percentageValue: 12.345, value: 3.21 })).toBe(
      "3.2 hrs (12.3%)"
    );
  });

  it("determines reporting interval from scale", () => {
    expect(determineCarbonChartTimeInterval(0 as any)).toBeUndefined();
    expect(determineCarbonChartTimeInterval(TimeScale.DAYS)).toBe("daily");
    expect(determineCarbonChartTimeInterval(TimeScale.WEEKS)).toBe("weekly");
    expect(determineCarbonChartTimeInterval(TimeScale.MONTHS)).toBe("monthly");
    expect(determineCarbonChartTimeInterval(TimeScale.QUARTERS)).toBe(
      "quarterly"
    );
    expect(determineCarbonChartTimeInterval(TimeScale.YEARS)).toBe("yearly");
  });
});
