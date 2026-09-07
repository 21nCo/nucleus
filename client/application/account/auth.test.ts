import { beforeEach, describe, expect, it, vi } from "vitest";

import { ClientStorageKey } from "@nucleum/persistence/persistence.type";
import { performSessionCheck, resolveStoredAuthSessionState } from "@nucleum/client/runtime/account/auth";

const mocks = vi.hoisted(() => {
  const storage = new Map<string, string>();
  return {
    storage,
    isExtensionEnvironment: vi.fn(),
    determineIfOffline: vi.fn(),
    getSession: vi.fn(),
    resolveRegion: vi.fn(),
    createAuthFnRegionalClient: vi.fn(),
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }
  };
});

vi.mock("@authfn/client", () => ({
  createAuthFnRegionalClient: mocks.createAuthFnRegionalClient
}));

vi.mock("@nucleum/persistence/persistence.utils", () => ({
  clientStorage: {
    get: vi.fn((key: ClientStorageKey) =>
      Promise.resolve(mocks.storage.get(key) ?? null)
    ),
    set: vi.fn((key: ClientStorageKey, value: unknown) => {
      mocks.storage.set(
        key,
        typeof value === "string" ? value : JSON.stringify(value)
      );
      return Promise.resolve(value);
    }),
    remove: vi.fn((key: ClientStorageKey) => {
      mocks.storage.delete(key);
      return Promise.resolve(key);
    })
  }
}));

vi.mock("@nucleum/client/runtime/logging/logger", () => ({
  logger: mocks.logger
}));

vi.mock("@21n/utils/browser.utils", () => ({
  isExtensionEnvironment: mocks.isExtensionEnvironment
}));

vi.mock("@nucleum/client/runtime/connectivity", () => ({
  determineIfOffline: mocks.determineIfOffline
}));

vi.mock("@nucleum/client/runtime/account/network", () => ({
  resolveAccountBaseUrl: () => "https://account.example",
  resolveAccountCookiePrefix: () => "nucleus"
}));

function store(key: ClientStorageKey, value: unknown) {
  mocks.storage.set(
    key,
    typeof value === "string" ? value : JSON.stringify(value)
  );
}

describe("client/components/account/auth", () => {
  beforeEach(() => {
    mocks.storage.clear();
    mocks.isExtensionEnvironment.mockReturnValue(false);
    mocks.determineIfOffline.mockResolvedValue(false);
    mocks.getSession.mockResolvedValue({
      ok: true,
      data: {
        session: null
      }
    });
    mocks.resolveRegion.mockResolvedValue(undefined);
    mocks.createAuthFnRegionalClient.mockReturnValue({
      setCurrentRegionId: vi.fn(),
      getSession: mocks.getSession,
      resolveRegion: mocks.resolveRegion,
      createTransportAuth: vi.fn()
    });
    vi.clearAllMocks();
    (globalThis as any).window = {
      localStorage: {
        getItem: vi.fn(() => null)
      },
      location: {
        pathname: "/"
      }
    };
  });

  it("treats an offline session without cloud markers as offline-only", async () => {
    store(ClientStorageKey.OFFLINE_SESSION_ID, "offline-1");

    await expect(resolveStoredAuthSessionState()).resolves.toMatchObject({
      hasOfflineOnlySession: true,
      hasStoredCloudIdentity: false
    });
    await expect(performSessionCheck()).resolves.toBe(true);
    expect(mocks.getSession).not.toHaveBeenCalled();
  });

  it("does not treat stale offline session id plus cloud user info as offline-only", async () => {
    store(ClientStorageKey.OFFLINE_SESSION_ID, "offline-1");
    store(ClientStorageKey.USER_INFO, { id: "user:123" });

    await expect(resolveStoredAuthSessionState()).resolves.toMatchObject({
      hasOfflineOnlySession: false,
      hasStoredCloudIdentity: true
    });
    await expect(performSessionCheck()).resolves.toBe(false);
    expect(mocks.getSession).toHaveBeenCalledTimes(1);
  });

  it("allows a cached cloud session when offline and DataFn offlinability is enabled", async () => {
    store(ClientStorageKey.USER_INFO, { id: "user:123" });
    mocks.determineIfOffline.mockResolvedValue(true);

    await expect(performSessionCheck()).resolves.toBe(true);
    expect(mocks.getSession).not.toHaveBeenCalled();
  });

  it("allows cached cloud session on retryable AuthFn failure", async () => {
    store(ClientStorageKey.USER_INFO, { id: "user:123" });
    mocks.getSession.mockResolvedValue({
      ok: false,
      error: {
        code: "AUTHFN_NETWORK_ERROR",
        retryable: true
      }
    });

    await expect(performSessionCheck()).resolves.toBe(true);
  });

  it("does not allow cached cloud session when offlinability is disabled", async () => {
    store(ClientStorageKey.USER_INFO, { id: "user:123" });
    store(ClientStorageKey.DATAFN_OFFLINABILITY, "false");
    mocks.determineIfOffline.mockResolvedValue(true);

    await expect(performSessionCheck()).resolves.toBe(false);
    expect(mocks.getSession).toHaveBeenCalledTimes(1);
  });
});
