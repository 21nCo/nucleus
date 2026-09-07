import { describe, expect, it } from "vitest";

import { DragStatus } from "@nucleum/actions/dragstatus.enum";

import { handleDragNDrop, handleFocusItemsDND } from "./dragDrop";

const createDragContext = () => {
  const items = [
    { taskId: "1", objectiveId: "g1", order: 1 },
    { taskId: "2", objectiveId: "g1", order: 2 },
    { taskId: "3", objectiveId: "g1", order: 3 }
  ];

  return {
    items,
    dragAndDrop: {
      dragItem: items[0],
      dropItem: items[2],
      dragEnterItem: null,
      dragLeaveItem: null,
      dragStatus: DragStatus.DROPPED,
      dragId: "goalItem",
      dropId: "goalItem"
    }
  };
};

describe("client/utils/dragDrop", () => {
  it("reorders items on drop within same goal", () => {
    const { items, dragAndDrop } = createDragContext();

    const result = handleDragNDrop(dragAndDrop, items);

    expect(result).toHaveLength(3);
    expect(result?.map((item) => item.taskId)).toEqual(["2", "3", "1"]);
    expect(result?.map((item) => item.order)).toEqual([1, 2, 3]);
  });

  it("returns null when drag is incomplete", () => {
    const { items, dragAndDrop } = createDragContext();

    expect(
      handleDragNDrop({ ...dragAndDrop, dragStatus: DragStatus.STARTED }, items)
    ).toBeNull();
    expect(
      handleDragNDrop(
        {
          ...dragAndDrop,
          dropItem: { ...dragAndDrop.dropItem, objectiveId: "other" }
        },
        items
      )
    ).toBeNull();
  });

  it("normalises focus orders when dragging tasks", () => {
    const items = [
      { taskId: "1", objectiveId: "g1", order: 10 },
      { taskId: "2", objectiveId: "g1", order: 20 },
      { taskId: "3", objectiveId: "g1", order: 30 }
    ];
    const result = handleFocusItemsDND(
      {
        dragItem: items[2],
        dropItem: items[0],
        dragEnterItem: null,
        dragLeaveItem: null,
        dragStatus: DragStatus.DROPPED,
        dragId: "goalItem",
        dropId: "goalItem"
      },
      items
    );

    expect(result?.map((item) => item.taskId)).toEqual(["3", "1", "2"]);
    expect(result?.map((item) => item.order)).toEqual([10, 20, 30]);
  });
});
