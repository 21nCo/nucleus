import type { IMarkdown } from "@nucleum/components/markdown/md.type";
import type { IRecordId } from "@21n/types/data.type";
import type {
  IActiveResource,
  IResource,
  IResourceArchivable,
  IResourceInActivableFromAncestor,
  IResourceLabeled,
  IResourcePageWithPanels,
  IResourceStarrable,
  IResourceShareable
} from "@nucleum/datafn/resource.type";
import type {
  ICollectible,
  ICollectionExpanded
} from "@nucleum/features/collections/collection.type";
import type { TimeScale } from "@21n/types/time.type";
import type { ITask } from "@nucleum/features/focus/tasks/task.type";

export enum ObjectiveType {
  INDEFINITE = "INDEFINITE",
  DEFINITE = "DEFINITE",
  /**
   * @deprecated - repeated tasks i.e. routines are now handled in todos
   */
  ROUTINE = "ROUTINE"
}
export type ObjectiveTypeValue = `${ObjectiveType}`;
export enum SubObjectivesLayout {
  DEFAULT = "DEFAULT",
  TREE = "TREE",
  STEPS = "STEPS",
  TABS = "TABS",
  BOARDS = "BOARDS"
}
export type SubObjectivesLayoutValue = `${SubObjectivesLayout}`;

export enum ObjectiveStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED"
}
export type ObjectiveStatusValue = `${ObjectiveStatus}`;

export interface IObjectiveBase extends IResourceLabeled, ICollectible {
  type?: ObjectiveTypeValue;
  description?: IMarkdown;
  startDate?: Date;
  endDate?: Date;
  spanScale?: TimeScale;
  subObjectivesLayout?: SubObjectivesLayoutValue;
  status?: ObjectiveStatusValue;
  color?: number;
  sortOrder?: number;
  isPinnedForQuickFocus?: boolean;
  /**
   * @deprecated - use uiState.tabsOrder instead
   */
  tabsOrder?: string[];
  uiState?: {
    /**
     * Order of tabs on objective page.
     */
    tabsOrder?: string[];
    isHideCompleted?: boolean;
  };
}
export interface IObjectiveCapture extends IObjectiveBase {
  id?: IRecordId;
  parentId?: IRecordId | null;
  parentPath?: string;
}

type IResourcePropertiesForObjective = IResource &
  IResourceShareable &
  IResourceStarrable &
  IResourceArchivable &
  IResourceInActivableFromAncestor;

export type IObjective = IResourcePropertiesForObjective &
  IObjectiveBase & {
    /**
     * Has index
     */
    type: ObjectiveTypeValue;
    /**
     * Has index
     */
    status: ObjectiveStatusValue;
    /**
     * Has index
     */
    parentId?: IRecordId | null;
    parentPath?: string;
    parent?: IObjectiveThumb[];
    children?: IObjectiveThumb[];
  };

export type IObjectiveThumb = IResourcePropertiesForObjective &
  IObjectiveBase & {
    type: ObjectiveTypeValue;
    status: ObjectiveStatusValue;
    parentId?: IRecordId | null;
    parentPath?: string;
    parent?: IObjectiveThumb[];
    children?: IObjectiveThumb[];
  };

export type IActiveObjective = IActiveResource &
  IResourcePageWithPanels &
  Omit<IObjective, "parent" | "children"> & {
    type: ObjectiveTypeValue;
    parent?: IObjectiveThumb[];
    children?: IObjectiveThumb[];
    isPageLoading: boolean;
    collections?: IRecordId[];
    types?: ICollectionExpanded[];
    taskCount?: number;
  };
