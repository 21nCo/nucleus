import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  generateIntervalsFromComposition,
  getTotalsFromComposition
} from "@nucleum/features/focus/composition.utils";
import {
  BreakCompositionType,
  SessionCompositionType,
  type SessionComposition
} from "@21n/types/pointron/sessionComposition.type";
import { BlockType } from "@21n/types/pointron/session.type";

function createComposition(
  overrides: Partial<SessionComposition>
): SessionComposition {
  return {
    id: "test-composition",
    type: SessionCompositionType.TOTAL_DURATION,
    totalDuration: 60 * 60,
    focusDuration: 60 * 60,
    breakDuration: 0,
    numberOfBreaks: 0,
    breakReminder: 0,
    breakType: BreakCompositionType.REMINDER,
    ...overrides
  };
}

function resolveDurationsByType(
  composition: SessionComposition,
  endTime?: Date
) {
  return generateIntervalsFromComposition(composition, endTime).map(
    (interval) => ({
      duration: interval.duration,
      type: interval.type
    })
  );
}

describe("Pointron composition interval generation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-27T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("generates focus break focus bars for total duration with predefined break", () => {
    const composition = createComposition({
      totalDuration: 60 * 60,
      breakDuration: 5 * 60,
      numberOfBreaks: 1,
      breakType: BreakCompositionType.PREDEFINED
    });

    expect(resolveDurationsByType(composition)).toEqual([
      { type: BlockType.FOCUS, duration: 27.5 * 60 },
      { type: BlockType.BREAK, duration: 5 * 60 },
      { type: BlockType.FOCUS, duration: 27.5 * 60 }
    ]);
    expect(getTotalsFromComposition({ composition })).toEqual({
      duration: 60 * 60,
      focus: 55 * 60,
      brek: 5 * 60
    });
  });

  it("keeps target focus duration while adding predefined breaks around it", () => {
    const composition = createComposition({
      type: SessionCompositionType.TARGET_FOCUS,
      focusDuration: 2 * 60 * 60,
      breakDuration: 2 * 60,
      numberOfBreaks: 1,
      breakType: BreakCompositionType.PREDEFINED
    });

    expect(resolveDurationsByType(composition)).toEqual([
      { type: BlockType.FOCUS, duration: 60 * 60 },
      { type: BlockType.BREAK, duration: 2 * 60 },
      { type: BlockType.FOCUS, duration: 60 * 60 }
    ]);
    expect(getTotalsFromComposition({ composition })).toEqual({
      duration: 2 * 60 * 60 + 2 * 60,
      focus: 2 * 60 * 60,
      brek: 2 * 60
    });
  });

  it("generates pomodoro bars without an extra final break", () => {
    const composition = createComposition({
      type: SessionCompositionType.POMODORO,
      focusDuration: 28 * 60,
      breakDuration: 2 * 60,
      numberOfFocusRounds: 2,
      breakType: BreakCompositionType.PREDEFINED
    });

    expect(resolveDurationsByType(composition)).toEqual([
      { type: BlockType.FOCUS, duration: 28 * 60 },
      { type: BlockType.BREAK, duration: 2 * 60 },
      { type: BlockType.FOCUS, duration: 28 * 60 }
    ]);
    expect(getTotalsFromComposition({ composition })).toEqual({
      duration: 58 * 60,
      focus: 56 * 60,
      brek: 2 * 60
    });
  });

  it("keeps the handoff break before additional pomodoro rounds", () => {
    const composition = createComposition({
      type: SessionCompositionType.POMODORO,
      focusDuration: 25 * 60,
      breakDuration: 5 * 60,
      numberOfFocusRounds: 1,
      breakType: BreakCompositionType.PREDEFINED,
      additional: [
        createComposition({
          id: "additional-pomodoro",
          type: SessionCompositionType.POMODORO,
          focusDuration: 10 * 60,
          breakDuration: 0,
          numberOfFocusRounds: 1,
          breakType: BreakCompositionType.REMINDER
        })
      ]
    });

    expect(resolveDurationsByType(composition)).toEqual([
      { type: BlockType.FOCUS, duration: 25 * 60 },
      { type: BlockType.BREAK, duration: 5 * 60 },
      { type: BlockType.FOCUS, duration: 10 * 60 }
    ]);
  });

  it("rejects invalid finite compositions instead of falling back to countup bars", () => {
    const composition = createComposition({
      totalDuration: 60,
      breakDuration: 120,
      numberOfBreaks: 1,
      breakType: BreakCompositionType.PREDEFINED
    });

    expect(generateIntervalsFromComposition(composition)).toEqual([]);
    expect(getTotalsFromComposition({ composition })).toEqual({
      duration: 0,
      focus: 0,
      brek: 0
    });
  });

  it("generates fixed end-time predefined bars from the supplied end time", () => {
    const endTime = new Date("2026-06-27T11:00:00.000Z");
    const composition = createComposition({
      type: SessionCompositionType.END_TIME_FIXED,
      breakDuration: 5 * 60,
      numberOfBreaks: 1,
      breakType: BreakCompositionType.PREDEFINED
    });

    expect(resolveDurationsByType(composition, endTime)).toEqual([
      { type: BlockType.FOCUS, duration: 27.5 * 60 },
      { type: BlockType.BREAK, duration: 5 * 60 },
      { type: BlockType.FOCUS, duration: 27.5 * 60 }
    ]);
  });
});
