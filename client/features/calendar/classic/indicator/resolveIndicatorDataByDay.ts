import type { ICalendarIndicatorData } from "@nucleum/features/calendar/calendar.type";
import { MetaResource, Resource } from "@nucleum/datafn/resource.enum";
import { datafn } from "@nucleum/datafn/datafn.store";
import { resolveSessionTimeSplit } from "@nucleum/features/focus/composition.utils";
import { generateSummary } from "@nucleum/features/focus/session.utils";
import type {
  DaySummary,
  ISessionThumb
} from "@nucleum/features/focus/logs/log.type";
import type { ITaskThumb } from "@nucleum/features/focus/tasks/task.type";

export type ResolvedCalendarTileIndicatorDay = {
  tasks: ITaskThumb[];
  focusSessions: (ISessionThumb & {
    splits: { focus: number; brek: number };
  })[];
  nodes: any[];
  calendarNotes: any[];
  summary: DaySummary;
};

type DayBucketResolver = (
  input: Date | string | number
) => ResolvedCalendarTileIndicatorDay;

export function resolveIndicatorDayKey(date: Date): number {
  return resolveDayBucketKey(date);
}

function createDayBucketResolver(
  dayMap: Map<number, ResolvedCalendarTileIndicatorDay>
): DayBucketResolver {
  return (input: Date | string | number) => {
    const key = resolveDayBucketKey(input);
    const existing = dayMap.get(key);
    if (existing) return existing;
    const next: ResolvedCalendarTileIndicatorDay = {
      tasks: [],
      focusSessions: [],
      nodes: [],
      calendarNotes: [],
      summary: { focus: 0, break: 0 }
    };
    dayMap.set(key, next);
    return next;
  };
}

function resolveDayBucketKey(input: Date | string | number): number {
  const key = datafn.temporal.resolveBucketSync({
    value: input,
    scale: "day",
    output: "unix-ms"
  });
  if (typeof key === "number") return key;
  if (key instanceof Date) return key.getTime();
  if (typeof key === "string") {
    const parsed = Date.parse(key);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return new Date(input).setHours(0, 0, 0, 0);
}

function bucketTasks(data: any[], resolveBucket: DayBucketResolver) {
  for (const task of data) {
    resolveBucket(task.dateUnix).tasks.push(task);
  }
}

function bucketSessions(data: any[], resolveBucket: DayBucketResolver) {
  for (const session of data) {
    if (!session?.startUnix) continue;
    resolveBucket(session.startUnix).focusSessions.push({
      ...session,
      splits: resolveSessionTimeSplit(session)
    });
  }
}

function bucketNodes(data: any[], resolveBucket: DayBucketResolver) {
  for (const node of data) {
    if (!node?.createdAt) continue;
    resolveBucket(node.createdAt).nodes.push(node);
  }
}

function bucketCalendarNotes(data: any[], resolveBucket: DayBucketResolver) {
  for (const note of data) {
    if (!note?.date || !note?.text) continue;
    resolveBucket(note.date).calendarNotes.push(note);
  }
}

export function buildResolvedIndicatorDataByDayMap(
  indicatorData: ICalendarIndicatorData[]
): Map<number, ResolvedCalendarTileIndicatorDay> {
  const dayMap = new Map<number, ResolvedCalendarTileIndicatorDay>();
  const resolveBucket = createDayBucketResolver(dayMap);

  for (const entry of indicatorData) {
    if (entry.resource === Resource.task) {
      bucketTasks(entry.data, resolveBucket);
    } else if (entry.resource === Resource.session) {
      bucketSessions(entry.data, resolveBucket);
    } else if (entry.resource === Resource.node) {
      bucketNodes(entry.data, resolveBucket);
    } else if (entry.resource === MetaResource.calendarNotes) {
      bucketCalendarNotes(entry.data, resolveBucket);
    }
  }

  for (const bucket of dayMap.values()) {
    bucket.summary = generateSummary(bucket.focusSessions);
  }

  return dayMap;
}
