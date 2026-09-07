import { beforeEach, describe, expect, it, vi } from "vitest";

import { ClientStorageKey } from "@nucleum/persistence/persistence.type";
import { performSessionCheck, resolveAuthSession } from "@nucleum/client/runtime/account/auth";

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

describe("AuthFn session resolution", () => {
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
        pathname: "/calendar"
      }
    };
  });

  it("classifies a confirmed null session with cloud identity as expired and clears cloud auth state", async () => {
    store(ClientStorageKey.USER_INFO, { id: "user:123" });
    store(ClientStorageKey.USER, { id: "sess_123" });
    store(ClientStorageKey.AUTHFN_TOKEN, "token-123");
    store(ClientStorageKey.STOKEN, "legacy-token");
    store(ClientStorageKey.USER_REGION_MAP, {
      "user@example.com": {
        regionId: "insouth"
      }
    });

    await expect(resolveAuthSession()).resolves.toMatchObject({
      status: "expired"
    });

    expect(mocks.storage.has(ClientStorageKey.USER_INFO)).toBe(false);
    expect(mocks.storage.has(ClientStorageKey.USER)).toBe(false);
    expect(mocks.storage.has(ClientStorageKey.AUTHFN_TOKEN)).toBe(false);
    expect(mocks.storage.has(ClientStorageKey.STOKEN)).toBe(false);
    expect(mocks.storage.has(ClientStorageKey.USER_REGION_MAP)).toBe(false);
  });

  it("does not report backend unavailability as an expired session", async () => {
    mocks.getSession.mockResolvedValue({
      ok: false,
      error: {
        code: "AUTHFN_NETWORK_ERROR",
        retryable: true
      }
    });

    await expect(resolveAuthSession()).resolves.toMatchObject({
      status: "unavailable"
    });
    await expect(performSessionCheck()).resolves.toBeUndefined();
  });

  it("keeps cached cloud state usable for retryable failures when offlinability is enabled", async () => {
    store(ClientStorageKey.USER_INFO, { id: "user:123" });
    mocks.getSession.mockResolvedValue({
      ok: false,
      error: {
        code: "AUTHFN_NETWORK_ERROR",
        retryable: true
      }
    });

    await expect(resolveAuthSession()).resolves.toMatchObject({
      status: "cached-cloud"
    });
    expect(mocks.storage.has(ClientStorageKey.USER_INFO)).toBe(true);
  });
});
