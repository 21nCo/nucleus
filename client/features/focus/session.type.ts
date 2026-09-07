import type { SessionComposition } from "@nucleum/features/focus/sessionComposition.type";
import type { SessionState } from "@nucleum/features/focus/sessionState.enum";
import type { IMarkdown } from "@nucleum/features/memory/markdown/md.type";
import type { IRecordId } from "@nucleum/schema/legacy/data.type";
import type { SessionType } from "@nucleum/features/focus/logs/log.type";

export type IActiveSessionStore = {
  currentSessionId: IRecordId | undefined;
  type: SessionType;
  state: SessionState;
  composition: SessionComposition;
  isQuickStartOn: boolean;
  plannedDuration: number;
  start?: Date;
  end?: Date;
  timeElapsed: number;
  totalElapsed: number;
  totalExtended: number;
  totalIdle: number;
  intervals: ISessionInterval[];
  currentBlockId: string;
  /**
   * Only for persistance of currentFocusItem store
   */
  currentFocusItem?: ICurrentFocusItem;
  currentIdle: number;
  isSessionRunning: boolean;
  preventSliderReverseEventTemp?: boolean;
  widgetSnapshot?: any;
  timeRemainingToTakeBreak?: number;
  isBreakReminderNotified?: boolean;
  notes?: IMarkdown;
};

export type ICurrentFocusItem = {
  start: number;
  id: IRecordId;
};

export type FocusLog = {
  start: number;
  end?: number;
  previousWorked?: number;
  objectiveId?: string;
  taskId?: string;
  taskName?: string;
  color?: number;
  blocks?: ISessionInterval[];
  sessionId?: string;
  totalFocus?: number;
  totalBreak?: number;
  id?: string | number;
};

export enum SessionBlockType {
  FOCUS = "FOCUS",
  BREAK = "BREAK",
  IDLE = "IDLE"
}
/**
 * @deprecated - Used with older version of Pointron
 */
export type FocusTask = {
  id: string;
  label: string;
  estimate: number;
  worked: number;
  checked: boolean;
  tags?: string[];
  sessionId: string;
  order: number;
};

export type CurrentBlock = {
  duration: number;
  type: BlockType;
  start: number;
  index: number;
};

export type ISessionInterval = {
  id: string;
  type: BlockType;
  duration: number;
  start: number;
  progress: number;
  color?: string;
};

export enum BlockType {
  BREAK,
  FOCUS,
  NONE
}

export type IFocusItem = {
  id: IRecordId;
  parentObjectiveId?: IRecordId;
  blocks?: {
    start: number;
    end: number;
  }[];
  tasks?: IRecordId[];
};

/**
 * @deprecated - use {@link IFocusItem} instead
 */
export type IFocusObjective = IFocusItem & {
  tasks?: IRecordId[];
};

/**
 * @deprecated - use {@link IFocusItem} instead
 */
export type IFocusTask = IFocusItem & {};

export enum SessionUIContext {
  DEFAULT = "DEFAULT",
  ZEN_ON_DESKTOP = "ZEN_ON_DESKTOP",
  THIN_ON_DESKTOP = "THIN_ON_DESKTOP",
  FOCUS_PLAYER = "FOCUS_PLAYER",
  PIP = "PIP",
  OBJECTIVE_PAGE = "OBJECTIVE_PAGE"
}

export interface IFocusItemsStore {
  /**
   * @deprecated - use items instead
   */
  objectives?: IFocusObjective[];
  /**
   * @deprecated - use items instead
   */
  tasks?: IFocusTask[];
  items: IFocusItem[];
  removedItems?: IFocusItem[];
  recents?: {
    id: IRecordId;
    item: any;
    startUnix: number;
  }[];
}
