import type { IObjective } from "@nucleum/features/focus/goals/goal.type";
import type { ITask } from "@nucleum/features/focus/tasks/task.type";
import { Resource } from "@nucleum/datafn/resource.enum";
import {
  determineResourceType,
  isSameResource,
  resourceInList
} from "@nucleum/datafn/resource.utils";
import type { IRecordId } from "@21n/types/data.type";
import type { IFocusItem } from "@21n/types/pointron/session.type";

export type SessionItemRelationMetadata = {
  from?: string;
  to?: string;
  toResource?: string;
  parentObjectiveId?: IRecordId | string | null;
  sortOrder?: number;
  blocks?: { start: number; end: number }[];
};

export type SessionRelatedItem = (IObjective | ITask) &
  SessionItemRelationMetadata & {
    $relation_metadata?: SessionItemRelationMetadata;
  };

export type SessionItemRelationRef = {
  $ref: string;
  toResource: string;
  parentObjectiveId?: string;
  sortOrder: number;
  blocks: { start: number; end: number }[];
};

export type SessionFocusView = {
  allFocusItems: IFocusItem[];
  topLevelFocusItems: IFocusItem[];
  objectives: IObjective[];
  tasks: ITask[];
};

/**
 * Creates DataFn relation refs from the active focus item snapshot captured when a session is saved.
 */
export function createSessionItemRelationRefs(
  items: IFocusItem[]
): SessionItemRelationRef[] {
  return items.map((item, sortOrder) => {
    const itemId = item.id.toString();
    const toResource = determineResourceType(item.id).toString();
    const parentObjectiveId =
      item.parentObjectiveId ??
      items.find((candidate) => candidate.tasks?.some(resourceInList(item.id)))
        ?.id;
    return {
      $ref: itemId,
      toResource,
      ...(parentObjectiveId
        ? { parentObjectiveId: parentObjectiveId.toString() }
        : {}),
      sortOrder,
      blocks: item.blocks ?? []
    };
  });
}

/**
 * Resolves the metadata DataFn returns for a session item relation row.
 */
export function resolveSessionItemRelationMetadata(
  item: SessionRelatedItem
): SessionItemRelationMetadata {
  return item.$relation_metadata ?? item;
}

/**
 * Converts expanded DataFn session item relation rows into the focus item shape used by the existing session UI.
 */
export function resolveSessionFocusItems(
  items: SessionRelatedItem[] | undefined
): IFocusItem[] {
  return resolveSessionFocusView(items).allFocusItems;
}

/**
 * Builds the complete focus-session rendering model from expanded DataFn session item relation rows.
 */
export function resolveSessionFocusView(
  items: SessionRelatedItem[] | undefined
): SessionFocusView {
  const relatedItems = orderSessionRelatedItems(items);
  const taskItems = relatedItems.filter(
    (item) => determineResourceType(item.id) === Resource.task
  ) as ITask[];
  const objectiveItems = relatedItems.filter(
    (item) => determineResourceType(item.id) === Resource.objective
  ) as IObjective[];
  const objectiveFocusItems = objectiveItems.map((item) => {
    const metadata = resolveSessionItemRelationMetadata(item);
    const taskIds = taskItems
      .filter((task) => {
        const taskMetadata = resolveSessionItemRelationMetadata(task);
        return taskMetadata.parentObjectiveId
          ? isSameResource(taskMetadata.parentObjectiveId, item.id)
          : false;
      })
      .map((task) => task.id);
    return {
      id: item.id,
      tasks: taskIds,
      blocks: metadata.blocks ?? []
    };
  });
  const taskFocusItems = taskItems.map((item) => {
    const metadata = resolveSessionItemRelationMetadata(item);
    return {
      id: item.id,
      tasks: [],
      blocks: metadata.blocks ?? []
    };
  });
  const allFocusItems = [...objectiveFocusItems, ...taskFocusItems];
  const groupedTaskIds = new Set(
    objectiveFocusItems
      .flatMap((item) => item.tasks ?? [])
      .map((id) => id.toString())
  );
  const topLevelFocusItems = allFocusItems.filter(
    (item) => !groupedTaskIds.has(item.id.toString())
  );
  return {
    allFocusItems,
    topLevelFocusItems,
    objectives: objectiveItems,
    tasks: taskItems
  };
}

/**
 * Returns expanded objective and task records from a session relation result in stable relation order.
 */
export function resolveExpandedSessionItems(
  items: SessionRelatedItem[] | undefined
): SessionRelatedItem[] {
  return orderSessionRelatedItems(items).filter((item) => {
    const resourceType = determineResourceType(item.id);
    return (
      resourceType === Resource.objective || resourceType === Resource.task
    );
  });
}

/**
 * Returns objective and task ids from expanded session relation rows.
 */
export function resolveSessionItemIds(
  items: SessionRelatedItem[] | undefined
): string[] {
  return resolveExpandedSessionItems(items).map((item) => item.id.toString());
}

function orderSessionRelatedItems(
  items: SessionRelatedItem[] | undefined
): SessionRelatedItem[] {
  return [...(items ?? [])].sort((a, b) => {
    const aOrder = resolveSessionItemRelationMetadata(a).sortOrder ?? 0;
    const bOrder = resolveSessionItemRelationMetadata(b).sortOrder ?? 0;
    return aOrder - bOrder;
  });
}
