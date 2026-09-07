import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccessMode, ResourceAccessPoint } from "@nucleum/datafn/resource.type";
import { Resource } from "@nucleum/datafn/resource.enum";
import { AppSearchParam } from "@nucleum/stores/appStore.type";
import type { BulkEditStore } from "./bulkedit.store";
import {
  configureResourceActionHost,
  type ResourceActionHost
} from "./resource-action-host";

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  success: vi.fn(),
  error: vi.fn()
}));
vi.mock("@nucleum/datafn/datafn.store", () => ({
  datafn: { table: () => ({ mutate: mocks.mutate }) }
}));
vi.mock("@nucleum/stores/notification.store", () => ({ toasts: mocks }));
vi.mock("@nucleum/stores/resources/active-resource.store", () => ({
  copyActiveResourceContents: vi.fn(),
  updateActiveResource: vi.fn()
}));
vi.mock("@nucleum/stores/resources/bulkedit.store", () => ({
  bulkEditStore: {}
}));
vi.mock("@nucleum/stores/uiState/uiState.store", () => ({
  uiState: { getState: () => [] }
}));
import { ResourceActions } from "./resource.actions";
import { BulkEditor } from "./bulk-editor";

const ids = ["node:host-test"];
let host: ResourceActionHost;
let selection: BulkEditStore;

describe("resource action host contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mutate.mockResolvedValue({ ok: true });
    host = {
      copyLink: vi.fn(),
      open: vi.fn(),
      close: vi.fn(),
      maximize: vi.fn(),
      openTab: vi.fn(),
      removeTab: vi.fn(),
      requestLink: vi.fn(),
      afterNodeMutation: vi.fn().mockResolvedValue(undefined)
    };
    configureResourceActionHost(host);
    selection = {
      getState: () => ({
        selectedIds: ids,
        context: { accessPoint: ResourceAccessPoint.LIBRARY }
      }),
      reset: vi.fn()
    } as unknown as BulkEditStore;
  });

  it.each([
    [ResourceAccessPoint.BROWSER, AccessMode.INLINE],
    [ResourceAccessPoint.LIBRARY, AccessMode.POP]
  ])("preserves edit navigation from %s", async (point, mode) => {
    const actions = new ResourceActions({
      id: ids[0],
      createdAt: 0,
      updatedAt: 0
    });
    await actions.edit(point as ResourceAccessPoint).callback?.();
    expect(host.open).toHaveBeenCalledWith(ids[0], mode, {
      searchParams: { [AppSearchParam.EDIT]: true }
    });
  });

  it("preserves link and collection dialog payloads", async () => {
    const actions = new ResourceActions({
      id: ids[0],
      createdAt: 0,
      updatedAt: 0
    });
    await actions.link().callback?.();
    await actions.addToCollection().callback?.();
    expect(host.requestLink).toHaveBeenNthCalledWith(1, { items: ids });
    expect(host.requestLink).toHaveBeenNthCalledWith(2, {
      label: "Add to collection",
      resource: Resource.collection,
      items: ids
    });
  });

  it.each([
    ["archive", "archive"],
    ["unarchive", "unarchive"],
    ["delete", "trash"]
  ])(
    "awaits %s mutation and lifecycle before clearing selection",
    async (action, lifecycle) => {
      let finishMutation!: (value: unknown) => void;
      let finishLifecycle!: () => void;
      mocks.mutate.mockReturnValue(
        new Promise((resolve) => {
          finishMutation = resolve;
        })
      );
      vi.mocked(host.afterNodeMutation).mockReturnValue(
        new Promise<void>((resolve) => {
          finishLifecycle = resolve;
        })
      );
      const pending = new BulkEditor(Resource.node, selection).run(action);
      expect(host.afterNodeMutation).not.toHaveBeenCalled();
      expect(selection.reset).not.toHaveBeenCalled();
      finishMutation({ ok: true });
      await vi.waitFor(() =>
        expect(host.afterNodeMutation).toHaveBeenCalledWith(lifecycle, ids)
      );
      expect(selection.reset).not.toHaveBeenCalled();
      finishLifecycle();
      expect(await pending).toBe(true);
      expect(selection.reset).toHaveBeenCalledOnce();
      expect(mocks.mutate).toHaveBeenCalledWith([
        expect.objectContaining({
          id: ids[0],
          context: ResourceAccessPoint.LIBRARY
        })
      ]);
    }
  );

  it("keeps selection and skips lifecycle when mutation fails", async () => {
    mocks.mutate.mockResolvedValue({ ok: false });
    expect(await new BulkEditor(Resource.node, selection).run("archive")).toBe(
      false
    );
    expect(host.afterNodeMutation).not.toHaveBeenCalled();
    expect(selection.reset).not.toHaveBeenCalled();
    expect(mocks.error).toHaveBeenCalledWith("Failed to perform bulk action");
  });

  it("retains selection for the bulk link dialog", async () => {
    await new BulkEditor(Resource.node, selection).run("collect");
    expect(host.requestLink).toHaveBeenCalledWith({
      label: "Add to collection",
      resource: Resource.collection,
      multiSelectStore: selection
    });
    expect(selection.reset).not.toHaveBeenCalled();
    expect(mocks.mutate).not.toHaveBeenCalled();
  });
});
