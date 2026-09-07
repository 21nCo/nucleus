import { Resource } from "@nucleum/datafn/resource.enum";
import { logger } from "@nucleum/components/debug/logger.client";
import { get, writable } from "svelte/store";
import { appStore } from "@nucleum/stores/app.store";
import { datafn } from "@nucleum/datafn/datafn.store";
import {
  Preference,
  PreferencesScope,
  type IPreferencesParams,
  type IPreferencesStore
} from "@nucleum/stores/preferences/preferences.type";
import { migrateLegacyNucleusProductKeys } from "@nucleum/stores/productKeyMigration.utils";
import {
  acknowledgeOptimisticKvEntries,
  addOptimisticKvEntries,
  applyOptimisticKvEntries,
  removeOptimisticKvEntries
} from "@nucleum/datafn/optimisticKv.utils";
import type { OptimisticKvEntries } from "@21n/types/datafn.type";

const preferencesSignal = datafn.kv.signal<IPreferencesStore>(
  Resource.preferences,
  { defaultValue: {} }
);
const preferencesLocal = writable<IPreferencesStore>({});
const pendingPreferenceValues: OptimisticKvEntries = new Map();

preferencesSignal.subscribe((value) => {
  const migrated = migrateLegacyNucleusProductKeys(value ?? {});
  acknowledgeOptimisticKvEntries(pendingPreferenceValues, migrated);
  preferencesLocal.set(
    applyOptimisticKvEntries(migrated, pendingPreferenceValues)
  );
});

function resolveKey(keyParam: string, params?: IPreferencesParams) {
  let key: string = keyParam;

  if (params?.scope === PreferencesScope.PRODUCT) {
    const product = get(appStore).product;
    key = `${product}-${key}`;
  }

  if (params?.subVariables) {
    params.subVariables.forEach((subVariable) => {
      key = `${key}_${subVariable}`;
    });
  }

  return key;
}

export const preferences = {
  subscribe: preferencesLocal.subscribe,
  get() {
    return get(preferencesLocal);
  },
  save(keyParam: Preference | string, value: any, params?: IPreferencesParams) {
    const key = resolveKey(keyParam, params);
    this.modify({ [key]: value });
    logger.log({ context: "preferences.store - setPreference", key, value });
  },
  resolve(keyParam: Preference | string, params?: IPreferencesParams): unknown {
    const key = resolveKey(keyParam, params);
    return this.get()[key];
  },
  modify(n: Partial<IPreferencesStore>) {
    const mutationTokens = addOptimisticKvEntries(pendingPreferenceValues, n);
    preferencesLocal.update((current) => ({ ...current, ...n }));
    const mutation = datafn.kv.merge(Resource.preferences, n);
    const rollbackPendingValues = () => {
      removeOptimisticKvEntries(pendingPreferenceValues, mutationTokens);
      const current = migrateLegacyNucleusProductKeys(
        preferencesSignal.get() ?? {}
      );
      preferencesLocal.set(
        applyOptimisticKvEntries(current, pendingPreferenceValues)
      );
    };
    void mutation.then((result) => {
      if (!result.ok) rollbackPendingValues();
    }, rollbackPendingValues);
    return mutation;
  },
  loader(data: IPreferencesStore) {
    if (!data || typeof data !== "object") return;
    const migrated = migrateLegacyNucleusProductKeys(data);
    preferencesLocal.set(migrated);
    return datafn.kv.set(Resource.preferences, migrated);
  },
  destroy() {
    preferencesSignal.dispose();
  }
};
