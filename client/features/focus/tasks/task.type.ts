import type { IRecordId } from "@nucleum/schema/legacy/data.type";
import type {
  DatafnDateValue,
  IResource,
  IResourceInActivableFromAncestor,
  IResourceLabeled
} from "@nucleum/datafn/resource.type";
import type { IObjectiveThumb } from "@nucleum/features/focus/goals/goal.type";

interface ITaskBase extends IResourceLabeled {
  isChecked?: boolean;
  /**
   * Estimated time in seconds
   */
  estimated?: number;
  /**
   * @deprecated - use {@link dateUnix} instead
   */
  date?: DatafnDateValue;
  /**
   * The unix timestamp of the date
   */
  dateUnix?: number;
  /**
   * The time in minutes since midnight
   */
  minutes?: number;
  /**
   * @deprecated - use {@link completedAtUnix} instead
   * The date the task was completed
   */
  completedAt?: DatafnDateValue;
  /**
   * The unix timestamp of the completed date
   */
  completedAtUnix?: number | null;
}

type IResourcePropertiesForTask = IResource & IResourceInActivableFromAncestor;

export type ITaskCapture = ITaskBase & {
  id?: IRecordId;
  objectiveId?: IRecordId | null;
};

export type ITask = IResourcePropertiesForTask &
  ITaskBase & {
    dateUnix: number;
    objectiveId: IRecordId | null;
  };

export interface ITaskThumb extends ITaskBase, IResourcePropertiesForTask {
  objectiveId?: IRecordId | null;
  objective?: IObjectiveThumb;
}

export enum TaskSubTypeForSwitcher {
  BY_DATE = "bydate",
  BY_MONTH = "bymonth",
  /**
   * @deprecated
   */
  OVERDUE = "overdue",
  /**
   * @deprecated
   */
  WITHOUT_DUE_DATE = "without-due-date",
  /**
   * @deprecated
   */
  WITHOUT_OBJECTIVE = "without-objective"
}

export enum TaskDueDateFilter {
  ALL = "all",
  OVERDUE = "overdue",
  WITHOUT_DUE_DATE = "without-due-date"
}
