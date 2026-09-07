import {
  createAuthFnRegionalClient,
  type AuthFnCachedRegion,
  type AuthFnClientRequestMetric,
  type AuthFnRegionalClient,
  type AuthFnRegionStorage,
  type AuthFnTransportAuthOptions
} from "@authfn/client";
import type { HttpTransportAuthProvider } from "@superfunctions/http";
import { clientStorage } from "@nucleum/persistence/persistence.utils";
import { ClientStorageKey } from "@nucleum/persistence/persistence.type";
import {
  resolveAccountBaseUrl,
  resolveAccountCookiePrefix
} from "@nucleum/client/runtime/account/network";
import { logger } from "@nucleum/client/runtime/logging/logger";
import { isExtensionEnvironment } from "@21n/utils/browser.utils";
import { determineIfOffline } from "@nucleum/client/runtime/connectivity";
import type {
  AuthSessionResolution,
  StoredAuthSessionState
} from "@21n/types/auth.type";

type StoredRegionValue = string | AuthFnCachedRegion;

const authClientsMap: Map<string, AuthFnRegionalClient> = new Map();
const REGION_CACHE_TTL_MS = 15 * 60 * 1000;

export const authClient = async (params?: {
  region?: string;
  isPreventCachedInstance?: boolean;
}): Promise<AuthFnRegionalClient> => {
  const region =
    params?.region ??
    (await clientStorage.get(ClientStorageKey.REGION)) ??
    "insouth";
  const cacheKey = "regional";
  if (authClientsMap.has(cacheKey) && !params?.isPreventCachedInstance) {
    const existing = authClientsMap.get(cacheKey) as AuthFnRegionalClient;
    existing.setCurrentRegionId(region);
    return existing;
  }

  const client = createAuthFnRegionalClient({
    defaultRegionId: region,
    resolveBaseUrl: resolveAuthFnBaseUrl,
    storage: createNucleusRegionStorage(),
    cacheTtlMs: REGION_CACHE_TTL_MS,
    clientOptions: {
      cookiePrefix: resolveAccountCookiePrefix(region),
      credentials: "include",
      bearerToken: shouldUseAuthFnBearerSession()
        ? async () =>
            (await clientStorage.get(ClientStorageKey.AUTHFN_TOKEN)) ??
            undefined
        : undefined,
      onRequestMetric: emitAccountNetworkMetric
    },
    onRegionChanged: async (event) => {
      await clientStorage.set(ClientStorageKey.REGION, event.toRegionId);
    }
  });
  client.setCurrentRegionId(region);
  authClientsMap.set(cacheKey, client);
  return client;
};

export function resolveAuthFnBaseUrl(region: string) {
  return `${resolveAccountBaseUrl(region).replace(/\/$/, "")}/auth`;
}

export function shouldUseAuthFnBearerSession(): boolean {
  if (typeof window === "undefined") return false;
  return (
    import.meta.env?.VITE_NATIVE_EMBED === "true" || isExtensionEnvironment()
  );
}

export function resolveAuthFnSessionMode(): "cookie" | "hybrid" {
  return shouldUseAuthFnBearerSession() ? "hybrid" : "cookie";
}

export async function createNucleumAuthFnTransportAuth(
  input: AuthFnTransportAuthOptions = {}
): Promise<HttpTransportAuthProvider> {
  return (await authClient()).createTransportAuth(input);
}

export async function bootstrapNucleusAccount(region: string) {
  if (!shouldUseAuthFnBearerSession()) {
    return { kind: "not-authfn" as const };
  }
  const token = await clientStorage.get(ClientStorageKey.AUTHFN_TOKEN);
  if (!token) {
    return { kind: "not-authfn" as const };
  }

  try {
    const response = await fetch(
      `${resolveAuthFnBaseUrl(region)}/nucleus/bootstrap`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ region })
      }
    );
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok || !result.data?.session) {
      return {
        kind: "failed" as const,
        status: response.status,
        error: result?.error
      };
    }

    return {
      kind: "success" as const,
      token,
      session: result.data.session
    };
  } catch (error) {
    return {
      kind: "failed" as const,
      status: 0,
      error
    };
  }
}

