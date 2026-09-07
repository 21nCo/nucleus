import { beforeEach, describe, expect, it, vi } from "vitest";

import { ClientStorageKey } from "@nucleum/persistence/persistence.type";

import { FallbackTracker } from "./fallbackTracker.utils";

const mockedModules = vi.hoisted(() => ({
  storage: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn()
  },
  logger: {
    error: vi.fn(),
    info: vi.fn()
  }
}));

vi.mock("@nucleum/persistence/persistence.utils", () => ({
  clientStorage: mockedModules.storage
}));

vi.mock("@nucleum/client/runtime/logging/logger", () => ({
  logger: mockedModules.logger
}));

vi.mock("@21n/shared-utils/json.utils", async () => {
  const actual = await vi.importActual<any>("@21n/shared-utils/json.utils");
  return {
    ...actual
  };
});

describe("client/utils/fallbackTracker.utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports whether a fallback has run", async () => {
    mockedModules.storage.get.mockResolvedValueOnce(
      JSON.stringify({ sample: { hasRun: true } })
    );

    expect(await FallbackTracker.hasRun("sample")).toBe(true);
  });

  it("marks fallbacks as run and persists state", async () => {
    mockedModules.storage.get.mockResolvedValueOnce("{}");

    await FallbackTracker.markAsRun("upgrade", "1.0.0");

    expect(mockedModules.storage.set).toHaveBeenCalledWith(
      ClientStorageKey.FALLBACKS_RUN_STATUS,
      expect.objectContaining({
        upgrade: expect.objectContaining({
          hasRun: true,
          version: "1.0.0"
        })
      })
    );
    expect(mockedModules.logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ at: "FallbackTracker.markAsRun" })
    );
  });

  it("resets single fallbacks", async () => {
    mockedModules.storage.get.mockResolvedValueOnce(
      JSON.stringify({ migrate: { hasRun: true } })
    );

    await FallbackTracker.reset("migrate");

    expect(mockedModules.storage.set).toHaveBeenCalledWith(
      ClientStorageKey.FALLBACKS_RUN_STATUS,
      {}
    );
  });

  it("clears all fallback metadata", async () => {
    await FallbackTracker.resetAll();
    expect(mockedModules.storage.remove).toHaveBeenCalledWith(
      ClientStorageKey.FALLBACKS_RUN_STATUS
    );
  });

  it("retrieves all fallback statuses", async () => {
    const payload = { a: { hasRun: true } };
    mockedModules.storage.get.mockResolvedValueOnce(JSON.stringify(payload));

    await expect(FallbackTracker.getAll()).resolves.toEqual(payload);
  });

  it("runs fallbacks only once", async () => {
    mockedModules.storage.get
      .mockResolvedValueOnce("{}")
      .mockResolvedValueOnce(JSON.stringify({ once: { hasRun: true } }))
      .mockResolvedValueOnce(JSON.stringify({ once: { hasRun: true } }));

    const fn = vi.fn().mockResolvedValue(undefined);

    const firstRun = await FallbackTracker.runIfNotCompleted("once", fn, "1");
    const secondRun = await FallbackTracker.runIfNotCompleted("once", fn, "1");

    expect(firstRun).toBe(1);
    expect(secondRun).toBe(0);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("propagates exceptions from fallbacks", async () => {
    mockedModules.storage.get.mockResolvedValueOnce("{}");
    const fn = vi.fn().mockRejectedValue(new Error("boom"));

    await expect(
      FallbackTracker.runIfNotCompleted("error", fn)
    ).rejects.toThrow("boom");
    expect(mockedModules.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ at: "FallbackTracker.runIfNotCompleted" })
    );
  });
});
