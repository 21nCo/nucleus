import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { embedBridge } from "./embed.store";
import { EmbedDataMessage, EmbedMessage } from "./embedMessage.enum";
import {
  postDataToParent,
  postMessageToParent,
  postTokenToExtension
} from "./embed.utils";

const native = vi.fn();
const webview = vi.fn();
const parent = vi.fn();
const currentWindow = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  embedBridge.set({});
  vi.stubGlobal("window", {
    dispatchEvent: vi.fn(),
    location: { origin: "https://local.nucleum.app" },
    parent: {
      location: { origin: "https://local.memotron.app" },
      postMessage: parent
    },
    webkit: { messageHandlers: { iOSNative: { postMessage: native } } },
    chrome: { webview: { postMessage: webview } },
    postMessage: currentWindow
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("native embed transport", () => {
  it("preserves serialization and delivery to the trusted parent and native hosts", () => {
    postDataToParent(EmbedDataMessage.DATA, {
      id: "request",
      type: EmbedMessage.RETRIEVE_JOB,
      body: { jobId: "job" }
    });
    const payload = {
      data: JSON.stringify({
        id: "request",
        type: "RETRIEVE_JOB",
        body: { jobId: "job" }
      })
    };
    expect(parent).toHaveBeenCalledWith(payload, "https://local.memotron.app");
    expect(native).toHaveBeenCalledWith(payload);
    expect(webview).toHaveBeenCalledWith(payload);
  });

  it("keeps scalar data and command message shapes", () => {
    postDataToParent(EmbedDataMessage.ROOT_FONT_SIZE, 16);
    postMessageToParent(EmbedMessage.PING);
    expect(native).toHaveBeenNthCalledWith(1, { rootFontSize: 16 });
    expect(native).toHaveBeenNthCalledWith(2, { message: "PING" });
  });

  it("falls back to the current origin for an untrusted parent", () => {
    window.parent.location.origin = "https://untrusted.example";
    postMessageToParent(EmbedMessage.PING);
    expect(parent).toHaveBeenCalledWith(
      { message: "PING" },
      "https://local.nucleum.app"
    );
  });

  it("continues native delivery when the parent cannot be inspected or posted to", () => {
    Object.defineProperty(window.parent, "location", {
      get: () => {
        throw new Error("Cross-origin");
      }
    });
    parent.mockImplementationOnce(() => {
      throw new Error("Unavailable");
    });
    postMessageToParent(EmbedMessage.PING);
    expect(native).toHaveBeenCalledWith({ message: "PING" });
    expect(webview).toHaveBeenCalledWith({ message: "PING" });
  });

  it("keeps extension sign-in on the current window and origin", () => {
    const fixture = { fixture: "synthetic" };
    postTokenToExtension(fixture);
    expect(currentWindow).toHaveBeenCalledWith(
      { type: "signin", token: fixture },
      "https://local.nucleum.app"
    );
    expect(parent).not.toHaveBeenCalled();
  });
});

describe("native request correlation", () => {
  it("returns a cached reply without resending", async () => {
    embedBridge.setData("cached", EmbedMessage.RETRIEVE_JOB, {
      status: "completed"
    });
    await expect(
      embedBridge.fetch("cached", EmbedMessage.RETRIEVE_JOB, {})
    ).resolves.toEqual({ status: "completed" });
    expect(parent).not.toHaveBeenCalled();
  });

  it("correlates concurrent responses by request id including falsy data", async () => {
    const one = embedBridge.fetch("one", EmbedMessage.RETRIEVE_JOB, {
      jobId: "a"
    });
    const two = embedBridge.fetch("two", EmbedMessage.RETRIEVE_JOB, {
      jobId: "b"
    });
    embedBridge.setData("two", EmbedMessage.RETRIEVE_JOB, 0);
    embedBridge.setData("one", EmbedMessage.RETRIEVE_JOB, {
      status: "running"
    });
    await vi.advanceTimersByTimeAsync(500);
    await expect(one).resolves.toEqual({ status: "running" });
    await expect(two).resolves.toBe(0);
    expect(parent).toHaveBeenCalledTimes(2);
  });

  it("preserves the existing polling timeout boundary", async () => {
    const request = embedBridge.fetch("timeout", EmbedMessage.RETRIEVE_JOB, {});
    const rejected = expect(request).rejects.toThrow(
      "Timeout waiting for data"
    );
    await vi.advanceTimersByTimeAsync(5500);
    await rejected;
    expect(parent).toHaveBeenCalledOnce();
  });
});
