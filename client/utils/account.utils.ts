import { logger } from "@nucleum/components/debug/logger.client";
import { ClientStorageKey } from "@nucleum/persistence/persistence.type";
import { goto, isExtensionEnvironment } from "@21n/utils/browser.utils";
import { clientStorage } from "@nucleum/persistence/persistence.utils";
import { postDataToParent } from "@21n/utils/embed.utils";
import { LicenseType, type IUserPlan } from "@21n/types/account.type";
import {
  BillingCycle,
  PlanType
} from "@nucleum/components/subscription/userPlan.type";
import { parseAndFormatDate } from "@21n/utils/time.utils";
import { enumToString } from "@21n/shared-utils/text.utils";
import { EmbedDataMessage } from "@21n/types/embedMessage.enum";
import { parse } from "@21n/shared-utils/json.utils";

export function getBucketNameandKey(url: string) {
  const urlParts = url.split("/");
  const bucketName = urlParts[3];
  const userId = urlParts[4];
  const directory = urlParts[5];
  let fileName = urlParts[6];
  if (fileName.includes("?") || fileName.includes("%")) {
    fileName = urlParts[6].split("?")[0];
    // fileName = fileName.split("%")[0];
  }
  return `${bucketName}/${userId}/${directory}/${fileName}`;
}

export function isUrlExpired(signedUrl: string) {
  const params = new URLSearchParams(signedUrl);
  const amzDate = params.get("X-Amz-Date");
  const amzExpires = params.get("X-Amz-Expires");

  if (amzDate && amzExpires) {
    const date = new Date(
      Date.UTC(
        parseInt(amzDate.substring(0, 4)),
        parseInt(amzDate.substring(4, 6)) - 1,
        parseInt(amzDate.substring(6, 8)),
        parseInt(amzDate.substring(9, 11)),
        parseInt(amzDate.substring(11, 13)),
        parseInt(amzDate.substring(13, 15))
      )
    );

    const expiresInSeconds = parseInt(amzExpires, 10);
    const expirationDate = new Date(date.getTime() + expiresInSeconds * 1000);
    const currentDate = new Date();
    return expirationDate < currentDate;
  }
}
export async function resolveToken(): Promise<string | null> {
  let token: string | null = null;
  if (isExtensionEnvironment()) {
    return await clientStorage.get(ClientStorageKey.AUTHFN_TOKEN);
  } else if (import.meta.env?.VITE_NATIVE_EMBED === "true") {
    const authFnToken = localStorage?.getItem(ClientStorageKey.AUTHFN_TOKEN);
    if (authFnToken) return authFnToken;
  }
  return token;
}

export async function resolveLegacyToken(): Promise<string | null> {
  if (isExtensionEnvironment()) {
    return await clientStorage.get(ClientStorageKey.STOKEN);
  }
  return typeof window !== "undefined"
    ? localStorage.getItem(ClientStorageKey.STOKEN)
    : null;
}

export async function hasLegacyCloudSession(): Promise<boolean> {
  return Boolean(await resolveLegacyToken());
}

export async function resolveCurrentUserId() {
  if (isExtensionEnvironment()) {
    const userInfo = await clientStorage.get(ClientStorageKey.USER_INFO);
    if (!userInfo) {
      return null;
    }
    return parse(userInfo)?.id ?? null;
  } else {
    const userInfo =
      typeof window !== "undefined"
        ? localStorage.getItem("userInfo")
        : undefined;
    if (userInfo) return parse(userInfo)?.id ?? null;
  }
  return null;
}

export async function signout(
  params?: { isPreventDapIdClear?: boolean; isPreventRedirect?: boolean },
  ctx?: string
) {
  logger.log({ at: "signout", context: ctx, params });
  try {
    const { authClient } = await import("@nucleum/components/account/auth");
    await (await authClient()).signOut({
      allSessions: false
    });
  } catch (error) {
    logger.error({ at: "authfn signout failed", error });
  }
  postDataToParent(EmbedDataMessage.ACCOUNT, {
    isLoggedIn: false
  });
  await clearLocalStorage(params);
  if (!params?.isPreventRedirect) goto("/account/login");
  async function clearLocalStorage(params?: { isPreventDapIdClear?: boolean }) {
    const env = await clientStorage.get(ClientStorageKey.ENV);
    const appData = await clientStorage.get(ClientStorageKey.APP_DATA);
    const product = await clientStorage.get(ClientStorageKey.PRODUCT);
    const dapId = params?.isPreventDapIdClear
      ? await clientStorage.get(ClientStorageKey.DAP_ID)
      : undefined;
    await clientStorage.clearAll();
    if (env) await clientStorage.set(ClientStorageKey.ENV, env);
    if (product) await clientStorage.set(ClientStorageKey.PRODUCT, product);
    if (appData) await clientStorage.set(ClientStorageKey.APP_DATA, appData);
    if (dapId) await clientStorage.set(ClientStorageKey.DAP_ID, dapId);
  }
}

export function isTokenExpired(token: string) {
  return !token;
}
