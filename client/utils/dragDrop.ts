import type { DragAndDrop } from "@nucleum/actions/draganddrop.type";
import { DragStatus } from "@nucleum/actions/dragstatus.enum";

export function handleDragNDrop(x: DragAndDrop, items: any[]) {
  const objectiveIdCheck = x.dropItem.objectiveId === x.dragItem.objectiveId;
  const dropItemCheck = x.dropItem ? true : false;
  const dragItemCheck = x.dragItem ? true : false;

  if (
    x.dragStatus == DragStatus.DROPPED &&
    dropItemCheck &&
    dragItemCheck &&
    objectiveIdCheck
  ) {
    let draggedItem = x.dragItem;
    let targetItem = x.dropItem;
    if (
      !draggedItem ||
      !targetItem ||
      draggedItem.taskId === targetItem.taskId
    ) {
      return null;
    }
    let draggedIndex = items.indexOf(draggedItem);
    let targetIndex = items.indexOf(targetItem);

    if (draggedIndex >= 0 && targetIndex >= 0 && targetIndex < items.length) {
      items = [
        ...items.slice(0, draggedIndex),
        ...items.slice(draggedIndex + 1)
      ];
      items.splice(targetIndex, 0, draggedItem);
      items.forEach((item: any, index) => {
        item.order = index + 1;
      });
      return items;
    }
  }

  if (x.dragStatus == DragStatus.STARTED && x.dragItem) {
    //todo - remove dragged item from list
  }
  if (x.dragItem && x.dragEnterItem) {
  }
  return null;
}

export function handleFocusItemsDND(x: DragAndDrop, items: any[]) {
  const dropItemCheck = x.dropItem ? true : false;
  const dragItemCheck = x.dragItem ? true : false;
  const dropContainsTasks =
    x.dropId == "goalItem" || x.dropId == "soloTaskItem" ? true : false;
  const dragContainsTasks =
    x.dragId == "goalItem" || x.dragId == "soloTaskItem" ? true : false;
  if (
    dropItemCheck &&
    dragItemCheck &&
    dropContainsTasks &&
    dragContainsTasks
  ) {
    let draggedItem = x.dragItem;
    let targetItem = x.dropItem;
    let draggedIndex = items.indexOf(draggedItem);
    let targetIndex = items.indexOf(targetItem);
    if (draggedIndex >= 0 && targetIndex >= 0 && targetIndex < items.length) {
      items = [
        ...items.slice(0, draggedIndex),
        ...items.slice(draggedIndex + 1)
      ];
      items.splice(targetIndex, 0, draggedItem);
      let orderValues = items.map((item) => item.order);
      orderValues.sort((a, b) => a - b);
      items.forEach((item: any, index) => {
        item.order = orderValues[index];
      });
      return items;
    }
  }
  return null;
}
