import { Placement } from "@21n/types/direction.enum";
import { OperatingSystem } from "@21n/types/context.type";
import { GlobalEvent, type Event as AppEvent } from "@21n/types/event.enum";
import type { IPopoverRenderParams } from "@21n/types/popover.type";
import { deepCopy } from "@21n/shared-utils/obj.utils";
import { logger } from "@nucleum/client/runtime/logging/logger";

function documentDimensions() {
  const documentWidth = window.innerWidth;
  const documentHeight = window.innerHeight;
  return {
    documentWidth,
    documentHeight
  };
}

export function renderPopover(params: IPopoverRenderParams) {
  params = {
    ...params,
    placement: params.placement ?? Placement.BottomCenter,
    offsetInPx: params.offsetInPx ?? 2,
    isSpanToTriggerWidth: params.isSpanToTriggerWidth ?? false,
    isUseAbsolutePositioning: params.isUseAbsolutePositioning ?? false,
    isPlaceAtCaret: params.isPlaceAtCaret ?? false
  };
  // console.log("renderPopover ", { params: deepCopy(params) });
  if (params.isUseAbsolutePositioning) {
    return renderPopoverUsingAbsolutePositioning({
      ...params
    });
  } else if (params.isPlaceAtCaret) {
    return _renderPopoverAtCaretPosition(params);
  } else {
    renderPopoverUsingFixedPositioning(
      params.triggerRef,
      params.popRef,
      params.placement,
      params.isSpanToTriggerWidth ?? false,
      params.offsetInPx ?? 2
    );
  }
}

/**
 * Renders a popover at the caret position
 * @param params
 * @returns
 */
function _renderPopoverAtCaretPosition(
  params: Omit<IPopoverRenderParams, "triggerRect" | "isSpanToTriggerWidth">
) {
  const selection = window.getSelection();
  if (selection?.rangeCount === 0) return;
  const range = selection?.getRangeAt(0);
  const rect = range?.getBoundingClientRect();
  if (!rect) return;
  return _renderPopoverUsingFixedPositioning(rect, {
    ...params,
    isSpanToTriggerWidth: false
  });
}

function renderPopoverUsingFixedPositioning(
  triggerRef: HTMLElement,
  popRef: HTMLElement,
  location: Placement = Placement.BottomCenter,
  isSpanToTriggerWidth = false,
  offsetInPx = 2
) {
  const triggerRect = triggerRef?.getBoundingClientRect();
  _renderPopoverUsingFixedPositioning(triggerRect, {
    triggerRef,
    popRef,
    placement: location,
    isSpanToTriggerWidth,
    offsetInPx
  });
}
/**
 * Renders a popover at the specified location and auto adjusts if the popover is going out of the screen.
 * @param params
 */
