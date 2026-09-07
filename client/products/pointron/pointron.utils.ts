import { get } from "svelte/store";
import {
  SessionCompositionType,
  type SessionComposition,
  BreakCompositionType
} from "@21n/types/pointron/sessionComposition.type";
import {
  type ISessionInterval,
  BlockType
} from "@21n/types/pointron/session.type";
import { activeSession } from "@nucleum/features/focus/session.store";
import { type ISessionBase, SessionType } from "@nucleum/features/focus/logs/log.type";
import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";

type ITag = {
  label: string;
};

export function getTotalsFromComposition(
  params: {
    composition?: SessionComposition | undefined;
    intervals?: ISessionInterval[] | undefined;
  } = {
    composition: undefined,
    intervals: undefined
  }
) {
  let { intervals, composition } = params;
  if (!intervals && composition)
    intervals = generateIntervalsFromComposition(composition);
  if (!intervals) return { duration: 0, focus: 0, brek: 0 };
  let duration = intervals.reduce((sum, item) => sum + (item.duration ?? 0), 0);
  let focus = intervals.reduce(
    (sum, item) =>
      sum + (item.type === BlockType.FOCUS ? (item.duration ?? 0) : 0),
    0
  );
  let brek = intervals.reduce(
    (sum, item) =>
      sum + (item.type === BlockType.BREAK ? (item.duration ?? 0) : 0),
    0
  );
  return { duration, focus, brek };
}
export function generateIntervalsFromComposition(
  composition: SessionComposition
) {
  let bars: Omit<ISessionInterval, "start">[] = [];
  let intervals: ISessionInterval[] = [];
  if (!composition) return intervals;
  if (
    (composition?.numberOfFocusRounds &&
      composition.numberOfFocusRounds > 100) ||
    (composition?.numberOfBreaks && composition.numberOfBreaks > 100)
  ) {
    return intervals;
  }
  bars = generateIntervals(composition);
  if (
    composition.type === SessionCompositionType.POMODORO &&
    composition.additional &&
    composition.additional.length > 0
  ) {
    composition.additional.forEach((p) => {
      bars = [...bars, ...generateIntervals(p)];
    });
  }
  if (bars.length > 0) {
    intervals = refreshPredefinedIntervalsStartTime(bars, new Date());
  }
  return intervals;
}

export function refreshPredefinedIntervalsStartTime(
  intervals: Omit<ISessionInterval, "start">[],
  start: Date
) : ISessionInterval[] {
  let resolvedIntervals: ISessionInterval[] = [];
  intervals.forEach((interval, index) => {
    if (index == 0) {
      resolvedIntervals = [
        {
          ...interval,
          start: start.getTime()
        }
      ];
      return;
    }
    const previousBar = resolvedIntervals[index - 1];
    resolvedIntervals = [
      ...resolvedIntervals,
      {
        ...interval,
        start: previousBar.start + previousBar.duration * 1000
      }
    ];
  });
  return resolvedIntervals;
}

