// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Resource } from "@nucleum/datafn/resource.enum";
import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";

import { bulkEditStore } from "@nucleum/application/record/bulkedit.store";

describe("bulkEditStore", () => {
  const originalGetClientRects = HTMLElement.prototype.getClientRects;

  beforeEach(() => {
    bulkEditStore.clear();
    document.body.innerHTML = "";
    HTMLElement.prototype.getClientRects = vi.fn(function (this: HTMLElement) {
      if (this.dataset.hidden === "true") {
        return [] as unknown as DOMRectList;
      }
      return [{ width: 10, height: 10 }] as unknown as DOMRectList;
    });
  });

  afterEach(() => {
    bulkEditStore.clear();
    document.body.innerHTML = "";
    HTMLElement.prototype.getClientRects = originalGetClientRects;
    vi.restoreAllMocks();
  });

  it("selects visible thumbnail ids when a context does not provide select-all ids", () => {
    document.body.innerHTML = [
      '<div id="thumbnail-collection:one" data-id="collection:one"></div>',
      '<div id="thumbnail-collection:two" data-id="collection:two"></div>',
      '<div id="thumbnail-collection:two-copy" data-id="collection:two"></div>',
      '<div id="thumbnail-node:ignored" data-id="node:ignored"></div>'
    ].join("");

    bulkEditStore.activate({
      resource: Resource.collection,
      accessPoint: ResourceAccessPoint.LIBRARY
    });
    bulkEditStore.onSelectAll();

    expect(bulkEditStore.getState().selectedIds).toEqual([
      "collection:one",
      "collection:two"
    ]);
  });

  it("prefers handler-provided select-all ids and de-dupes them", () => {
    document.body.innerHTML =
      '<div id="thumbnail-collection:visible" data-id="collection:visible"></div>';

    bulkEditStore.activate(
      {
        resource: Resource.collection,
        accessPoint: ResourceAccessPoint.LIBRARY
      },
      {
        onSelectAll: () => [
          "collection:handler-one",
          "collection:handler-two",
          "collection:handler-one"
        ]
      }
    );
    bulkEditStore.onSelectAll();

    expect(bulkEditStore.getState().selectedIds).toEqual([
      "collection:handler-one",
      "collection:handler-two"
    ]);
  });

  it("passes the current selection to the activated action handler once", async () => {
    const actionHandler = vi.fn();

    bulkEditStore.activate(
      {
        resource: Resource.collection,
        accessPoint: ResourceAccessPoint.LIBRARY
      },
      {
        onAction: actionHandler
      }
    );
    bulkEditStore.select(["collection:one", "collection:two"]);

    await bulkEditStore.onAction("archive", { source: "test" });

    expect(actionHandler).toHaveBeenCalledTimes(1);
    expect(actionHandler).toHaveBeenCalledWith(
      ["collection:one", "collection:two"],
      "archive",
      { source: "test" }
    );
  });
});
