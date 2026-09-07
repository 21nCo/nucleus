import { CombinationNavItemType, type ICombinationNavItem } from "@nucleum/features/spaces/combination/combination.type";

function clone<T>(items: T[]): T[] {
  if (typeof structuredClone === "function") {
    return structuredClone(items ?? []);
  }
  return JSON.parse(JSON.stringify(items ?? []));
}

export function cloneNavItems(items: ICombinationNavItem[] = []) {
  return clone(items);
}

export function findItemPath(
  items: ICombinationNavItem[],
  id: string,
  currentPath: number[] = []
): number[] | null {
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    const path = [...currentPath, index];
    if (item.id === id) {
      return path;
    }
    if (item.children && item.children.length > 0) {
      const childPath = findItemPath(item.children, id, path);
      if (childPath) {
        return childPath;
      }
    }
  }
  return null;
}

export function getItemByPath(
  items: ICombinationNavItem[],
  path: number[]
): ICombinationNavItem | undefined {
  if (path.length === 0) return undefined;
  let current: ICombinationNavItem | undefined;
  let currentLevel = items;
  for (let i = 0; i < path.length; i++) {
    current = currentLevel[path[i]];
    if (!current) return undefined;
    if (i < path.length - 1) {
      current.children = current.children ?? [];
      currentLevel = current.children;
    }
  }
  return current;
}

function resolveChildrenArray(
  items: ICombinationNavItem[],
  path: number[]
): ICombinationNavItem[] {
  if (path.length === 0) {
    return items;
  }
  const parent = getItemByPath(items, path);
  if (!parent) return [];
  parent.children = parent.children ?? [];
  return parent.children;
}

function arraysEqual(first: number[], second: number[]) {
  if (first.length !== second.length) return false;
  return first.every((value, index) => value === second[index]);
}

type RemovedNavItem = {
  items: ICombinationNavItem[];
  item?: ICombinationNavItem;
  originalPath?: number[];
  parentPath?: number[];
  parentId?: string;
  index?: number;
};

export function removeNavItem(
  items: ICombinationNavItem[],
  id: string
): RemovedNavItem {
  const cloned = cloneNavItems(items);
  const path = findItemPath(cloned, id);
  if (!path) return { items: cloned };
  const parentPath = path.slice(0, -1);
  const parentItem =
    parentPath.length > 0 ? getItemByPath(cloned, parentPath) : undefined;
  const parentArray = resolveChildrenArray(cloned, parentPath);
  const index = path[path.length - 1];
  const [item] = parentArray.splice(index, 1);
  return {
    items: cloned,
    item,
    originalPath: path,
    parentPath,
    parentId: parentItem?.id,
    index
  };
}

function insertNavItemAtPath(
  items: ICombinationNavItem[],
  item: ICombinationNavItem,
  parentPath: number[],
  index?: number
) {
  const targetArray = resolveChildrenArray(items, parentPath);
  const insertIndex =
    index === undefined || index < 0 || index > targetArray.length
      ? targetArray.length
      : index;
  targetArray.splice(insertIndex, 0, item);
  return items;
}

export function moveItemToParent(
  items: ICombinationNavItem[],
  itemId: string,
  parentId: string | undefined,
  index?: number
) {
  const removal = removeNavItem(items, itemId);
  if (!removal.item) return items;
  const { items: intermediate } = removal;
  const parentPath: number[] = parentId
    ? (() => {
        const parentPath = findItemPath(intermediate, parentId);
        return parentPath ?? [];
      })()
    : [];
  if (parentId && parentPath.length === 0) return items;
  let adjustedIndex = index;
  if (
    removal.parentPath &&
    arraysEqual(removal.parentPath, parentPath) &&
    removal.index !== undefined &&
    index !== undefined &&
    removal.index < index
  ) {
    adjustedIndex = index - 1;
  }
  const updated = insertNavItemAtPath(
    intermediate,
    removal.item,
    parentPath,
    adjustedIndex
  );
  return cloneNavItems(updated);
}

export function moveItemToPosition(
  items: ICombinationNavItem[],
  itemId: string,
  targetId: string,
  position: "before" | "after" | "inside"
) {
  if (itemId === targetId) return items;
  const removal = removeNavItem(items, itemId);
  if (!removal.item) return items;
  const { items: intermediate } = removal;
  const targetPath = findItemPath(intermediate, targetId);
  if (!targetPath) return items;
  let parentPath: number[];
  let insertIndex: number | undefined;
  if (position === "inside") {
    parentPath = [...targetPath];
    insertIndex = undefined;
  } else {
    parentPath = targetPath.slice(0, -1);
    insertIndex = targetPath[targetPath.length - 1];
    if (position === "after") insertIndex += 1;
    if (
      removal.parentPath &&
      arraysEqual(removal.parentPath, parentPath) &&
      removal.index !== undefined &&
      insertIndex !== undefined &&
      removal.index < insertIndex
    ) {
      insertIndex -= 1;
    }
  }
  const updated = insertNavItemAtPath(
    intermediate,
    removal.item,
    parentPath,
    insertIndex
  );
  return cloneNavItems(updated);
}

