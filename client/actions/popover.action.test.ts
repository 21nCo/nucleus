import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PopoverTriggerMethod } from "@21n/types/popover.type";

import { popover } from "./popover.action";

vi.mock("@nucleum/components/markdown/markdown.utils", () => ({
  renderMdAsHtml: (value: string) => value
}));

describe("client/actions/popover.action", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="popovers"></div>';
    Object.defineProperty(window, "innerWidth", {
      value: 1280,
      configurable: true
    });
    Object.defineProperty(window, "innerHeight", {
      value: 720,
      configurable: true
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("creates a new popover from a second trigger even when another popover has the same id", async () => {
    const firstTrigger = document.createElement("button");
    const secondTrigger = document.createElement("button");
    document.body.append(firstTrigger, secondTrigger);

    const first = popover(firstTrigger, {
      id: "resourceThumbnailContextMenu",
      content: "first",
      triggerMethod: [PopoverTriggerMethod.CLICK]
    });
    const second = popover(secondTrigger, {
      id: "resourceThumbnailContextMenu",
      content: "second",
      triggerMethod: [PopoverTriggerMethod.CLICK]
    });

    firstTrigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await Promise.resolve();
    expect(document.querySelector(".popover")?.textContent).toBe("first");

    secondTrigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await Promise.resolve();
    expect(document.querySelector(".popover")?.textContent).toBe("second");

    first.destroy();
    second.destroy();
  });
});
