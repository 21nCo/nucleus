import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Resource } from "@nucleum/datafn/resource.enum";
import { Product } from "@nucleum/products/product.type";
import { appStore } from "@nucleum/stores/app.store";
import {
  datafn,
  destroyNucleumDatafn,
  initializeNucleumDatafn
} from "@nucleum/datafn/datafn.store";
import { UserDataMode } from "@21n/types/account.type";
import {
  Preference,
  PreferencesScope
} from "@nucleum/stores/preferences/preferences.type";
import { preferences } from "@nucleum/stores/preferences/preferences.store";

describe("DataFn preferences KV store", () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    await destroyNucleumDatafn();
  });

  it("persists product and sub-variable scoped preference keys through DataFn KV", async () => {
    const env = `test-${crypto.randomUUID()}`;
    appStore.initializeProductInformation({
      product: Product.MEMOTRON,
      env
    });
    await initializeNucleumDatafn({
      product: Product.MEMOTRON,
      account: { dataMode: UserDataMode.LOCAL },
      env,
      dapId: "preferences-scope",
      isOffline: false
    });

    preferences.save(Preference.HIDE_HIGHLIGHT_COLORS, true, {
      scope: PreferencesScope.PRODUCT,
      subVariables: ["node", "trace"]
    });

    const scopedKey = `${Product.MEMOTRON}-${Preference.HIDE_HIGHLIGHT_COLORS}_node_trace`;
    await vi.waitFor(async () => {
      const value = await datafn.kv.get<Record<string, unknown>>(
        Resource.preferences
      );
      expect(value?.[scopedKey]).toBe(true);
    });
    expect(
      preferences.resolve(Preference.HIDE_HIGHLIGHT_COLORS, {
        scope: PreferencesScope.PRODUCT,
        subVariables: ["node", "trace"]
      })
    ).toBe(true);
  });

  it("reloads persisted preferences from IndexedDB when DataFn restarts offline", async () => {
    const env = `test-${crypto.randomUUID()}`;
    const dapId = "preferences-reload";
    appStore.initializeProductInformation({
      product: Product.NUCLEUM,
      env
    });
    await initializeNucleumDatafn({
      product: Product.NUCLEUM,
      account: { dataMode: UserDataMode.LOCAL },
      env,
      dapId,
      isOffline: false
    });

    preferences.save(Preference.NOTES_TEMPLATE, "daily", {
      subVariables: ["capture"]
    });
    const scopedKey = `${Preference.NOTES_TEMPLATE}_capture`;
    await vi.waitFor(async () => {
      const value = await datafn.kv.get<Record<string, unknown>>(
        Resource.preferences
      );
      expect(value?.[scopedKey]).toBe("daily");
    });

    await destroyNucleumDatafn();
    await initializeNucleumDatafn({
      product: Product.NUCLEUM,
      account: { dataMode: UserDataMode.LOCAL },
      env,
      dapId,
      isOffline: true
    });
    const reloaded = datafn.kv.signal<Record<string, unknown>>(
      Resource.preferences,
      { defaultValue: {} }
    );

    await vi.waitFor(() => {
      expect(reloaded.get()?.[scopedKey]).toBe("daily");
    });
    reloaded.dispose();
  });
});
