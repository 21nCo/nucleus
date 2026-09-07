import { get } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@nucleum/persistence/persistence.utils", async () => {
  const actual = await vi.importActual<typeof import("@nucleum/persistence/persistence.utils")>(
    "@nucleum/persistence/persistence.utils"
  );

  return {
    ...actual,
    clientStorage: {
      set: vi.fn().mockResolvedValue(true)
    }
  };
});

const clientStorage = (
  await import("@nucleum/persistence/persistence.utils")
).clientStorage as unknown as { set: ReturnType<typeof vi.fn> };
const { default: contextStore } = await import("./context.store");
const { ClientStorageKey } = await import("@nucleum/persistence/persistence.type");

describe("context store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists offline mode state", async () => {
    await contextStore.toggleOfflineMode(true);

    expect(clientStorage.set).toHaveBeenCalledWith(
      ClientStorageKey.OFFLINE_MODE,
      true
    );
    expect(get(contextStore).isInOfflineMode).toBe(true);
  });

  it("surfaces storage errors without throwing", async () => {
    await contextStore.toggleOfflineMode(true);
    vi.clearAllMocks();
    
    (clientStorage.set as any).mockRejectedValueOnce(new Error("fail"));

    await expect(contextStore.toggleOfflineMode(false)).resolves.toBeUndefined();
    expect(get(contextStore).isInOfflineMode).toBe(true);
  });
});
