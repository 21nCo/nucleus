import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EmbedDataMessage, EmbedMessage } from "@nucleum/client/runtime/embed/embedMessage.enum";

import {
  haptic,
  hapticFeedback,
  pingParent,
  postDataToParent,
  postMessageToParent,
  postNotificationToParent,
  postTokenToExtension,
  setEmbedBg
} from "@nucleum/client/runtime/embed/embed.utils";

const mockedModules = vi.hoisted(() => ({
  logger: {
    log: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock("@nucleum/client/runtime/logging/logger", () => mockedModules);

describe("client/utils/embed.utils", () => {
  let postSpy: ReturnType<typeof vi.fn>;
  let originalPostMessage: typeof window.postMessage;

  beforeEach(() => {
    vi.useFakeTimers();
    postSpy = vi.fn();
    originalPostMessage = window.postMessage;
    window.postMessage = postSpy as any;
    (window as any).webkit = {
      messageHandlers: {
        iOSNative: { postMessage: vi.fn() }
      }
    };
    (window as any).chrome = {
      webview: { postMessage: vi.fn() }
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    window.postMessage = originalPostMessage;
    delete (window as any).webkit;
    delete (window as any).chrome;
    vi.clearAllMocks();
  });

  it("pings parent once by default", () => {
    const spy = vi.spyOn(window.parent, "postMessage");
    pingParent();
    expect(spy).toHaveBeenCalledWith({ message: EmbedMessage.PING }, window.location.origin);
  });

  it("pings parent repeatedly when extended", () => {
    const spy = vi.spyOn(window.parent, "postMessage");
    pingParent(true);
    vi.advanceTimersByTime(11000);
    expect(spy).toHaveBeenCalledTimes(11);
  });

  it("posts simple messages to parent", () => {
    const spy = vi.spyOn(window.parent, "postMessage");
    postMessageToParent(EmbedMessage.ACTIVATE);
    expect(spy).toHaveBeenCalledWith({ message: EmbedMessage.ACTIVATE }, window.location.origin);
  });

  it("serialises data payloads for parent", () => {
    const spy = vi.spyOn(window.parent, "postMessage");
    postDataToParent(EmbedDataMessage.USER, { foo: "bar" });
    expect(spy).toHaveBeenCalledWith(
      { [EmbedDataMessage.USER]: expect.stringContaining("foo") },
      window.location.origin
    );
  });

  it("sets embed background via data message", () => {
    const spy = vi.spyOn(window.parent, "postMessage");
    setEmbedBg(42);
    expect(spy).toHaveBeenCalledWith(
      { [EmbedDataMessage.BG]: 42 },
      window.location.origin
    );
  });

  it("triggers haptic defaults", () => {
    const spy = vi.spyOn(window.parent, "postMessage");
    haptic();
    expect(spy).toHaveBeenCalledWith({ haptic: "default" }, window.location.origin);
  });

  it("triggers direct haptic feedback", () => {
    const spy = vi.spyOn(window.parent, "postMessage");
    hapticFeedback("light");
    expect(spy).toHaveBeenCalledWith({ haptic: "light" }, window.location.origin);
  });

  it("notifies parent with structured payload", () => {
    const spy = vi.spyOn(window.parent, "postMessage");
    postNotificationToParent({ message: "Hello", sound: "ping" });
    expect(mockedModules.logger.log).toHaveBeenCalledWith(
      expect.objectContaining({ context: "postNotificationToParent" })
    );
    expect(spy).toHaveBeenCalledWith(
      { notification: { message: "Hello", sound: "ping" } },
      window.location.origin
    );
  });

  it("posts tokens to extension channel", () => {
    postTokenToExtension({ token: "abc" });
    expect(postSpy).toHaveBeenCalledWith(
      { type: "signin", token: { token: "abc" } },
      window.location.origin
    );
  });
});
