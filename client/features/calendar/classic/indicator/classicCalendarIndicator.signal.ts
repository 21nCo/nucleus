import {
  combineSignals,
  time,
  type DatafnSignal,
  type DatafnTemporalScale
} from "@datafn/client";
import type { ICalendarIndicatorData } from "@nucleum/features/calendar/calendar.type";
import { activeResourceFilter } from "@21n/utils/utils";
import { MetaResource, Resource } from "@nucleum/datafn/resource.enum";
import { datafn } from "@nucleum/datafn/datafn.store";
import {
  NodeMetaType,
  rootNodeTypeList
} from "@nucleum/features/memory/node/node.type";
import { datafnHeavyComputedSignalOptions } from "@nucleum/datafn/signalCache";
import { TimeScaleUnit } from "@21n/types/time.type";
import { resolveIndicatorColor } from "@nucleum/features/calendar/classic/indicator/classicCalendarIndicator.utils";

type ClassicCalendarIndicatorSignalInput = {
  resources: (Resource | MetaResource)[];
  date: Date;
  scale: TimeScaleUnit;
};

type IndicatorSignalEntry = {
  resource: Resource | MetaResource;
  signal: DatafnSignal<unknown>;
  color?: string;
  filter?: (record: any) => boolean;
};

const emptyIndicatorSignal: DatafnSignal<ICalendarIndicatorData[]> = {
  get: () => [],
  subscribe: (handler) => {
    handler([]);
    return () => {};
  },
  loading: false,
  error: null,
  refreshing: false,
  nextCursor: null,
  dispose: () => {}
};

/**
 * Creates the combined DataFn signal that feeds classic calendar tile indicators
 * for the selected resources and visible time scale.
 */
export function createClassicCalendarIndicatorSignal({
  resources,
  date,
  scale
}: ClassicCalendarIndicatorSignalInput): DatafnSignal<
  ICalendarIndicatorData[]
> {
  const entries: IndicatorSignalEntry[] = [];
  const temporalScale = resolveTemporalScale(scale);

  if (resources.includes(Resource.task)) {
    entries.push({
      resource: Resource.task,
      color: resolveIndicatorColor(Resource.task),
      signal: datafn.task.signal(
        {
          select: [
            "id",
            "updatedAt",
            "trashedAt",
            "isArchived",
            "isAncestorInactive",
            "isChecked",
            "dateUnix"
          ],
          temporal: time.period("dateUnix", { scale: temporalScale, at: date })
        },
        datafnHeavyComputedSignalOptions
      )
    });
  }

  if (resources.includes(Resource.session)) {
    entries.push({
      resource: Resource.session,
      color: resolveIndicatorColor(Resource.session),
      signal: datafn.session.signal(
        {
          select: [
            "id",
            "updatedAt",
            "trashedAt",
            "isArchived",
            "isAncestorInactive",
            "startUnix",
            "blocks",
            "start"
          ],
          temporal: time.period("startUnix", { scale: temporalScale, at: date })
        },
        datafnHeavyComputedSignalOptions
      )
    });
  }

  if (resources.includes(Resource.node)) {
    entries.push({
      resource: Resource.node,
      color: resolveIndicatorColor(Resource.node),
      signal: datafn.node.signal(
        {
          select: [
            "id",
            "updatedAt",
            "trashedAt",
            "isArchived",
            "isAncestorInactive",
            "createdAt",
            "metaType",
            "contentType",
            "creationContext"
          ],
          filters: {
            metaType: { $is_empty: true },
            contentType: { $in: [...rootNodeTypeList] },
            creationContext: { $is_empty: true }
          },
          temporal: time.period(
            "createdAt",
            { scale: temporalScale, at: date },
            { storage: "date" }
          )
        },
        datafnHeavyComputedSignalOptions
      )
    });
  }

  if (resources.includes(MetaResource.calendarNotes)) {
    entries.push({
      resource: MetaResource.calendarNotes,
      color: resolveIndicatorColor(MetaResource.calendarNotes),
      signal: datafn.node.signal(
        {
          select: [
            "id",
            "updatedAt",
            "trashedAt",
            "isArchived",
            "isAncestorInactive",
            "metaType",
            "date",
            "text"
          ],
          filters: {
            metaType: NodeMetaType.CALENDAR_NOTES
          },
          temporal: time.period(
            "date",
            { scale: temporalScale, at: date },
            { storage: "date" }
          )
        },
        datafnHeavyComputedSignalOptions
      )
    });
  }

  if (entries.length === 0) return emptyIndicatorSignal;

  return combineSignals(
    entries.map((entry) => entry.signal),
    () =>
      entries.map((entry) => ({
        resource: entry.resource,
        data: resolveIndicatorRecords(entry),
        color: entry.color
      })),
    { equals: areIndicatorDataEqual }
  );
}

/**
 * Compares calendar indicator payloads by rendered resource buckets and record
 * identity, temporal bucket fields and rendered metric fields.
 */
export function areIndicatorDataEqual(
  previous: ICalendarIndicatorData[] | undefined,
  next: ICalendarIndicatorData[]
): boolean {
  if (previous?.length !== next.length) return false;
  return previous.every((previousEntry, index) => {
    const nextEntry = next[index];
    if (
      previousEntry.resource !== nextEntry.resource ||
      previousEntry.color !== nextEntry.color ||
      previousEntry.data.length !== nextEntry.data.length
    ) {
      return false;
    }
    return previousEntry.data.every((record: any, recordIndex: number) => {
      const nextRecord: any = nextEntry.data[recordIndex];
      return (
        record.id === nextRecord?.id &&
        record.updatedAt === nextRecord?.updatedAt &&
        record.isArchived === nextRecord?.isArchived &&
        record.isAncestorInactive === nextRecord?.isAncestorInactive &&
        record.trashedAt === nextRecord?.trashedAt &&
        record.dateUnix === nextRecord?.dateUnix &&
        record.startUnix === nextRecord?.startUnix &&
        record.createdAt === nextRecord?.createdAt &&
        record.date === nextRecord?.date &&
        record.isChecked === nextRecord?.isChecked &&
        record.blocks === nextRecord?.blocks &&
        record.start === nextRecord?.start
      );
    });
  });
}

/**
 * Reads, filters and de-duplicates the records for one indicator resource bucket.
 */
function resolveIndicatorRecords(entry: IndicatorSignalEntry) {
  const seen = new Set<string>();
  return readSignalRecords(entry.signal).filter((record: any) => {
    if (!activeResourceFilter(record) || !(entry.filter?.(record) ?? true)) {
      return false;
    }
    if (!record.id) return true;
    if (seen.has(record.id)) return false;
    seen.add(record.id);
    return true;
  });
}

/**
 * Normalizes a signal value into a record array for indicator aggregation.
 */
function readSignalRecords(signal: DatafnSignal<unknown>) {
  const value = signal.get();
  return Array.isArray(value) ? value : [];
}

/**
 * Maps the calendar view scale to the temporal scale understood by DataFn.
 */
function resolveTemporalScale(scale: TimeScaleUnit): DatafnTemporalScale {
  if (scale === TimeScaleUnit.WEEK) return "week";
  if (scale === TimeScaleUnit.MONTH) return "month";
  if (scale === TimeScaleUnit.QUARTER) return "quarter";
  if (scale === TimeScaleUnit.YEAR) return "year";
  return "day";
}
