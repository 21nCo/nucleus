import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Placement } from "@21n/types/direction.enum";

import {
  detectSystemOS,
  detectTouchDevice,
  dispatchCustomEvent,
  generateFingerprint,
  getDeviceInfo,
  getEnvVal,
  getEventPath,
  getGeoLocation,
  goto,
  hasActivePopovers,
  isContentScript,
  isExtensionEnvironment,
  isTextElement,
  renderPopover,
  resolveDialogOnFront,
  resolveHoverState,
  resolveModalOnFront,
  safeRequestIdleCallback
} from "./browser.utils";

const originalCanvasGetContext = HTMLCanvasElement.prototype.getContext;
const originalCanvasToDataURL = HTMLCanvasElement.prototype.toDataURL;

const mockedModules = vi.hoisted(() => ({
  logger: {
    log: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock("@nucleum/components/debug/logger.client", () => mockedModules);
vi.mock("@21n/shared-utils/obj.utils", () => ({
  deepCopy: (value: any) => value
}));

describe("client/utils/browser.utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "innerWidth", { value: 800, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 600, configurable: true });
    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      configurable: true
    });
    Object.defineProperty(navigator, "language", { value: "en-US", configurable: true });
    Object.defineProperty(navigator, "languages", { value: ["en-US"], configurable: true });
    Object.defineProperty(navigator, "hardwareConcurrency", { value: 8, configurable: true });
    Object.defineProperty(navigator, "deviceMemory", { value: 8, configurable: true });
    Object.defineProperty(navigator, "platform", { value: "MacIntel", configurable: true });
    Object.defineProperty(navigator, "plugins", { value: { length: 1 }, configurable: true });
    Object.defineProperty(navigator, "mimeTypes", { value: { length: 1 }, configurable: true });
    Object.defineProperty(navigator, "bluetooth", { value: {}, configurable: true });
    Object.defineProperty(navigator, "userAgentData", {
      value: {
        getHighEntropyValues: vi.fn(async () => ({ platform: "macOS", model: "" }))
      },
      configurable: true
    });
    (globalThis as any).screen = {
      colorDepth: 24,
      pixelDepth: 24,
      width: 1920,
      height: 1080
    };
    (globalThis as any).sessionStorage = {};
    (globalThis as any).localStorage = {};
    (globalThis as any).indexedDB = {};
    (globalThis as any).openDatabase = vi.fn();
  });

  afterEach(() => {
    delete (globalThis as any).chrome;
    delete (globalThis as any).browser;
    delete (globalThis as any).__plasmo;
    if (originalCanvasGetContext) {
      HTMLCanvasElement.prototype.getContext = originalCanvasGetContext;
    } else {
      delete (HTMLCanvasElement.prototype as any).getContext;
    }
    if (originalCanvasToDataURL) {
      HTMLCanvasElement.prototype.toDataURL = originalCanvasToDataURL;
    } else {
      delete (HTMLCanvasElement.prototype as any).toDataURL;
    }
  });

  it("renders popover relative to trigger", () => {
    const trigger = document.createElement("div");
    trigger.getBoundingClientRect = vi.fn(() => ({
      top: 10,
      left: 20,
      bottom: 30,
      right: 120,
      width: 100,
      height: 20
    } as DOMRect));
    const popover = document.createElement("div");
    popover.getBoundingClientRect = vi.fn(() => ({
      width: 80,
      height: 40
    } as DOMRect));
    document.body.appendChild(trigger);
    document.body.appendChild(popover);

    renderPopover({
      triggerRef: trigger,
      popRef: popover,
      placement: Placement.BottomCenter
    } as any);

    expect(popover.style.top).toBe("32px");
    expect(popover.style.left).toBe("20px");
  });

  it("identifies text elements", () => {
    const input = document.createElement("input");
    expect(isTextElement(input)).toBe(true);
    expect(isTextElement(document.createElement("div"))).toBe(false);
  });

  it("checks for active popovers", () => {
    const popover = document.createElement("div");
    popover.className = "popover";
    popover.style.display = "block";
    document.body.appendChild(popover);
    expect(hasActivePopovers()).toBe(true);
  });

  it("detects operating systems", () => {
    expect(detectSystemOS()).toContain("MAC");
  });

  it("rejects geolocation when the browser callback does not settle", async () => {
    vi.useFakeTimers();
    const getCurrentPosition = vi.fn();
    Object.defineProperty(navigator, "geolocation", {
      value: { getCurrentPosition },
      configurable: true
    });

    const result = expect(getGeoLocation()).rejects.toThrow(
      "Geolocation request timed out."
    );
    await vi.advanceTimersByTimeAsync(3000);
    await result;
    vi.useRealTimers();
  });

  it("resolves geolocation with caching", async () => {
    const getCurrentPosition = vi.fn((success: any) => success({ coords: { latitude: 0, longitude: 0 } }));
    Object.defineProperty(navigator, "geolocation", {
      value: { getCurrentPosition },
      configurable: true
    });

    const first = await getGeoLocation();
    const second = await getGeoLocation();
    expect(first).toEqual(second);
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });

  it("detects touch devices via media query", () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: true });
    Object.defineProperty(window, "matchMedia", { value: matchMedia, configurable: true });
    expect(detectTouchDevice()).toBe(true);
  });

  it("resolves hover state based on device type", () => {
    const matchMedia = vi.fn().mockReturnValue({ matches: false });
    Object.defineProperty(window, "matchMedia", { value: matchMedia, configurable: true });
    expect(resolveHoverState(new MouseEvent("mouseover"))).toBe(true);
  });

  it("dispatches custom navigation events", () => {
    const spy = vi.spyOn(window, "dispatchEvent");
    goto("/home");
    expect(spy).toHaveBeenCalled();
  });

  it("dispatches custom events", () => {
    const spy = vi.spyOn(window, "dispatchEvent");
    dispatchCustomEvent("custom" as any, { a: 1 });
    expect(spy).toHaveBeenCalled();
  });

  it("detects extension environments", () => {
    (globalThis as any).chrome = { runtime: { id: "abc" } };
    expect(isExtensionEnvironment()).toBe(true);
    delete (globalThis as any).chrome;
    (globalThis as any).__plasmo = {};
    expect(isExtensionEnvironment()).toBe(true);
  });

  it("retrieves environment variables", () => {
    Object.assign(import.meta.env, { VITE_SAMPLE: "value" });
    expect(getEnvVal("SAMPLE")).toBe("value");
    (globalThis as any).chrome = { runtime: { id: "abc" } };
    Object.assign(process.env, { PLASMO_PUBLIC_SAMPLE: "ext" });
    expect(getEnvVal("SAMPLE")).toBe("ext");
  });

  it("resolves dialogs and modals", () => {
    const dialog = document.createElement("dialog");
    dialog.setAttribute("open", "true");
    document.body.appendChild(dialog);
    expect(resolveDialogOnFront()).toBe(dialog);

    const modal = document.createElement("div");
    modal.dataset.blankModal = "1";
    document.body.appendChild(modal);
    expect(resolveModalOnFront()).toBe(modal);
  });

  it("generates device fingerprints", async () => {
    class MockCanvasContext {
      textBaseline = "";
      font = "";
      fillStyle = "";
      fillRect() {}
      fillText() {}
    }
    (globalThis as any).CanvasRenderingContext2D = MockCanvasContext;
    HTMLCanvasElement.prototype.getContext = vi.fn(() => new MockCanvasContext());
    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => "data:image/png;base64,AAAA");

    class MockAudioContext {
      createOscillator() {
        return {
          type: "",
          frequency: { setValueAtTime: vi.fn() },
          connect: vi.fn()
        };
      }
      createAnalyser() {
        return {
          frequencyBinCount: 1,
          getByteFrequencyData: vi.fn((arr: Uint8Array) => arr.set([1]))
        };
      }
      async close() {}
      get currentTime() {
        return 0;
      }
    }
    (globalThis as any).AudioContext = MockAudioContext;

    const fingerprint = await generateFingerprint();
    expect(typeof fingerprint).toBe("string");
    expect(fingerprint.length).toBeGreaterThan(0);
  });

  it("computes event path", () => {
    const parent = document.createElement("div");
    const child = document.createElement("span");
    parent.appendChild(child);
    document.body.appendChild(parent);
    const event = new Event("click", { bubbles: true });
    child.dispatchEvent(event);
    const path = getEventPath({ target: child } as any);
    expect(path[0]).toBe(child);
  });

  it("retrieves device info", async () => {
    const info = await getDeviceInfo();
    expect(info).toHaveProperty("platform");
  });

  it("detects content script context", () => {
    Object.defineProperty(window, "location", {
      value: { protocol: "https:" },
      configurable: true
    });
    expect(isContentScript()).toBe(true);
  });

  it("schedules idle callbacks", () => {
    const spy = vi.fn();
    const id = safeRequestIdleCallback(spy);
    expect(id).toBeDefined();
  });
});
