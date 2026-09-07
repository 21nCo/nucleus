// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest";

import { Resource } from "@nucleum/datafn/resource.enum";
import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  table: vi.fn(),
  successToast: vi.fn()
}));

vi.mock("@nucleum/stores/app.store", () => ({
  appStore: {
    openResource: vi.fn(),
    closeResource: vi.fn(),
    runAction: vi.fn(),
    toggleFullScreen: vi.fn()
  }
}));

vi.mock("@nucleum/application/record/active-resource.store", () => ({
  copyActiveResourceContents: vi.fn(),
  updateActiveResource: vi.fn()
}));

vi.mock("@nucleum/application/record/bulkedit.store", () => ({
  bulkEditStore: {
    getState: vi.fn().mockReturnValue({ selectedIds: [] }),
    matchesContext: vi.fn().mockReturnValue(false),
    activate: vi.fn(),
    select: vi.fn()
  }
}));

vi.mock("@nucleum/application/record/record.store", () => ({
  BulkEditor: class {
    run = vi.fn();
  }
}));

vi.mock("@nucleum/application/record/resource-link.utils", () => ({
  copyResourceLinkToClipboard: vi.fn()
}));

vi.mock("@nucleum/stores/uiState/uiState.store", () => ({
  uiState: {
    getState: vi.fn().mockReturnValue([])
  }
}));

vi.mock("@21n/layout/topNav/tabs/tabs.store", () => ({
  tabs: {
    open: vi.fn(),
    remove: vi.fn()
  }
}));

vi.mock("@nucleum/stores/notification.store", () => ({
  toasts: {
    success: mocks.successToast
  }
}));

vi.mock("@nucleum/datafn/datafn.store", () => ({
  datafn: {
    table: mocks.table
  }
}));

import { ResourceActions } from "@nucleum/application/record/resource.actions";

describe("ResourceActions", () => {
  beforeEach(() => {
    mocks.mutate.mockReset();
    mocks.table.mockReset().mockReturnValue({
      mutate: mocks.mutate
    });
  });

  it("stars resources through the shared DataFn mutate path", async () => {
    const actions = new ResourceActions(
      {
        id: "collection:resource-action-star",
        createdAt: 0,
        updatedAt: 0,
        isStarred: false
      },
      { accessPoint: ResourceAccessPoint.LIBRARY }
    );

    await actions.star().callback?.();

    expect(mocks.table).toHaveBeenCalledWith(Resource.collection);
    expect(mocks.mutate).toHaveBeenCalledWith({
      operation: "merge",
      id: "collection:resource-action-star",
      record: {
        id: "collection:resource-action-star",
        isStarred: true
      },
      context: ResourceAccessPoint.LIBRARY
    });
  });

  it("archives and trashes resources through DataFn lifecycle operations", async () => {
    const onArchive = vi.fn();
    const onTrash = vi.fn();
    const actions = new ResourceActions(
      {
        id: "collection:resource-action-lifecycle",
        createdAt: 0,
        updatedAt: 0,
        isArchived: false
      },
      {
        accessPoint: ResourceAccessPoint.LIBRARY,
        lifecycle: { onArchive, onTrash }
      }
    );

    await actions.archive().callback?.();
    await actions.trash().callback?.();

    expect(mocks.mutate).toHaveBeenNthCalledWith(1, {
      operation: "archive",
      id: "collection:resource-action-lifecycle",
      context: ResourceAccessPoint.LIBRARY
    });
    expect(onArchive).toHaveBeenCalledWith([
      "collection:resource-action-lifecycle"
    ]);
    expect(mocks.mutate).toHaveBeenNthCalledWith(2, {
      operation: "trash",
      id: "collection:resource-action-lifecycle",
      context: ResourceAccessPoint.LIBRARY
    });
    expect(onTrash).toHaveBeenCalledWith([
      "collection:resource-action-lifecycle"
    ]);
  });

  it("unrelates collection membership through the resource DataFn table", async () => {
    const actions = new ResourceActions({
      id: "node:resource-action-unlink",
      createdAt: 0,
      updatedAt: 0
    });

    await actions.unlink("collection:resource-action-context").callback?.();

    expect(mocks.table).toHaveBeenCalledWith(Resource.node);
    expect(mocks.mutate).toHaveBeenCalledWith({
      operation: "unrelate",
      id: "node:resource-action-unlink",
      relations: {
        collections: ["collection:resource-action-context"]
      },
      context: "collection:resource-action-context"
    });
  });
});
