import { beforeEach, describe, expect, it, vi } from "vitest";
import { configureResourcePanelHost } from "./resource-panel-host";
import { PanelSwitcherMixin } from "./panelSwitcher.mixin";
import { resolvePanelParam } from "./panelParam.mixin";
import { ResourcePanelType } from "./resource-panel.type";
import { GlobalEvent } from "@nucleum/stores/notifications/event.enum";

const url = new URL("https://example.test/?-test-panel=properties");

const mocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  read: vi.fn(),
  write: vi.fn()
}));
vi.mock("@21n/utils/browser.utils", () => ({
  dispatchCustomEvent: mocks.dispatch
}));
vi.mock("@nucleum/client/runtime/logging/logger", () => ({
  logger: { error: vi.fn() }
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.read.mockReturnValue(null);
  configureResourcePanelHost({
    readPanel: mocks.read,
    writePanel: mocks.write,
    close: vi.fn(),
    goBack: vi.fn(),
    maximize: vi.fn()
  });
});

describe("resource panel transitions", () => {
  it.each([
    ["links", "content", "content", "links", false, GlobalEvent.COLLAPSE_PANEL],
    ["links", "links", "content", "content", false, GlobalEvent.COLLAPSE_PANEL],
    ["links", "links", undefined, "default", false, GlobalEvent.EXPAND_PANEL],
    ["focus", "links", "content", "none", true, GlobalEvent.EXPAND_PANEL],
    [
      undefined,
      "none",
      "content",
      "content",
      false,
      GlobalEvent.COLLAPSE_PANEL
    ],
    [undefined, "none", undefined, undefined, false, GlobalEvent.EXPAND_PANEL]
  ])(
    "preserves selection %s from %s with default %s",
    (requested, current, defaultPanel, expected, focused, event) => {
      let state = {
        id: "node:panel-test",
        panel: current,
        defaultPanel,
        isInFocusMode: false
      };
      const order: string[] = [];
      mocks.write.mockImplementation(() => order.push("navigation"));
      mocks.dispatch.mockImplementation(() => order.push("event"));
      PanelSwitcherMixin.switchPanel.call(
        {
          get: () => state,
          update: (fn) => {
            order.push("state");
            state = fn(state);
          }
        },
        requested
      );
      expect(state.panel).toBe(expected);
      expect(state.isInFocusMode).toBe(focused);
      expect(mocks.dispatch).toHaveBeenCalledWith(event, {});
      if (expected) {
        expect(mocks.write).toHaveBeenCalledWith(state.id, expected);
        expect(order).toEqual(["navigation", "state", "event"]);
      } else {
        expect(mocks.write).not.toHaveBeenCalled();
        expect(order).toEqual(["state", "event"]);
      }
    }
  );

  it("reads the panel for the exact resource identifier", () => {
    mocks.read.mockReturnValue(ResourcePanelType.PROPERTIES);
    expect(resolvePanelParam("node:panel-test", url, "node")).toBe(
      "properties"
    );
    expect(mocks.read).toHaveBeenCalledWith("node:panel-test", url);
  });

  it("preserves the missing-page/error fallback", () => {
    expect(resolvePanelParam("node:panel-test", undefined)).toBeNull();
    mocks.read.mockImplementation(() => {
      throw new Error("No page available");
    });
    expect(resolvePanelParam("node:panel-test", url)).toBeNull();
  });
});