async function _renderPopoverUsingFixedPositioning(
  triggerRect: DOMRect,
  params: IPopoverRenderParams
) {
  let { popRef, placement, isSpanToTriggerWidth, offsetInPx } = params;
  if (!offsetInPx) offsetInPx = 4;
  popRef.style.display = "block";
  popRef.style.opacity = "0";
  let popRect = popRef.getBoundingClientRect();
  const { documentWidth, documentHeight } = documentDimensions();
  popRef.style.position = "fixed";
  popRef.style.zIndex = "100";

  if (triggerRect.top < popRect.height) {
    if (placement === Placement.TopLeft) placement = Placement.BottomLeft;
    else if (placement === Placement.TopRight)
      placement = Placement.BottomRight;
    else if (placement === Placement.TopCenter)
      placement = Placement.BottomCenter;
  }
  if (documentHeight - triggerRect.bottom < popRect.height) {
    if (placement === Placement.BottomCenter) placement = Placement.TopCenter;
    else if (placement === Placement.BottomLeft) placement = Placement.TopLeft;
    else if (placement === Placement.BottomRight)
      placement = Placement.TopRight;
  }
  if (
    triggerRect.top < popRect.height &&
    documentHeight - triggerRect.bottom < popRect.height
  ) {
    placement = Placement.Left;
  }
  if (!isSpanToTriggerWidth) {
    if (documentWidth - triggerRect.right < popRect.width) {
      if (placement === Placement.Right) placement = Placement.Left;
      if (placement === Placement.BottomCenter)
        placement = Placement.BottomRight;
      if (placement === Placement.TopCenter) placement = Placement.TopRight;
    }
    if (triggerRect.left < popRect.width) {
      if (placement === Placement.Left) placement = Placement.Right;
      if (placement === Placement.BottomCenter)
        placement = Placement.BottomLeft;
      if (placement === Placement.TopCenter) placement = Placement.TopLeft;
    }
  }

  if (placement === Placement.BottomLeft || placement === Placement.TopLeft) {
    popRef.style.left = `${triggerRect.left}px`;
    popRef.style.right = "";
  } else if (
    placement === Placement.BottomRight ||
    placement === Placement.TopRight
  ) {
    popRef.style.right = `${documentWidth - triggerRect.right}px`;
    popRef.style.left = "";
  }
  if (
    placement === Placement.TopLeft ||
    placement === Placement.TopRight ||
    placement === Placement.TopCenter
  ) {
    popRef.style.bottom = `${documentHeight - triggerRect.top + offsetInPx}px`;
    popRef.style.top = "";
  } else if (
    placement === Placement.BottomLeft ||
    placement === Placement.BottomRight ||
    placement === Placement.BottomCenter
  ) {
    popRef.style.top = `${triggerRect.bottom + offsetInPx}px`;
    popRef.style.bottom = "";
  }

  if (placement === Placement.Right) {
    popRef.style.left = `${triggerRect.right + offsetInPx}px`;
    popRef.style.top = `${triggerRect.top + triggerRect.height / 2 - popRect.height / 2}px`;
  } else if (placement === Placement.Left) {
    popRef.style.right = `${documentWidth - triggerRect.left + offsetInPx}px`;
    popRef.style.top = `${triggerRect.top + triggerRect.height / 2 - popRect.height / 2}px`;
  } else if (
    placement === Placement.TopCenter ||
    placement === Placement.BottomCenter
  ) {
    if (isSpanToTriggerWidth) {
      popRef.style.left = triggerRect.left + "px";
    } else {
      popRef.style.left = `${triggerRect.left + triggerRect.width / 2 - popRect.width / 2}px`;
    }
  }
  popRect = popRef.getBoundingClientRect();
  if (popRect.width > documentWidth) {
    popRef.style.width = `${documentWidth - 12}px`;
  }
  logger.log({
    triggerRect,
    popRect: deepCopy(popRect),
    placement,
    documentWidth,
    documentHeight
  });
  if (popRect.left < 0 || popRect.right > documentWidth) {
    popRef.style.left = "6px";
    popRef.style.right = "6px";
  }
  if (isSpanToTriggerWidth) popRef.style.width = `${triggerRect.width}px`;
  popRef.style.opacity = "1";
}

function renderPopoverUsingAbsolutePositioning(params: IPopoverRenderParams) {
  let { triggerRef, popRef, placement, isSpanToTriggerWidth, offsetInPx } =
    params;
  if (!popRef) return;
  if (!offsetInPx) offsetInPx = 4;
  const triggerRect = triggerRef?.getBoundingClientRect();
  popRef.style.display = "block";
  popRef.style.opacity = "0";
  popRef.style.position = "absolute";
  popRef.style.zIndex = "100";
  popRef.style.top = "";
  popRef.style.bottom = "";
  popRef.style.left = "";
  popRef.style.right = "";
  switch (placement) {
    case Placement.TopCenter:
      popRef.style.bottom = `${triggerRect.height + offsetInPx}px`;
      break;
    case Placement.BottomCenter:
      popRef.style.top = `${triggerRect.height + offsetInPx}px`;
      break;
    case Placement.Left:
      popRef.style.right = `${triggerRect.width + offsetInPx}px`;
      break;
    case Placement.Right:
      popRef.style.left = `${triggerRect.width + offsetInPx}px`;
      break;
  }
  // console.log("absolute positioning",{ triggerRect, popRect, placement });
  if (isSpanToTriggerWidth) popRef.style.width = `${triggerRect.width}px`;
  popRef.style.opacity = "1";
}

export function isTextElement(target: EventTarget | null) {
  let tagName;
  if (target instanceof Element) {
    tagName = target.tagName.toLowerCase();
  }
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    tagName === "input" ||
    tagName === "textarea" ||
    (target instanceof HTMLElement &&
      (target as HTMLElement).contentEditable === "true")
  );
}

export function hasActivePopovers(): boolean {
  const popovers = document.querySelectorAll("div.popover");
  return Array.from(popovers).some((popover) => {
    const element = popover as HTMLElement;
    return getComputedStyle(element).display !== "none";
  });
}

/**
 *
 *
 * This is the value for userAgent - when opening using SafariViewController within an iOS app:
 * UserAgent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) version/17.5 Mobile/15E148 Safari/604.1
 *
 * From MacOS app:
 * UserAgent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) version/14.1.2 Safari/605.1.15
 *
 *
 *
 * Notes on  navigator.userAgentData:
 * Supported in Chromium 90 and above
 * Not supported in Safari as of 2024-06-21
 *
 * @returns
 */
