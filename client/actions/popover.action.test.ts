import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PopoverTriggerMethod } from "@nucleum/actions/popover.type";

import { popover } from "./popover.action";

vi.mock("@nucleum/features/memory/markdown/markdown.utils", () => ({
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

  it("lets hover-only tooltips ignore pointer events and hide on trigger click", async () => {
    const trigger = document.createElement("button");
    document.body.append(trigger);

    const action = popover(trigger, {
      id: "hover-only-tooltip",
      content: "Open focus",
      triggerMethod: [PopoverTriggerMethod.HOVER]
    });

    trigger.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    const tooltip = await vi.waitFor(() => {
      const el = document.querySelector(".popover");
      expect(el).toBeTruthy();
      return el;
    });
    expect(tooltip?.classList.contains("pointer-events-none")).toBe(true);
    await Promise.resolve();
    await Promise.resolve();

    trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await vi.waitFor(() => {
      expect(document.querySelector(".popover")).toBeNull();
    });

    action.destroy();
  });

  it("keeps pointer events on click-triggered popovers", async () => {
    const trigger = document.createElement("button");
    document.body.append(trigger);

    const action = popover(trigger, {
      id: "click-popover",
      content: "menu",
      triggerMethod: [PopoverTriggerMethod.CLICK]
    });

    trigger.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await vi.waitFor(() => {
      expect(document.querySelector(".popover")).toBeTruthy();
    });
    expect(
      document.querySelector(".popover")?.classList.contains("pointer-events-none")
    ).toBe(false);

    action.destroy();
  });
});