export function updateItemLabel(
  items: ICombinationNavItem[],
  id: string,
  label: string
) {
  const cloned = cloneNavItems(items);
  const path = findItemPath(cloned, id);
  if (!path) return cloned;
  const item = getItemByPath(cloned, path);
  if (item) {
    item.label = label;
  }
  return cloned;
}

export function removeItemById(
  items: ICombinationNavItem[],
  id: string
) {
  const cloned = cloneNavItems(items);
  const path = findItemPath(cloned, id);
  if (!path) return cloned;
  const parentArray = resolveChildrenArray(cloned, path.slice(0, -1));
  const index = path[path.length - 1];
  parentArray.splice(index, 1);
  return cloned;
}

export function insertItem(
  items: ICombinationNavItem[],
  item: ICombinationNavItem,
  params: { parentId?: string; index?: number } = {}
) {
  const cloned = cloneNavItems(items);
  const { parentId, index } = params;
  if (!parentId) {
    const target = cloned;
    if (index === undefined || index < 0 || index > target.length) {
      target.push(item);
    } else {
      target.splice(index, 0, item);
    }
    return cloned;
  }
  const parentPath = findItemPath(cloned, parentId);
  if (!parentPath) return cloned;
  const parent = getItemByPath(cloned, parentPath);
  if (!parent) return cloned;
  parent.children = parent.children ?? [];
  if (index === undefined || index < 0 || index > parent.children.length) {
    parent.children.push(item);
  } else {
    parent.children.splice(index, 0, item);
  }
  return cloned;
}

export function moveItem(
  items: ICombinationNavItem[],
  id: string,
  offset: number
) {
  if (!offset) return items;
  const cloned = cloneNavItems(items);
  const path = findItemPath(cloned, id);
  if (!path) return cloned;
  const parentArray = resolveChildrenArray(cloned, path.slice(0, -1));
  const index = path[path.length - 1];
  const newIndex = index + offset;
  if (newIndex < 0 || newIndex >= parentArray.length) return cloned;
  const [item] = parentArray.splice(index, 1);
  parentArray.splice(newIndex, 0, item);
  return cloned;
}

export function indentItem(items: ICombinationNavItem[], id: string) {
  const cloned = cloneNavItems(items);
  const path = findItemPath(cloned, id);
  if (!path) return cloned;
  const parentArray = resolveChildrenArray(cloned, path.slice(0, -1));
  const index = path[path.length - 1];
  if (index <= 0) return cloned;
  const previousSibling = parentArray[index - 1];
  if (!previousSibling) return cloned;
  previousSibling.children = previousSibling.children ?? [];
  const [item] = parentArray.splice(index, 1);
  previousSibling.children.push(item);
  return cloned;
}

export function outdentItem(items: ICombinationNavItem[], id: string) {
  const cloned = cloneNavItems(items);
  const path = findItemPath(cloned, id);
  if (!path || path.length < 2) return cloned;
  const parentPath = path.slice(0, -1);
  const grandParentPath = parentPath.slice(0, -1);
  const currentArray = resolveChildrenArray(cloned, parentPath);
  const index = path[path.length - 1];
  const [item] = currentArray.splice(index, 1);
  const parentIndex = parentPath[parentPath.length - 1];
  const grandParentArray = resolveChildrenArray(cloned, grandParentPath);
  grandParentArray.splice(parentIndex + 1, 0, item);
  return cloned;
}

export function flattenNavItems(
  items: ICombinationNavItem[] = []
): ICombinationNavItem[] {
  const result: ICombinationNavItem[] = [];
  for (const item of items ?? []) {
    result.push(item);
    if (item.children && item.children.length > 0) {
      result.push(...flattenNavItems(item.children));
    }
  }
  return result;
}

export function countNavItems(items: ICombinationNavItem[] = []) {
  const flattened = flattenNavItems(items);
  let sectionCount = 0;
  let resourceCount = 0;
  for (const item of flattened) {
    if (item.type === CombinationNavItemType.SECTION) sectionCount += 1;
    else if (item.type === CombinationNavItemType.RESOURCE) resourceCount += 1;
  }
  return { sections: sectionCount, resources: resourceCount };
}
