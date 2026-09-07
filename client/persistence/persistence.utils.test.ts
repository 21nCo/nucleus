import { afterEach, describe, expect, it, vi } from "vitest";
import { ClientStorageKey } from "@nucleum/persistence/persistence.type";
import { clientStorage, getDapId } from "./persistence.utils";

describe("persistence.utils", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reuses one in-flight DAP id write for concurrent callers", async () => {
    vi.spyOn(clientStorage, "get").mockResolvedValue(null);
    const setSpy = vi.spyOn(clientStorage, "set").mockResolvedValue(undefined);

    const first = getDapId();
    const second = getDapId();

    const [firstId, secondId] = await Promise.all([first, second]);

    expect(firstId).toBe(secondId);
    expect(clientStorage.get).toHaveBeenCalledTimes(1);
    expect(setSpy).toHaveBeenCalledTimes(1);
    expect(setSpy).toHaveBeenCalledWith(ClientStorageKey.DAP_ID, firstId);
  });

  it("returns an existing DAP id without rewriting storage", async () => {
    vi.spyOn(clientStorage, "get").mockResolvedValue("existing-dap");
    const setSpy = vi.spyOn(clientStorage, "set");

    await expect(getDapId()).resolves.toBe("existing-dap");

    expect(setSpy).not.toHaveBeenCalled();
  });
});
