import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ExtensionEvent } from "@21n/types/extension.type";

import {
  openAppPath,
  openLink,
  relayToBackgroundScript,
  relayToContentScript,
  relayToSidePanel,
  resolveAppPath
} from "./extension.utils";

const mockedModules = vi.hoisted(() => ({
  logger: {
    debug: vi.fn(),
    log: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock("@nucleum/client/runtime/logging/logger", () => mockedModules);

const sendToBackground = vi.hoisted(() => vi.fn(async () => ({ ok: true })));

vi.mock("@plasmohq/messaging", () => ({
  sendToBackground: (...args: any[]) => sendToBackground(...args)
}));

describe("client/utils/extension.utils", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (globalThis as any).chrome = {
      runtime: {
        id: "runtime-id",
        lastError: null,
        sendMessage: vi.fn()
      },
      tabs: {
        sendMessage: vi.fn((tabId, message, cb) => cb("tab-response")),
        create: vi.fn((options, cb) => cb({ id: 123, ...options }))
      },
      storage: {
        local: {
          get: vi.fn(async () => ({ tab: { id: 456 } }))
        }
      }
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    delete (globalThis as any).chrome;
  });

  it("relays messages to content scripts using stored tab id", async () => {
    const response = await relayToContentScript({
      event: "ANY" as ExtensionEvent,
      data: { foo: "bar" }
    });

    expect(chrome.storage.local.get).toHaveBeenCalledWith("tab");
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
      456,
      { event: "ANY", data: { foo: "bar" } },
      expect.any(Function)
    );
    expect(response).toBe("tab-response");
  });

  it("rejects when content script relay fails", async () => {
    chrome.tabs.sendMessage = vi.fn((tabId, message, cb) => {
      chrome.runtime.lastError = new Error("boom");
      cb(undefined);
    });

    await expect(
      relayToContentScript({ event: "X" as ExtensionEvent })
    ).rejects.toThrow("boom");
  });

  it("relays messages to side panel", async () => {
    await relayToSidePanel({ event: "SIDE" as ExtensionEvent });
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      event: "SIDE",
      data: undefined
    });
  });

  it("relays messages to background with timeout guard", async () => {
    const response = await relayToBackgroundScript({
      event: "BG" as ExtensionEvent,
      data: { foo: 1 }
    });

    expect(sendToBackground).toHaveBeenCalledWith({
      name: "BG",
      body: { foo: 1 },
      extensionId: "runtime-id"
    });
    expect(response).toEqual({ ok: true });
    vi.runAllTimers();
  });

  it("throws when background relay fails", async () => {
    sendToBackground.mockRejectedValueOnce(new Error("timeout"));

    await expect(
      relayToBackgroundScript({ event: "BG" as ExtensionEvent })
    ).rejects.toThrow("timeout");
    vi.runAllTimers();
  });

  it("opens links in new tabs", async () => {
    const tab = await openLink("https://example.com");
    expect(chrome.tabs.create).toHaveBeenCalledWith(
      { url: "https://example.com" },
      expect.any(Function)
    );
    expect(tab).toMatchObject({ id: 123 });
  });

  it("rejects when chrome tab creation fails", async () => {
    chrome.tabs.create = vi.fn((options, cb) => {
      chrome.runtime.lastError = new Error("fail");
      cb(undefined as any);
    });

    await expect(openLink("https://example.com")).rejects.toThrow("fail");
  });

  it("resolves and opens app paths", async () => {
    const resolved = resolveAppPath("dashboard");
    expect(resolved).toBe("https://web.memotron.app/dashboard");

    await openAppPath("home");
    expect(chrome.tabs.create).toHaveBeenCalledWith(
      { url: "https://web.memotron.app/home" },
      expect.any(Function)
    );
  });
});