function emitAccountNetworkMetric(metric: AuthFnClientRequestMetric) {
  if (!shouldEmitAccountLatencyMetric()) return;
  logger.debug({
    at: "authfn.account.network",
    method: metric.method,
    path: metric.path,
    status: metric.status,
    ok: metric.ok,
    durationMs: round(metric.durationMs),
    requestId: metric.requestId,
    serverTiming: metric.serverTiming,
    dbDurationMs: metric.dbDurationMs,
    dbCallCount: metric.dbCallCount,
    dbMaxDurationMs: metric.serverTiming?.match(/dbmax;dur=([0-9.]+)/)?.[1],
    cacheDurationMs: metric.cacheDurationMs,
    cacheCallCount: metric.cacheCallCount,
    lookupDurationMs: metric.lookupDurationMs,
    lookupCallCount: metric.lookupCallCount,
    workerColo: metric.workerColo,
    accountRegion: metric.accountRegion,
    error: metric.error
  });
}

function shouldEmitAccountLatencyMetric(): boolean {
  if (import.meta.env?.VITE_ACCOUNT_LATENCY_DEBUG === "true") return true;
  if (typeof window === "undefined") return false;
  return window.localStorage?.getItem("accountLatencyDebug") === "true";
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function resolveStoredAuthSessionState(): Promise<StoredAuthSessionState> {
  const shouldUseBearerSession = shouldUseAuthFnBearerSession();
  const authFnToken = shouldUseBearerSession
    ? ((await clientStorage.get(ClientStorageKey.AUTHFN_TOKEN)) ?? undefined)
    : undefined;
  if (!shouldUseBearerSession) {
    await clientStorage.remove(ClientStorageKey.AUTHFN_TOKEN);
  }
  const [
    offlineSessionId,
    storedUserInfo,
    storedUser,
    datafnOfflinability,
    isOffline
  ] = await Promise.all([
    clientStorage.get(ClientStorageKey.OFFLINE_SESSION_ID),
    clientStorage.get(ClientStorageKey.USER_INFO),
    clientStorage.get(ClientStorageKey.USER),
    clientStorage.get(ClientStorageKey.DATAFN_OFFLINABILITY),
    typeof window === "undefined" ? false : determineIfOffline()
  ]);
  const hasStoredUserInfo = Boolean(storedUserInfo);
  const hasStoredCloudIdentity = Boolean(
    authFnToken || storedUserInfo || storedUser
  );
  return {
    shouldUseBearerSession,
    authFnToken,
    offlineSessionId: offlineSessionId ?? undefined,
    hasStoredUserInfo,
    hasStoredCloudIdentity,
    hasOfflineOnlySession: Boolean(offlineSessionId && !hasStoredCloudIdentity),
    isDatafnOfflinabilityEnabled: datafnOfflinability !== "false",
    isOffline
  };
}

export function canUseStoredCloudSession(
  state: StoredAuthSessionState,
  error?: unknown,
  isException = false
) {
  return Boolean(
    state.hasStoredUserInfo &&
    state.isDatafnOfflinabilityEnabled &&
    (state.isOffline || isException || isRetryableAuthFnError(error))
  );
}

export function isRetryableAuthFnError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; retryable?: unknown };
  return (
    candidate.retryable === true || candidate.code === "AUTHFN_NETWORK_ERROR"
  );
}

export async function clearStoredCloudAuthState(): Promise<void> {
  authClientsMap.clear();
  await Promise.all([
    clientStorage.remove(ClientStorageKey.AUTHFN_TOKEN),
    clientStorage.remove(ClientStorageKey.AUTHFN_WIDGET_TOKEN),
    clientStorage.remove(ClientStorageKey.STOKEN),
    clientStorage.remove(ClientStorageKey.USER),
    clientStorage.remove(ClientStorageKey.USER_INFO),
    clientStorage.remove(ClientStorageKey.USER_PLAN),
    clientStorage.remove(ClientStorageKey.USER_REGION_MAP),
    clientStorage.remove(ClientStorageKey.OFFLINE_SESSION_ID)
  ]);
}

function resolveFailedAuthSession(
  storedState: StoredAuthSessionState,
  error: unknown
): AuthSessionResolution {
  const canUseCachedCloudSession = canUseStoredCloudSession(storedState, error);
  logger.warn({
    at: "resolveAuthSession.session.failed",
    hasAuthFnToken: Boolean(storedState.authFnToken),
    hasOfflineSession: Boolean(storedState.offlineSessionId),
    hasOfflineOnlySession: storedState.hasOfflineOnlySession,
    canUseStoredCloudSession: canUseCachedCloudSession,
    error,
    currentPath: window.location.pathname
  });
  return canUseCachedCloudSession
    ? { status: "cached-cloud", storedState, error }
    : { status: "unavailable", storedState, error };
}

