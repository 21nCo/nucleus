import { Resource } from "@nucleum/datafn/resource.enum";
import {
  determineResourceType,
  isSameResource,
  resourceInList
} from "@nucleum/datafn/resource.utils";
import type { IRecordId } from "@nucleum/schema/legacy/data.type";
import {
  BlockType,
  type ICurrentFocusItem,
  type IFocusItemsStore,
  type ISessionInterval
} from "@nucleum/features/focus/session.type";
import { sortArrayByOrder } from "@21n/shared-utils/obj.utils";
import type {
  DaySummary,
  ISessionThumb
} from "@nucleum/features/focus/logs/log.type";

export function transformFocusItemsV1(rawItems: any[]) {
  let items: any[] = [];
  rawItems.forEach((item: any) => {
    if (item.objectiveId && !item.taskId) {
      let tasks = rawItems.filter(
        (x: any) => x.objectiveId === item.objectiveId && x.taskId
      );
      if (tasks && tasks.length > 0) {
        tasks = sortArrayByOrder(tasks);
        tasks = tasks.map((x: any) => {
          x.color = item.color;
          return x;
        });
        items = items.concat({ ...item, tasks });
      } else items = items.concat(item);
    } else if (!item.objectiveId && item.taskId) {
      items = items.concat(item);
    }
  });
  return sortArrayByOrder(items);
}

/**
 * Resolves the total time of the task time from the focus item blocks.
 * @param focusItemBlocks
 * @returns time in seconds
 */
export function resolveTotalTaskTime(
  focusItemBlocks: { start: number; end: number }[]
) {
  let totalFromBlocks = 0;
  if (focusItemBlocks && focusItemBlocks.length > 0) {
    totalFromBlocks = focusItemBlocks.reduce((acc, curr) => {
      return acc + ((curr.end ?? new Date().getTime()) - curr.start);
    }, 0);
  }
  return totalFromBlocks / 1000;
}

type FocusItemBlock = { start: number; end: number; type: BlockType };

export function resolveTaskFocus(
  sessionBlocks: ISessionInterval[],
  focusItemBlocks?: { start: number; end: number }[],
  currentStartTime?: number
) {
  let focusFromPreviousBlocks = 0;
  let currentBlockFocus = 0;
  if (focusItemBlocks) {
    focusItemBlocks.forEach((block) => {
      const intervals = resolveIntervals(sessionBlocks, block.start, block.end);
      focusFromPreviousBlocks += calculateTotalFocusAndBreak(intervals).focus;
    });
  }
  if (!currentStartTime) return focusFromPreviousBlocks;
  const intervalsForCurrentBlock = resolveIntervals(
    sessionBlocks,
    currentStartTime,
    new Date().getTime()
  );
  currentBlockFocus = calculateTotalFocusAndBreak(
    intervalsForCurrentBlock
  ).focus;
  return focusFromPreviousBlocks + currentBlockFocus;

  function resolveIntervals(
    intervals: ISessionInterval[],
    start: number,
    end: number
  ) {
    let intervalsWithin: FocusItemBlock[] = [];
    let intervalMidwayLeft: FocusItemBlock | undefined;
    let intervalMidwayRight: FocusItemBlock | undefined;
    let intervalOverflow: FocusItemBlock | undefined;
    // let intervalCurrent: FocusItemBlock | undefined;
    intervals.forEach((interval, index) => {
      if (!interval?.start) return;
      if (interval.start > end) return;
      let intervalEnd = intervals[index + 1]?.start;
      if (!intervalEnd) {
        // if (props?.isCurrentBlock) {
        //   intervalCurrent = {
        //     start: interval.start,
        //     end: end,
        //     type: interval.type
        //   };
        //   return;
        // }
        intervalEnd = new Date().getTime();
      }
      if (
        interval.start >= start &&
        intervalEnd > start &&
        intervalEnd <= end
      ) {
        intervalsWithin.push({
          start: interval.start,
          end: intervalEnd,
          type: interval.type
        });
      }
      if (interval.start < start && intervalEnd > start && intervalEnd <= end) {
        intervalMidwayLeft = {
          start: start,
          end: intervalEnd,
          type: interval.type
        };
      }
      if (
        interval.start > start &&
        interval.start < end &&
        intervalEnd > start &&
        intervalEnd > end
      ) {
        intervalMidwayRight = {
          start: interval.start,
          end: end,
          type: interval.type
        };
      }
      if (interval.start < start && intervalEnd > end) {
        intervalOverflow = { start, end, type: interval.type };
      }
    });
    let result = [...intervalsWithin];
    if (intervalMidwayLeft) result.unshift(intervalMidwayLeft);
    if (intervalMidwayRight) result.push(intervalMidwayRight);
    if (intervalOverflow) result.push(intervalOverflow);
    return result;
  }

  function calculateTotalFocusAndBreak(
    blocks: { start: number; end?: number; type: BlockType }[]
  ) {
    let focus = 0;
    let brek = 0;
    if (!blocks || blocks.length < 0) return { focus: 0, brek: 0 };
    blocks.forEach((element, index) => {
      if (!element) return;
      if (element.type === BlockType.FOCUS) {
        if (!element.start) return;
        const end = element.end ?? blocks[index + 1]?.start;
        if (!end) {
          const duration = new Date().getTime() - element.start;
          focus += duration;
        } else {
          const duration = end - element.start;
          focus += duration;
        }
      }
      if (element.type === BlockType.BREAK) {
        if (!element.start) return;
        const end = element.end ?? blocks[index + 1]?.start;
        if (!end) {
          const duration = new Date().getTime() - element.start;
          brek += duration;
        } else {
          const duration = end - element.start;
          brek += duration;
        }
      }
    });
    return {
      focus: focus / 1000,
      brek: brek / 1000
    };
  }
}

/**
 * @deprecated - use activeSession.isCurrentFocusItem(id) instead
 * @param focusItems
 * @param id
 * @param currentFocusItem
 * @returns
 */
export function resolveIfCurrentFocusItem(
  focusItems: IFocusItemsStore,
  id: IRecordId,
  currentFocusItem?: ICurrentFocusItem
) {
  if (!currentFocusItem) return false;
  const resourceTypeOfCurrentFocus = determineResourceType(currentFocusItem.id);
  const resourceTypeOfItem = determineResourceType(id);
  if (
    resourceTypeOfCurrentFocus === Resource.objective ||
    resourceTypeOfItem === Resource.task
  ) {
    return isSameResource(id, currentFocusItem);
  } else if (resourceTypeOfCurrentFocus === Resource.task) {
    const correspondingGoal = focusItems.items.find((x) =>
      x.tasks?.some(resourceInList(currentFocusItem))
    );
    if (correspondingGoal) {
      return isSameResource(correspondingGoal.id, id);
    }
  }
}

export function generateSummary(
  logs: (ISessionThumb & {
    splits: { focus: number; brek: number };
  })[]
): DaySummary {
  let focus = 0;
  let breakTime = 0;
  logs.forEach((x) => {
    focus += x.splits.focus;
    breakTime += x.splits.brek;
  });
  return { focus, break: breakTime };
}