export function detectSystemOS() {
  if (typeof navigator === "undefined") {
    return OperatingSystem.UNDETERMINED;
  }

  let os: OperatingSystem;
  const userAgent = navigator.userAgent.toLowerCase();
  const platform = userAgent ?? navigator.platform.toLowerCase();
  if (platform.includes("win")) {
    os = OperatingSystem.WINDOWS;
  } else if (
    platform.includes("iphone") ||
    platform.includes("ipad") ||
    platform.includes("ios")
  ) {
    os = OperatingSystem.IOS;
  } else if (platform.includes("mac")) {
    os = OperatingSystem.MACOS;
  } else if (platform.includes("android")) {
    os = OperatingSystem.ANDROID;
  } else if (platform.includes("linux")) {
    os = OperatingSystem.LINUX;
  } else {
    os = OperatingSystem.UNDETERMINED;
  }
  return os;
}

let cachedPosition: GeolocationPosition | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 2 * 60 * 60 * 1000;
const GEOLOCATION_TIMEOUT = 3000;

export function getGeoLocation() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (typeof navigator === "undefined") {
      reject("Geolocation is not available in server environment.");
      return;
    }

    const now = Date.now();
    if (cachedPosition && now - cacheTimestamp < CACHE_DURATION) {
      resolve(cachedPosition);
      return;
    }

    if (navigator.geolocation) {
      let isSettled = false;
      const finish = (
        callback: typeof resolve | typeof reject,
        value: GeolocationPosition | GeolocationPositionError | Error
      ) => {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timeout);
        callback(value as GeolocationPosition);
      };
      const timeout = setTimeout(() => {
        finish(reject, new Error("Geolocation request timed out."));
      }, GEOLOCATION_TIMEOUT);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          cachedPosition = position;
          cacheTimestamp = now;
          finish(resolve, position);
        },
        (error) => {
          finish(reject, error);
        },
        {
          maximumAge: CACHE_DURATION,
          timeout: GEOLOCATION_TIMEOUT
        }
      );
    } else {
      reject("Geolocation is not supported by this browser.");
    }
  });
}

export function detectTouchDevice() {
  if (typeof window !== "undefined")
    return window.matchMedia("(hover: none)").matches;
  return false;
}

export function resolveHoverState(event: MouseEvent | FocusEvent) {
  const isTouchDevice = detectTouchDevice();
  return (
    !isTouchDevice && (event.type === "mouseover" || event.type === "focus")
  );
}

/**
 * A sveltekit goto() equivalent
 *
 * Note: using this instead of sveltekit's goto() because extension projects do not have access to sveltekit's goto() function
 * @param path
 * @param isReload
 * @param replaceState - if true, replaces current history entry instead of adding new one
 */
export function goto(path: string, isReload: boolean = false, replaceState: boolean = false) {
  dispatchCustomEvent(GlobalEvent.CUSTOM_NAVIGATION, { path, isReload, replaceState });
}

export function dispatchCustomEvent(event: AppEvent, data: any = {}) {
  window.dispatchEvent(new CustomEvent(event, { detail: data }));
}

/**
 * TODO - test the reliability of this function
 * @returns true if the current environment is an extension environment
 */
export function isExtensionEnvironment() {
  // console.log({
  //   protocol: window.location.protocol,
  //   typeofchrome: typeof chrome,
  //   typeofbrowser: typeof (window as any).browser,
  //   typeofplasmo: typeof (window as any).__plasmo
  // });

  if (typeof chrome !== "undefined" && chrome?.runtime?.id) {
    // console.log("chrome", chrome.runtime.id);
    return true;
  }

  if (
    typeof window !== "undefined" &&
    typeof (window as any)?.browser !== "undefined" &&
    (window as any).browser.runtime?.id
  ) {
    return true;
  }

  if (
    typeof window !== "undefined" &&
    typeof (window as any)?.__plasmo !== "undefined"
  ) {
    return true;
  }

  if (
    typeof window !== "undefined" &&
    (window.location.protocol === "chrome-extension:" ||
      window.location.protocol === "moz-extension:")
  ) {
    return true;
  }

  return false;
}

export function getEnvVal(
  key: string,
  dataType: "string" | "number" = "string"
) {
  try {
    const isExtension = isExtensionEnvironment();
    if (isExtension) {
      key = "PLASMO_PUBLIC_" + key;
      if (dataType === "string")
        return typeof process !== "undefined" ? process?.env?.[key] : undefined;
      else if (
        dataType === "number" &&
        typeof process !== "undefined" &&
        process?.env?.[key]
      )
        return Number(process.env[key]);
      else return null;
    }
    key = "VITE_" + key;
    if (dataType === "string") return import.meta.env[key];
    else if (dataType === "number" && import.meta.env[key])
      return Number(import.meta.env[key]);
    else return null;
  } catch (e) {
    logger.error({ at: "getEnvVal", error: e, key });
    return null;
  }
}