function generateIntervals(composition: SessionComposition) {
  if (!composition) return [];
  let focusDuration;
  let numberOfFocusRounds;
  if (
    composition.type === SessionCompositionType.POMODORO &&
    composition.numberOfFocusRounds
  ) {
    focusDuration = composition.focusDuration;
    numberOfFocusRounds = composition.numberOfFocusRounds;
  } else if (composition.type === SessionCompositionType.TARGET_FOCUS) {
    if (
      composition.breakType === BreakCompositionType.PREDEFINED &&
      composition.numberOfBreaks &&
      composition.breakDuration
    ) {
      numberOfFocusRounds = composition.numberOfBreaks + 1;
      focusDuration = composition.focusDuration / numberOfFocusRounds;
    } else {
      numberOfFocusRounds = 1;
      focusDuration = composition.focusDuration;
    }
  } else if (
    composition.type === SessionCompositionType.TOTAL_DURATION &&
    composition.totalDuration
  ) {
    if (
      composition.breakType === BreakCompositionType.PREDEFINED &&
      composition.numberOfBreaks &&
      composition.breakDuration
    ) {
      let totalFocusDuration =
        composition.totalDuration -
        composition.numberOfBreaks * composition.breakDuration;
      numberOfFocusRounds = composition.numberOfBreaks + 1;
      focusDuration = totalFocusDuration / numberOfFocusRounds;
    } else {
      focusDuration = composition.totalDuration;
      numberOfFocusRounds = 1;
    }
  } else if (composition.type === SessionCompositionType.END_TIME_FIXED) {
    const endTime = get(activeSession).end;
    if (!endTime) return [];
    if (
      composition.breakType === BreakCompositionType.PREDEFINED &&
      composition.numberOfBreaks &&
      composition.breakDuration
    ) {
      numberOfFocusRounds = composition.numberOfBreaks + 1;
      focusDuration =
        (Math.round((endTime.getTime() - new Date().getTime()) / 1000) -
          composition.breakDuration * (composition.numberOfBreaks ?? 1)) /
        numberOfFocusRounds;
    } else {
      focusDuration = Math.round(
        (endTime.getTime() - new Date().getTime()) / 1000
      );
      numberOfFocusRounds = 1;
    }
  } else if (composition.focusDuration) {
    focusDuration = composition.focusDuration;
    numberOfFocusRounds = 1;
  }
  if (
    typeof focusDuration !== "number" ||
    typeof numberOfFocusRounds !== "number" ||
    !Number.isFinite(focusDuration) ||
    !Number.isFinite(numberOfFocusRounds) ||
    focusDuration <= 0 ||
    numberOfFocusRounds <= 0
  )
    return [];
  const focusBlockDuration = focusDuration;
  const focusRoundCount = numberOfFocusRounds;
  let bars: Omit<ISessionInterval, "start">[] = [];
  for (let i = 0; i < focusRoundCount; i++) {
    bars = [
      ...bars,
      {
        id: generateSimpleRandomId(),
        duration: focusBlockDuration,
        progress: 0,
        type: BlockType.FOCUS
      }
    ];
    const shouldAddTrailingBreak =
      composition.type === SessionCompositionType.POMODORO
        ? !(
            i === focusRoundCount - 1 &&
            (composition.additional === undefined ||
              composition.additional.length < 1)
          )
        : [
            SessionCompositionType.TARGET_FOCUS,
            SessionCompositionType.TOTAL_DURATION,
            SessionCompositionType.END_TIME_FIXED
          ].includes(composition.type) && i !== focusRoundCount - 1;
    if (
      composition.breakType === BreakCompositionType.PREDEFINED &&
      composition.breakDuration > 0 &&
      shouldAddTrailingBreak
    ) {
      bars = [
        ...bars,
        {
          id: generateSimpleRandomId(),
          duration: composition.breakDuration,
          progress: 0,
          type: BlockType.BREAK
        }
      ];
    }
  }
  return bars;
}

export function resolveSessionSplitFromIntervals(
  intervals: ISessionInterval[]
) {
  intervals = intervals.filter((x) => x && x.progress > 0);
  let focus = intervals
    .filter((x) => x.type === BlockType.FOCUS)
    .reduce((acc, curr) => acc + curr.duration * curr.progress, 0);
  let brek = intervals
    .filter((x) => x.type === BlockType.BREAK)
    .reduce((acc, curr) => acc + curr.duration * curr.progress, 0);
  return { focus, brek };
}

export function resolveSessionTimeSplit(x: ISessionBase) {
  let sessionTime = { focus: 0, brek: 0 };
  if (
    (x.type === SessionType.COUNTUP || x.type === SessionType.MANUAL_ENTRY) &&
    x.start &&
    new Date(x.start).getTime() < new Date("2024-08-22").getTime()
  ) {
    sessionTime = resolveSessionTimeLegacy(x);
  } else if (x.blocks) {
    sessionTime = resolveSessionSplitFromIntervals(x.blocks);
  }
  return sessionTime;
}

export function resolveSessionTimeLegacy(session: ISessionBase) {
  if (
    (session.type === SessionType.COUNTUP && session.blocks.length === 1) ||
    session.type === SessionType.MANUAL_ENTRY
  ) {
    return { focus: session.elapsed, brek: 0 };
  } else if (session.type === SessionType.COUNTUP) {
    let focus = session.blocks
      .filter((x) => x?.type === BlockType.FOCUS)
      .reduce((acc, curr) => acc + curr.duration * 1000, 0);
    let brek = session.blocks
      .filter((x) => x?.type === BlockType.BREAK)
      .reduce((acc, curr) => acc + curr.duration * 1000, 0);
    return { focus: focus / 1000, brek: brek / 1000 };
  } else {
    return resolveSessionSplitFromIntervals(session.blocks);
  }
}

export function roundOffToNdigitsAfterDecimal(number: number, n: number) {
  return Math.round(number * Math.pow(10, n)) / Math.pow(10, n);
}

export function addHashToTagLabel(tag: ITag) {
  return {
    ...tag,
    label: `#${tag.label}`
  };
}

export function refreshFocusDurationForFixedEndTime(
  composition: SessionComposition,
  endTime: Date
) {
  composition.focusDuration =
    (endTime.getTime() - new Date().getTime()) / 1000 -
    composition.breakDuration * (composition.numberOfBreaks ?? 1);
  return composition;
}
