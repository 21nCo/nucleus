// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  dispatchFocusPlayerPipRequest,
  focusPlayerPipRequestEvent
} from "./focusPlayer.events";

describe("focusPlayer.events", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("dispatches a focus-player PiP request with the original source event", () => {
    const listener = vi.fn();
    const sourceEvent = new MouseEvent("click");
    window.addEventListener(focusPlayerPipRequestEvent, listener);

    dispatchFocusPlayerPipRequest(sourceEvent);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]).toMatchObject({
      detail: { sourceEvent }
    });
    window.removeEventListener(focusPlayerPipRequestEvent, listener);
  });
});