export function resolveDialogOnFront() {
  const dialogs = Array.from(document.querySelectorAll("dialog[open]"));
  if (dialogs.length === 0) {
    return null;
  }
  return dialogs[dialogs.length - 1];
}
export function resolveModalOnFront() {
  const modals = Array.from(document.querySelectorAll("[data-blank-modal]"));
  if (modals.length === 0) {
    return null;
  }
  return modals[modals.length - 1];
}

export async function generateFingerprint() {
  try {
    if (typeof navigator === "undefined" || typeof window === "undefined") {
      return "server";
    }

    if (isExtensionEnvironment()) {
      return "extension";
    }
    const legacyWindow = window as Window & {
      openDatabase?: unknown;
    };
    const components = [
      navigator.userAgent,
      navigator.language,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency,
      (navigator as any).deviceMemory,
      screen.colorDepth,
      screen.pixelDepth,
      screen.width + "x" + screen.height,
      window.devicePixelRatio,
      !!window.sessionStorage,
      !!window.localStorage,
      !!window.indexedDB,
      !!legacyWindow.openDatabase,
      (navigator as any).cpuClass,
      navigator.platform,
      navigator.plugins.length,
      navigator.mimeTypes.length,
      !!(navigator as any).bluetooth
    ];

    if (window.CanvasRenderingContext2D) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.textBaseline = "top";
        ctx.font = "14px Arial";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("Hello, world!", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("Hello, world!", 4, 17);
        components.push(canvas.toDataURL());
      }
    }

    if (window.AudioContext) {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      const analyser = audioContext.createAnalyser();
      oscillator.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      components.push(dataArray.join(","));
      await audioContext.close();
    }

    const fingerprint = components.join("###");
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return hashHex;
  } catch (e) {
    logger.error({ at: "generateFingerprint", error: e });
  }
}

export function getEventPath(event: Event): EventTarget[] {
  let path: EventTarget[] = [];
  const target = event.target;
  if (target) {
    path.push(target);
  }
  let currentTarget = target instanceof Node ? target.parentNode : null;
  while (currentTarget) {
    path.push(currentTarget);
    currentTarget = currentTarget.parentNode;
  }
  if (path.indexOf(document) === -1) {
    path.push(document);
  }
  if (path.indexOf(window) === -1) {
    path.push(window);
  }
  return path;
}

export async function getDeviceInfo() {
  try {
    const deviceInfo = {
      make: "",
      model: "",
      platform: ""
    };
    if ("userAgentData" in navigator) {
      try {
        const uaData = await (
          navigator as any
        ).userAgentData.getHighEntropyValues([
          "platform",
          "platformVersion",
          "model",
          "mobile"
        ]);

        deviceInfo.platform = uaData.platform;
        deviceInfo.model = uaData.model;
      } catch (e) {
        console.warn("Unable to get detailed device info from Client Hints");
      }
    }
    if (deviceInfo.model === "") {
      const ua = navigator.userAgent;

      if (ua.match(/iPhone/i)) {
        deviceInfo.make = "Apple";
        deviceInfo.model = "iPhone";
      } else if (ua.match(/iPad/i)) {
        deviceInfo.make = "Apple";
        deviceInfo.model = "iPad";
      } else if (ua.match(/Android/i)) {
        deviceInfo.platform = "Android";
        const match = ua.match(/\((.+?)\)/);
        if (match) {
          const details = match[1].split(";");
          details.forEach((detail) => {
            if (detail.includes("Build/")) {
              const model = detail.split("Build/")[0].trim();
              deviceInfo.model = model;
            }
          });
        }
      } else if (ua.match(/Macintosh/i)) {
        deviceInfo.make = "Apple";
        deviceInfo.model = "Mac";
      } else if (ua.match(/Windows/i)) {
        deviceInfo.platform = "Windows";
      }
    }

    return deviceInfo;
  } catch (e) {
    logger.error({ at: "getDeviceInfo", error: e });
  }
}

export function isContentScript(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      window.location.protocol !== "chrome-extension:"
    );
  } catch {
    return false;
  }
}

export const safeRequestIdleCallback = (callback: IdleRequestCallback) => {
  if (typeof window.requestIdleCallback !== "undefined") {
    return window.requestIdleCallback(callback);
  } else {
    return setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => 0
      });
    }, 1);
  }
};