async function resolveMissingAuthSession(
  storedState: StoredAuthSessionState
): Promise<AuthSessionResolution> {
  if (storedState.hasStoredCloudIdentity) {
    await clearStoredCloudAuthState();
  }
  logger.warn({
    at: "resolveAuthSession.session.missing",
    hasStoredCloudIdentity: storedState.hasStoredCloudIdentity,
    hasAuthFnToken: Boolean(storedState.authFnToken),
    hasOfflineSession: Boolean(storedState.offlineSessionId),
    currentPath: window.location.pathname
  });
  return {
    status: storedState.hasStoredCloudIdentity ? "expired" : "signed-out",
    storedState
  };
}

export async function resolveAuthSession(): Promise<AuthSessionResolution> {
  const storedState = await resolveStoredAuthSessionState();
  if (typeof window === "undefined") {
    return {
      status: "signed-out",
      storedState
    };
  }
  if (storedState.hasOfflineOnlySession) {
    return {
      status: "offline-only",
      storedState
    };
  }
  if (canUseStoredCloudSession(storedState)) {
    return {
      status: "cached-cloud",
      storedState
    };
  }

  try {
    const client = await authClient({ isPreventCachedInstance: true });
    const session = await client.getSession();
    if (!session.ok) {
      return resolveFailedAuthSession(storedState, session.error);
    }
    if (!session.data.session) {
      return resolveMissingAuthSession(storedState);
    }
    const activeSession = session.data.session;
    await clientStorage.set(ClientStorageKey.USER, activeSession);
    if (activeSession.primaryEmail) {
      await client.resolveRegion({
        identifier: activeSession.primaryEmail
      });
    }
    logger.info({
      at: "resolveAuthSession.session.result",
      hasAuthFnToken: Boolean(storedState.authFnToken),
      hasOfflineSession: Boolean(storedState.offlineSessionId),
      hasOfflineOnlySession: storedState.hasOfflineOnlySession,
      canUseStoredCloudSession: canUseStoredCloudSession(storedState),
      hasSession: true,
      regionId: activeSession.regionId,
      currentPath: window.location.pathname
    });
    return {
      status: "authenticated",
      storedState,
      session: activeSession
    };
  } catch (error) {
    const canUseCachedCloudSession = canUseStoredCloudSession(
      storedState,
      error,
      true
    );
    logger.error({
      at: "resolveAuthSession.exception",
      error,
      canUseStoredCloudSession: canUseCachedCloudSession
    });
    if (canUseCachedCloudSession) {
      return {
        status: "cached-cloud",
        storedState,
        error
      };
    }
    return {
      status: "unavailable",
      storedState,
      error
    };
  }
}

export async function performSessionCheck(): Promise<boolean | undefined> {
  const resolution = await resolveAuthSession();
  if (
    resolution.status === "authenticated" ||
    resolution.status === "offline-only" ||
    resolution.status === "cached-cloud"
  ) {
    return true;
  }
  if (resolution.status === "unavailable") {
    return undefined;
  }
  return false;
}

function createNucleusRegionStorage(): AuthFnRegionStorage {
  return {
    async get(identifier) {
      const map = await readRegionMap();
      const value = map[normalizeIdentifier(identifier)];
      if (!value) return null;
      return typeof value === "string"
        ? regionValueFromLegacyString(identifier, value)
        : value;
    },
    async set(identifier, value) {
      const map = await readRegionMap();
      map[normalizeIdentifier(identifier)] = value;
      await clientStorage.set(ClientStorageKey.USER_REGION_MAP, map);
    },
    async delete(identifier) {
      const map = await readRegionMap();
      delete map[normalizeIdentifier(identifier)];
      await clientStorage.set(ClientStorageKey.USER_REGION_MAP, map);
    }
  };
}

async function readRegionMap(): Promise<Record<string, StoredRegionValue>> {
  const raw =
    (await clientStorage.get(ClientStorageKey.USER_REGION_MAP)) ?? "{}";
  if (typeof raw === "object" && raw !== null) {
    return raw as Record<string, StoredRegionValue>;
  }
  try {
    return JSON.parse(raw) as Record<string, StoredRegionValue>;
  } catch {
    return {};
  }
}

function regionValueFromLegacyString(
  identifier: string,
  regionId: string
): AuthFnCachedRegion {
  const normalized = normalizeIdentifier(identifier);
  return {
    identifier: normalized,
    regionId,
    authority: resolveAccountBaseUrl(regionId),
    cachedAt: Date.now(),
    expiresAt: Date.now() + REGION_CACHE_TTL_MS
  };
}

function normalizeIdentifier(identifier: string) {
  return identifier.trim().toLowerCase();
}
