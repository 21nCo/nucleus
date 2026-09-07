import { EmbedDataMessage, EmbedMessage } from "@21n/types/embedMessage.enum";
import type { HapticFeedback } from "@21n/types/haptic.enum";
import { stringify } from "@21n/shared-utils/json.utils";
import { logger } from "@nucleum/client/runtime/logging/logger";

export function pingParent(isExtended: boolean = false) {
  let elapsed = 0;
  if (!isExtended) {
    postMessageToParent(EmbedMessage.PING);
    return;
  }
  const timer = setInterval(() => {
    postMessageToParent(EmbedMessage.PING);
    elapsed++;
    if (elapsed > 10) {
      clearInterval(timer);
    }
  }, 1000);
}

export function postMessageToParent(message: EmbedMessage) {
  postToParent({
    message
  });
}

export function postDataToParent(key: EmbedDataMessage, data: any) {
  postToParent({
    [key]:
      typeof data === "object"
        ? stringify(data, { isPreventReplacer: true })
        : data
  });
}

/**
 * @deprecated - No longer required - using direct otop:pt-12 at relevant places
 * @param bg
 */
export function setEmbedBg(bg: number) {
  postDataToParent(EmbedDataMessage.BG, bg);
}

export function haptic(type?: string) {
  postToParent({
    haptic: type ?? "default"
  });
}

const TRUSTED_PARENT_ORIGINS = [
  "http://localhost:5555",
  "http://localhost:5002",
  "http://127.0.0.1:5555",
  "http://127.0.0.1:5002"
];

function getParentOrigin(): string | null {
  try {
    return window.parent.location.origin;
  } catch (error) {
    return null;
  }
}

function isParentOriginTrusted(origin: string): boolean {
  if (TRUSTED_PARENT_ORIGINS.includes(origin)) {
    return true;
  }

  try {
    const url = new URL(origin);
    return url.hostname.endsWith(".memotron.app");
  } catch {
    return false;
  }
}

function postToParent(message: any) {
  logger.log({
    at: "posting message to parent",
    messageKeys:
      message && typeof message === "object" ? Object.keys(message) : []
  });

  const parentOrigin = getParentOrigin();
  const targetOrigin =
    parentOrigin && isParentOriginTrusted(parentOrigin)
      ? parentOrigin
      : window.location.origin;

  try {
    window?.parent?.postMessage(message, targetOrigin);
  } catch (error) {
    logger.error({ at: "postToParent - parent", error });
  }
  try {
    //@ts-ignore
    window?.webkit?.messageHandlers?.iOSNative?.postMessage(message);
  } catch (error) {
    logger.error({ at: "postToParent - webkit", error });
  }
  try {
    //@ts-ignore
    window?.chrome?.webview?.postMessage(message);
  } catch (error) {
    logger.error({ at: "postToParent - webview", error });
  }
}

export function postNotificationToParent(message: {
  message: string;
  sound: string;
}) {
  logger.log({ context: "postNotificationToParent", message });
  postToParent({
    notification: message
  });
}

export function hapticFeedback(haptic: HapticFeedback) {
  postToParent({
    haptic
  });
}

export function postTokenToExtension(json: any) {
  window.postMessage(
    {
      type: "signin",
      token: json
    },
    window.location.origin
  );
}
