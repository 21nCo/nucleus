import type { ISessionInterval } from "@nucleum/features/focus/session.type";
import type { IRecordId } from "@nucleum/schema/legacy/data.type";
import type { IMarkdown } from "@nucleum/features/memory/markdown/md.type";
import type { TimeScale } from "@21n/utils/time.type";
import type {
  IResource,
  IResourceShareable
} from "@nucleum/datafn/resource.type";
import type { IObjective } from "@nucleum/features/focus/goals/goal.type";
import type { ITask } from "@nucleum/features/focus/tasks/task.type";
import type { SessionRelatedItem } from "@nucleum/features/focus/logs/session-items.utils";

export enum SessionType {
  PREDEFINED_INTERVALS = "PREDEFINED_INTERVALS",
  COUNTDOWN = "COUNTDOWN",
  COUNTUP = "COUNTUP",
  MANUAL_ENTRY = "MANUAL_ENTRY"
}
export type SessionTypeValue = `${SessionType}`;

export type ISessionBase = {
  type: SessionTypeValue;
  //TODO - check the need for below
  // logs: FocusLog[];
  blocks: ISessionInterval[];
  elapsed: number;
  extended: number;
  /**
   * @deprecated - older UTC version datetime - use {@link startUnix} instead
   */
  start?: number | string | null;
  /**
   * @deprecated - older UTC version datetime - use {@link endUnix} instead
   */
  end?: number | string | null;
  /**
   * The unix timestamp of the start datetime
   */
  startUnix: number;
  /**
   * The unix timestamp of the end datetime
   */
  endUnix: number;
  /**
   * @deprecated - use {@link plannedEndUnix} instead
   */
  plannedEnd?: number | string | null;
  /**
   * The unix timestamp of the planned end datetime
   */
  plannedEndUnix?: number;
  id: string;
  items?: SessionRelatedItem[];
  manualEntryId?: string | null;
  notes?: IMarkdown;
};

export type ISessionCapture = Omit<ISessionBase, "items">;

type IResourcePropertiesForSession = IResource & IResourceShareable;
export type ISession = ISessionBase & IResourcePropertiesForSession;

export type ISessionLogBase = {
  /**
   * @deprecated - older UTC version datetime - use {@link startUnix} instead
   */
  start?: string | null;
  /**
   * The unix timestamp of the start date
   */
  startUnix: number;
  /**
   * @deprecated - older UTC version datetime - use {@link endUnix} instead
   */
  end?: string | null;
  /**
   * The unix timestamp of the end date
   */
  endUnix?: number;
  sessionId?: IRecordId;
  /**
   * @deprecated
   */
  taskName?: string;
  focus?: number;
  breakTime?: number;
  objectiveId?: IRecordId | null;
  taskId?: IRecordId | null;
  manualEntryId?: string | null;
  tzOffset?: number;
  targets?: { scale: TimeScale; target: number }[];
};

export type ISessionLogCapture = ISessionLogBase & {
  id: IRecordId;
};

type IResourcePropertiesForSessionLog = IResource & IResourceShareable;

export type ISessionLog = ISessionLogBase & IResourcePropertiesForSessionLog;

export type ISessionLogThumb = ISessionLog & {
  objective?: IObjective;
  session?: ISession;
  task?: ITask;
};

export interface IManualLogStore {
  manualLogs: IManualSessionLogForm[];
  manualLogError?: string;
}

export type IManualSessionLogForm = {
  id: string;
  startTime: string;
  startDate: Date;
  endTime: string;
  endDate: Date;
  objectiveId: IRecordId;
  duration: number;
  notes?: IMarkdown;
};

/**
 * @deprecated - use sessionStore instead
 */
export interface ILogsPaneStore {
  logs: ISessionThumb[];
  summary: DaySummary;
  date: Date;
}

export type ISessionThumb = ISession & {
  expandedItems?: (IObjective | ITask)[];
};

export type DaySummary = {
  focus: number;
  break: number;
};

export enum LastActionPerformed {
  START_TIME_CHANGED = "START_TIME_CHANGED",
  END_TIME_CHANGED = "END_TIME_CHANGED",
  DURATION_CHANGED = "DURATION_CHANGED"
}
