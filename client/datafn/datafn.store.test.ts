import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { get } from "svelte/store";
import { Product } from "@nucleum/products/product.type";
import { UserDataMode } from "@21n/types/account.type";
import {
  createDatafnStorage,
  createNucleumDatafnHttpOptions,
  datafn,
  datafnRuntime,
  nucleumDatafnStatus,
  destroyNucleumDatafn,
  initializeNucleumDatafn,
  migrateDatafnNodeMdChildOrder,
  resolveDatafnBackgroundResources,
  resolveDatafnBootResources,
  resolveDatafnMode,
  resolveDatafnNamespace,
  resolveDatafnProductResources,
  resolveDatafnStorageDbName
} from "./datafn.store";
import { Resource } from "@nucleum/datafn/resource.enum";

describe("datafn.store", () => {
  beforeEach(() => {
    const localStorage = createLocalStorageMock();
    Object.defineProperty(globalThis, "window", {
      value: {
        location: {
          protocol: "https:",
          host: "app.nucleum.test",
          hostname: "app.nucleum.test",
          origin: "https://app.nucleum.test"
        },
        localStorage
      },
      configurable: true
    });
    Object.defineProperty(globalThis, "localStorage", {
      value: localStorage,
      configurable: true
    });
    Object.defineProperty(globalThis, "navigator", {
      value: {
        onLine: true
      },
      configurable: true
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await destroyNucleumDatafn();
  });

  it("creates product and user-space aware IndexedDB names", async () => {
    const namespace = resolveDatafnNamespace({
      account: { userId: "u1" },
      dapId: "dap1"
    });

    expect(namespace).toBe("user:u1");
    expect(
      resolveDatafnStorageDbName({
        product: Product.MEMOTRON,
        namespace,
        env: "dev"
      })
    ).toBe("nucleum-datafn-dev-memotron_user_u1");

    const { storage, dbName } = createDatafnStorage({
      product: Product.MEMOTRON,
      namespace,
      env: "dev"
    });
    expect(dbName).toBe("nucleum-datafn-dev-memotron_user_u1");
    expect(await storage.healthCheck()).toEqual({ ok: true, issues: [] });
    await storage.close();
  });

  it("migrates legacy node children into mdChildOrder", async () => {
    const { storage } = createDatafnStorage({
      product: Product.MEMOTRON,
      namespace: "user:md-child-order-migration",
      env: "test"
    });

    await storage.upsertRecord("node", {
      id: "node:legacy",
      contentType: "NODULAR_MARKDOWN",
      children: ["node:block"]
    });

    await migrateDatafnNodeMdChildOrder(storage);

    const migrated = await storage.getRecord("node", "node:legacy");
    expect(migrated?.mdChildOrder).toEqual(["node:block"]);
    expect(migrated?.children).toBeUndefined();
    await storage.close();
  });

  it("closes active storage when explicitly destroying DataFn runtime", async () => {
    const runtime = await initializeNucleumDatafn({
      product: Product.MEMOTRON,
      account: { dataMode: UserDataMode.LOCAL },
      dapId: "dap-destroy",
      env: "test"
    });
    const closeSpy = vi.spyOn(runtime.storage!, "close");

    await destroyNucleumDatafn();

    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(get(datafnRuntime)).toBeNull();
  });

  it("closes previous storage when reinitializing a different DataFn runtime", async () => {
    const firstRuntime = await initializeNucleumDatafn({
      product: Product.MEMOTRON,
      account: { dataMode: UserDataMode.LOCAL },
      dapId: "dap-switch",
      env: "test"
    });
    const closeSpy = vi.spyOn(firstRuntime.storage!, "close");

    const secondRuntime = await initializeNucleumDatafn({
      product: Product.POINTRON,
      account: { dataMode: UserDataMode.LOCAL },
      dapId: "dap-switch",
      env: "test"
    });

    expect(closeSpy).toHaveBeenCalled();
    expect(secondRuntime).not.toBe(firstRuntime);
    expect(get(datafnRuntime)).toBe(secondRuntime);
  });

  it("coalesces event-driven pending-change refreshes", async () => {
    const runtime = await initializeNucleumDatafn({
      product: Product.MEMOTRON,
      account: { dataMode: UserDataMode.LOCAL },
      dapId: "dap-health",
      env: "test"
    });
    const changelogListSpy = vi.spyOn(runtime.storage!, "changelogList");

    await datafn.kv.set(Resource.preferences, { density: "compact" });
    await datafn.kv.set(Resource.uiState, { sidebar: "open" });
    await datafn.kv.set(Resource.markdownSettings, { toolbar: true });

    expect(changelogListSpy).not.toHaveBeenCalled();
    await vi.waitFor(() => {
      expect(changelogListSpy).toHaveBeenCalledTimes(1);
      expect(get(nucleumDatafnStatus).nucleumMode).toBe("local-only");
      expect(get(nucleumDatafnStatus).pendingChanges).toBeGreaterThanOrEqual(3);
    });
  });

  it("keeps product resource sets aligned with configured product surfaces", () => {
    expect(resolveDatafnProductResources(Product.MEMOTRON)).toContain("node");
    expect(resolveDatafnProductResources(Product.MEMOTRON)).not.toContain(
      "objective"
    );
    expect(resolveDatafnProductResources(Product.POINTRON)).toContain("event");
    expect(resolveDatafnProductResources(Product.POINTRON)).not.toContain(
      "node"
    );
    expect(resolveDatafnBootResources(Product.POINTRON)).toEqual([
      "objective",
      "task",
      "collection",
      "event"
    ]);
    expect(resolveDatafnBackgroundResources(Product.POINTRON)).toContain(
      "linkTag"
    );
    expect(resolveDatafnBackgroundResources(Product.POINTRON)).not.toContain(
      "link"
    );
  });

  it("uses sync mode only for authenticated user spaces", () => {
    expect(
      resolveDatafnMode({
        product: Product.NUCLEUM,
        account: { dataMode: UserDataMode.LOCAL },
        isOffline: false
      })
    ).toBe("local-only");
    expect(
      resolveDatafnMode({
        product: Product.NUCLEUM,
        account: {
          dataMode: UserDataMode.LOCAL,
          userId: "u1"
        },
        isOffline: false
      })
    ).toBe("local-only");
    expect(
      resolveDatafnMode({
        product: Product.NUCLEUM,
        account: {
          dataMode: UserDataMode.CLOUD,
          userId: "u1"
        },
        isOffline: true
      })
    ).toBe("local-only");
  });

  it("creates DataFn HTTP options with AuthFn provider", async () => {
    const options = await createNucleumDatafnHttpOptions();

    expect(await options.auth?.getCredentials?.()).toBe("include");
    expect(options.auth?.getRequestHeaders).toBeDefined();
  });

  it("creates DataFn HTTP options with public-link principal material", async () => {
    const options = await createNucleumDatafnHttpOptions({
      publicLinkToken: "plink:1.secret"
    });

    expect(
      ((await options.auth?.getRequestHeaders?.()) as Record<string, string>)[
        "x-datafn-public-link-token"
      ]
    ).toBe("plink:1.secret");
  });
});

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    }
  };
}
