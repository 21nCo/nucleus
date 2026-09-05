import {
  createDatafnPublicLinkAuthPlugin,
  createDatafnClient,
  IndexedDbStorageAdapter,
  type DatafnClient,
  type DatafnE2eeConfig,
  type DatafnHttpTransportOptions,
  type DatafnSyncStatus,
  type DatafnStorageAdapter
} from "@datafn/client";
import {
  nucleumDatafnSchema,
  nucleumDatafnSearchDefaults,
  nucleumDatafnSearchPipeline,
  resolveNucleumDatafnSearchIndexVersion,
  resolveNucleumDatafnSearchResourceFields,
  type NucleumDatafnResource,
  type NucleumDatafnSchema
} from "@nucleum/schema";
import { createSearchProvider } from "@searchfn/datafn-provider";
import { IndexedDbAdapter } from "@searchfn/adapter-indexeddb";
import { resolveProductResourceConfig } from "@nucleum/schema/product.config";
import { resolveAccountBaseUrl } from "@21n/components/network";
import { createNucleumAuthFnTransportAuth } from "@21n/components/account/auth";
import type { Product } from "@21n/products/product.type";
import { ClientStorageKey } from "@21n/persistence/persistence.type";
import {
  clientStorage,
  deleteIndexedDbDatabase,
  getDapId
} from "@21n/persistence/persistence.utils";
import type { UserAccount } from "@21n/types/account.type";
import type { NucleumDatafnE2eeSettings } from "@21n/types/datafn.type";
import { UserDataMode } from "@21n/types/account.type";
import { get, writable } from "svelte/store";
import { logger } from "@21n/components/debug/logger.client";
import { compareObjects } from "@21n/shared-utils/obj.utils";
import {
  DATAFN_E2EE_KV_KEY,
  createDisabledDatafnE2eeSettings,
  createDatafnE2eeSetup,
  datafnE2eeState,
  disableLocalDatafnE2ee,
  getCachedDatafnE2eeProvider,
  getLocalDatafnE2eeSettings,
  persistDatafnE2eeSettings,
  rewrapCachedDatafnE2eeKey,
  unlockDatafnE2eeSettings
} from "@21n/stores/datafnE2ee.store";

export type NucleumDatafnMode = "local-only" | "sync" | "sync-direct";

export type NucleumDatafnStatus = DatafnSyncStatus & {
  namespace: string | null;
  storageDbName: string | null;
  product: Product | null;
  nucleumMode: NucleumDatafnMode | null;
  remoteUrl: string | null;
  bootResources: string[];
  backgroundResources: string[];
};

type SearchProvider = {
  readonly name: string;
  search(params: {
    resource: string;
    query: string;
    type?: "fullText" | "semantic";
    fields?: string[];
    limit?: number;
    prefix?: boolean;
    fuzzy?: boolean | number;
    fieldBoosts?: Record<string, number>;
    namespaceFilter?: string[];
    regionFilter?: string[];
    signal?: AbortSignal;
  }): Promise<string[]>;
  searchAll?(params: {
    query: string;
    resources?: string[];
    fields?: string[];
    limit?: number;
    limitPerResource?: number;
    prefix?: boolean;
    fuzzy?: boolean | number;
    fieldBoosts?: Record<string, number>;
    namespaceFilter?: string[];
    regionFilter?: string[];
    signal?: AbortSignal;
  }): Promise<Array<{ resource: string; id: string; score: number }>>;
  updateIndices(params: {
    resource: string;
    records: Record<string, unknown>[];
    operation: "upsert" | "delete";
  }): Promise<void>;
  initialize?(config: {
    resources: Array<{ name: string; searchFields: string[] }>;
  }): Promise<void>;
  dispose?(): Promise<void>;
};

export type NucleumDatafnRuntime = {
  storage?: DatafnStorageAdapter;
  namespace: string;
  storageDbName: string | null;
  product: Product;
  mode: NucleumDatafnMode;
  remoteUrl: string | null;
  bootResources: string[];
  backgroundResources: string[];
  e2eeKeyRef?: string | null;
  destroy: () => Promise<void>;
};

export type InitializeNucleumDatafnInput = {
  product: Product;
  account: Pick<UserAccount, "dataMode" | "userId" | "userInfo">;
  env?: string;
  appVersion?: string;
  dapId?: string;
  isOffline?: boolean;
  isOfflinabilityEnabled?: boolean;
};

const datafnOfflinabilityDefault = true;

const initialStatus: NucleumDatafnStatus = {
  status: "idle",
  mode: "local-only",
  phase: null,
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  pendingChanges: 0,
  lastSyncAt: null,
  lastError: null,
  namespace: null,
  storageDbName: null,
  product: null,
  nucleumMode: null,
  remoteUrl: null,
  bootResources: [],
  backgroundResources: []
};

const runtimeStore = writable<NucleumDatafnRuntime | null>(null);
export const datafnRuntime = runtimeStore;
export const nucleumDatafnStatus = writable<NucleumDatafnStatus>(initialStatus);
let datafnSearchProvider: SearchProvider | undefined;
let lastInitializeInput: InitializeNucleumDatafnInput | null = null;
let datafnStatusUnsubscribe: (() => void) | null = null;
const generateDatafnId = ({
  resource,
  idPrefix
}: {
  resource: string;
  idPrefix?: string;
}) => {
  const prefix = idPrefix || resource;
  return `${prefix}:${crypto.randomUUID()}`;
};

type NucleumDatafnSchemaResource =
  (typeof nucleumDatafnSchema.resources)[number];

const isRemoteOnlySchemaResource = (resource: NucleumDatafnSchemaResource) =>
  "isRemoteOnly" in resource && resource.isRemoteOnly === true;

const isValidDatafnSchemaResourceName = (
  resource: unknown,
  resources: Set<NucleumDatafnResource>
): resource is NucleumDatafnResource =>
  typeof resource === "string" &&
  resources.has(resource as NucleumDatafnResource);

function createNucleumClientSearchProvider(input: {
  dbName: string;
}): SearchProvider | undefined {
  if (typeof indexedDB === "undefined") return undefined;
  return createSearchProvider(
    new IndexedDbAdapter({
      dbName: input.dbName,
      pipeline: nucleumDatafnSearchPipeline,
      defaults: nucleumDatafnSearchDefaults,
      cache: {
        terms: 4096,
        vectors: 1024
      }
    }),
    {
      resourceFields: resolveNucleumDatafnSearchResourceFields()
    }
  );
}

export const datafn: DatafnClient<NucleumDatafnSchema> = createDatafnClient({
  schema: nucleumDatafnSchema,
  clientId: "nucleum-bootstrap",
  searchProvider: datafnSearchProvider,
  searchIndexVersion: resolveNucleumDatafnSearchIndexVersion(),
  sync: { mode: "local-only" },
  temporal: { timezone: "user" },
  generateId: generateDatafnId
});

function resolveNucleumDatafnStatus(
  datafnStatus: DatafnSyncStatus,
  runtime: NucleumDatafnRuntime | null
): NucleumDatafnStatus {
  if (!runtime) return { ...initialStatus, ...datafnStatus };
  return {
    ...datafnStatus,
    namespace: runtime.namespace,
    storageDbName: runtime.storageDbName,
    product: runtime.product,
    nucleumMode: runtime.mode,
    remoteUrl: runtime.remoteUrl,
    bootResources: runtime.bootResources,
    backgroundResources: runtime.backgroundResources
  };
}

function bindNucleumDatafnStatus(runtime: NucleumDatafnRuntime) {
  datafnStatusUnsubscribe?.();
  datafnStatusUnsubscribe = datafn.sync.statusSignal().subscribe((status) => {
    nucleumDatafnStatus.set(resolveNucleumDatafnStatus(status, runtime));
  });
  nucleumDatafnStatus.set(
    resolveNucleumDatafnStatus(datafn.sync.getStatus(), runtime)
  );
}

function clearNucleumDatafnStatusBinding() {
  datafnStatusUnsubscribe?.();
  datafnStatusUnsubscribe = null;
}

export function resolveDatafnProductResources(
  product: Product
): NucleumDatafnResource[] {
  const cloneableResources = new Set(
    nucleumDatafnSchema.resources
      .filter((resource) => !isRemoteOnlySchemaResource(resource))
      .map((resource) => resource.name)
  );
  const configuredResources = resolveProductResourceConfig(product, {
    isDev: import.meta.env?.DEV
  });
  const configuredResourceNames = [
    ...configuredResources.table,
    ...configuredResources.browse
  ].map((resource) => resource.toString());
  const productResources: NucleumDatafnResource[] = [];
  for (const resource of configuredResourceNames) {
    if (
      !productResources.includes(resource as NucleumDatafnResource) &&
      isValidDatafnSchemaResourceName(resource, cloneableResources)
    ) {
      productResources.push(resource);
    }
  }
  return productResources;
}

export function resolveDatafnBootResources(product: Product): string[] {
  const cloneableResources = new Set(
    nucleumDatafnSchema.resources
      .filter((resource) => !isRemoteOnlySchemaResource(resource))
      .map((resource) => resource.name)
  );
  return resolveProductResourceConfig(product, {
    isDev: import.meta.env?.DEV
  })
    .browse.map((resource) => resource.toString())
    .filter((resource) =>
      isValidDatafnSchemaResourceName(resource, cloneableResources)
    );
}

export function resolveDatafnBackgroundResources(product: Product): string[] {
  const boot = new Set(resolveDatafnBootResources(product));
  return resolveDatafnProductResources(product).filter(
    (resource) => !boot.has(resource)
  );
}

export function resolveDatafnNamespace(input: {
  account: Pick<UserAccount, "userId" | "userInfo">;
  dapId: string;
}) {
  const userId =
    input.account.userInfo?.id?.replace(/^user:/, "") ??
    input.account.userId?.replace(/^user:/, "");
  if (userId) return `user:${userId}`;
  return `guest:${input.dapId}`;
}

export function resolveDatafnBaseDbName(input: {
  product: Product;
  env?: string;
}) {
  const product = input.product.toString().trim().toLowerCase();
  const env = input.env?.toString().trim().toLowerCase() || "dev";
  return `nucleum-datafn-${env}-${product}`;
}

export function resolveDatafnStorageDbName(input: {
  product: Product;
  namespace: string;
  env?: string;
}) {
  return `${resolveDatafnBaseDbName(input)}_${input.namespace.replace(/:/g, "_")}`;
}

export function createDatafnStorage(input: {
  product: Product;
  namespace: string;
  env?: string;
}) {
  const storage = IndexedDbStorageAdapter.createForNamespace(
    resolveDatafnBaseDbName(input),
    input.namespace,
    undefined,
    nucleumDatafnSchema
  );
  return {
    storage,
    dbName: storage.dbName
  };
}

const nodeMdChildOrderMigrationId = "kv:migration:node-md-child-order-v1";

export async function migrateDatafnNodeMdChildOrder(
  storage?: DatafnStorageAdapter | null
) {
  if (!storage) return;
  const marker = await storage
    .getRecord("kv", nodeMdChildOrderMigrationId)
    .catch(() => null);
  if (marker) return;
  const records = await storage.listRecords("node");
  let migratedCount = 0;
  for (const record of records) {
    if (!("children" in record)) continue;
    const { children, ...nextRecord } = record;
    if (!Array.isArray(nextRecord.mdChildOrder) && Array.isArray(children)) {
      nextRecord.mdChildOrder = children;
      migratedCount++;
    }
    await storage.upsertRecord("node", nextRecord);
  }
  await storage.upsertRecord("kv", {
    id: nodeMdChildOrderMigrationId,
    value: true,
    migratedCount,
    migratedAt: new Date().toISOString()
  });
}

export function resolveDatafnMode(input: InitializeNucleumDatafnInput) {
  const hasUserSpace = Boolean(
    input.account.userId || input.account.userInfo?.id
  );
  const isSyncEligible =
    hasUserSpace && input.account.dataMode !== UserDataMode.LOCAL;
  if (!isSyncEligible) return "local-only";
  if (input.isOfflinabilityEnabled === false) return "sync-direct";
  if (input.isOffline) return "local-only";
  return "sync";
}

export async function resolveDatafnOfflinabilityPreference() {
  if (typeof window === "undefined" && typeof chrome === "undefined") {
    return datafnOfflinabilityDefault;
  }
  const value = await clientStorage.get(ClientStorageKey.DATAFN_OFFLINABILITY);
  if (value === null) return datafnOfflinabilityDefault;
  return value !== "false";
}

export async function setDatafnOfflinabilityPreference(isEnabled: boolean) {
  if (!isEnabled && get(datafnE2eeState).enabled) {
    throw new Error("Offline storage is required while E2EE is enabled");
  }
  await clientStorage.set(
    ClientStorageKey.DATAFN_OFFLINABILITY,
    isEnabled.toString()
  );
  return isEnabled;
}

function isSyncEligibleAccount(input: InitializeNucleumDatafnInput) {
  const hasUserSpace = Boolean(
    input.account.userId || input.account.userInfo?.id
  );
  return hasUserSpace && input.account.dataMode !== UserDataMode.LOCAL;
}

function isDatafnE2eeSettings(
  value: unknown
): value is NucleumDatafnE2eeSettings {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    (value as { version?: unknown }).version === 1 &&
    typeof (value as { enabled?: unknown }).enabled === "boolean"
  );
}

function requestDatafnE2eePassword(message: string) {
  if (typeof window === "undefined" || typeof window.prompt !== "function") {
    throw new Error("E2EE password is required");
  }
  const password = window.prompt(message);
  if (!password) throw new Error("E2EE password is required");
  return password;
}

async function readRemoteDatafnE2eeSettings(input: {
  dapId: string;
  namespace: string;
  remoteUrl: string;
  http: DatafnHttpTransportOptions;
}) {
  const metadataClient = createDatafnClient({
    schema: nucleumDatafnSchema,
    clientId: input.dapId,
    namespace: input.namespace,
    sync: {
      mode: "sync",
      remote: input.remoteUrl,
      http: input.http,
      offlinability: false,
      crossTab: false,
      ws: false
    },
    temporal: { timezone: "user" },
    generateId: generateDatafnId
  });
  try {
    const settings =
      await metadataClient.kv.get<NucleumDatafnE2eeSettings>(
        DATAFN_E2EE_KV_KEY
      );
    return isDatafnE2eeSettings(settings) ? settings : null;
  } finally {
    await metadataClient.destroy();
  }
}

async function writeRemoteDatafnE2eeSettings(
  settings: NucleumDatafnE2eeSettings,
  context?: {
    clientId: string;
    namespace: string;
    remoteUrl: string;
    http: DatafnHttpTransportOptions;
    expectedSettings?: NucleumDatafnE2eeSettings | null;
  }
) {
  const runtime = get(runtimeStore);
  const remoteUrl = context?.remoteUrl ?? runtime?.remoteUrl;
  const namespace = context?.namespace ?? runtime?.namespace;
  if (!remoteUrl || !namespace) {
    throw new Error("DataFn remote is not available");
  }
  const metadataClient = createDatafnClient({
    schema: nucleumDatafnSchema,
    clientId: context?.clientId ?? (await getDapId()) ?? "unknown",
    namespace,
    sync: {
      mode: "sync",
      remote: remoteUrl,
      http: context?.http ?? (await createNucleumDatafnHttpOptions()),
      offlinability: false,
      crossTab: false,
      ws: false
    },
    temporal: { timezone: "user" },
    generateId: generateDatafnId
  });
  try {
    if (context && "expectedSettings" in context) {
      const currentSettings =
        await metadataClient.kv.get<NucleumDatafnE2eeSettings>(
          DATAFN_E2EE_KV_KEY
        );
      if (!compareObjects(currentSettings, context.expectedSettings)) {
        throw new Error("Remote DataFn E2EE settings changed during recovery");
      }
    }
    const result = await metadataClient.kv.set(DATAFN_E2EE_KV_KEY, settings);
    if (!result.ok) throw result.error;
  } finally {
    await metadataClient.destroy();
  }
}

function clearDatafnE2eeRecovery(
  settings: NucleumDatafnE2eeSettings
): NucleumDatafnE2eeSettings {
  const restored = { ...settings };
  delete restored.recoveryRequired;
  return restored;
}

async function resolveDatafnE2eeConfig(input: {
  namespace: string;
  remoteSettings: NucleumDatafnE2eeSettings | null;
  hasRemoteSettingsAuthority: boolean;
}): Promise<{
  settings: NucleumDatafnE2eeSettings | null;
  config?: DatafnE2eeConfig;
}> {
  const localSettings = await getLocalDatafnE2eeSettings(input.namespace);
  if (
    input.hasRemoteSettingsAuthority &&
    input.remoteSettings?.enabled === false &&
    localSettings?.enabled
  ) {
    throw new Error("Local and remote E2EE settings are inconsistent");
  }
  const settings = input.hasRemoteSettingsAuthority
    ? (input.remoteSettings ?? (localSettings?.enabled ? localSettings : null))
    : localSettings;

  if (!settings?.enabled) {
    datafnE2eeState.set({ enabled: false, unlocked: false, keyRef: null });
    return { settings: settings ?? null };
  }

  const cachedProvider = await getCachedDatafnE2eeProvider(settings);
  if (cachedProvider) {
    await persistDatafnE2eeSettings(input.namespace, settings);
    return {
      settings,
      config: { enabled: true, provider: cachedProvider }
    };
  }

  const password = requestDatafnE2eePassword("Enter your E2EE password");
  const provider = await unlockDatafnE2eeSettings(
    settings,
    password,
    input.namespace
  );
  if (!provider) throw new Error("Unable to unlock E2EE");
  return {
    settings,
    config: { enabled: true, provider }
  };
}

export async function initializeNucleumDatafn(
  input: InitializeNucleumDatafnInput
): Promise<NucleumDatafnRuntime> {
  const existing = get(runtimeStore);
  const dapId = input.dapId ?? (await getDapId()) ?? "unknown";
  const namespace = resolveDatafnNamespace({ account: input.account, dapId });
  let isOfflinabilityEnabled =
    input.isOfflinabilityEnabled ??
    (await resolveDatafnOfflinabilityPreference());
  const syncEligible = isSyncEligibleAccount(input);
  const shouldConfigureRemote =
    syncEligible && (!input.isOffline || isOfflinabilityEnabled === false);
  const candidateRemoteUrl = shouldConfigureRemote
    ? await resolveDatafnRemoteUrl(input.account)
    : null;
  const candidateHttp = candidateRemoteUrl
    ? await createNucleumDatafnHttpOptions()
    : undefined;
  const hasRemoteSettingsAuthority = Boolean(
    candidateRemoteUrl && candidateHttp && !input.isOffline
  );
  let remoteE2eeSettings =
    hasRemoteSettingsAuthority && candidateRemoteUrl && candidateHttp
      ? await readRemoteDatafnE2eeSettings({
          dapId,
          namespace,
          remoteUrl: candidateRemoteUrl,
          http: candidateHttp
        })
      : null;
  const recoverySettings = await getLocalDatafnE2eeSettings(namespace);
  if (
    recoverySettings?.enabled &&
    recoverySettings.recoveryRequired === "restore-remote" &&
    hasRemoteSettingsAuthority &&
    candidateRemoteUrl &&
    candidateHttp
  ) {
    const restoredSettings = clearDatafnE2eeRecovery(recoverySettings);
    await writeRemoteDatafnE2eeSettings(restoredSettings, {
      clientId: dapId,
      namespace,
      remoteUrl: candidateRemoteUrl,
      http: candidateHttp,
      expectedSettings: remoteE2eeSettings
    });
    await persistDatafnE2eeSettings(namespace, restoredSettings);
    remoteE2eeSettings = restoredSettings;
  }
  const e2ee = await resolveDatafnE2eeConfig({
    namespace,
    remoteSettings: remoteE2eeSettings,
    hasRemoteSettingsAuthority
  });
  const isE2eeEnabled = e2ee.settings?.enabled === true;
  if (isE2eeEnabled && !isOfflinabilityEnabled) {
    await setDatafnOfflinabilityPreference(true);
    isOfflinabilityEnabled = true;
  }
  const effectiveInput = {
    ...input,
    isOfflinabilityEnabled
  };
  const mode = resolveDatafnMode(effectiveInput);
  const isStorageBacked = mode !== "sync-direct";
  const expectedStorageDbName = resolveDatafnStorageDbName({
    product: input.product,
    namespace,
    env: input.env
  });
  const storageDbName = isStorageBacked ? expectedStorageDbName : null;
  const retiredStorageDbName =
    mode === "sync-direct" && existing?.storageDbName === expectedStorageDbName
      ? existing.storageDbName
      : null;
  const runtimeKey = `${input.product}:${namespace}:${mode}:${storageDbName ?? "direct"}:${e2ee.settings?.keyRef ?? "no-e2ee"}`;

  if (
    existing &&
    `${existing.product}:${existing.namespace}:${existing.mode}:${existing.storageDbName ?? "direct"}:${existing.e2eeKeyRef ?? "no-e2ee"}` ===
      runtimeKey
  ) {
    await refreshNucleumDatafnStatus();
    lastInitializeInput = effectiveInput;
    return existing;
  }

  if (existing) {
    if (retiredStorageDbName) {
      await assertDatafnLocalCloneCanBeRetired(existing);
    }
    await existing.destroy();
    if (get(runtimeStore) === existing) {
      runtimeStore.set(null);
    }
  }

  const bootResources = resolveDatafnBootResources(input.product);
  const backgroundResources = resolveDatafnBackgroundResources(input.product);
  nucleumDatafnStatus.set({
    ...initialStatus,
    status: "starting",
    mode: mode === "local-only" ? "local-only" : "sync",
    namespace,
    storageDbName,
    product: input.product,
    nucleumMode: mode,
    bootResources,
    backgroundResources
  });

  const storageContext = isStorageBacked
    ? createDatafnStorage({
        product: input.product,
        namespace,
        env: input.env
      })
    : null;
  const storage = storageContext?.storage;
  await migrateDatafnNodeMdChildOrder(storage);
  const remoteUrl =
    mode === "sync" || mode === "sync-direct" ? candidateRemoteUrl : null;
  const http =
    mode === "sync" || mode === "sync-direct" ? candidateHttp : undefined;

  datafnSearchProvider = isStorageBacked
    ? createNucleumClientSearchProvider({
        dbName: `${storageDbName ?? runtimeKey}-search`
      })
    : undefined;
  await datafn.switchContext({
    clientId: dapId,
    searchProvider: datafnSearchProvider ?? null,
    searchIndexVersion: resolveNucleumDatafnSearchIndexVersion(),
    namespace,
    storage: storage ?? null,
    e2ee: e2ee.config ?? null,
    sync:
      mode === "sync"
        ? {
            mode,
            remote: remoteUrl as string,
            http,
            offlinability: true,
            crossTab: true,
            ws: false,
            hydration: {
              bootResources,
              backgroundResources,
              clonePageSize: 500
            }
          }
        : mode === "sync-direct"
          ? {
              mode: "sync",
              remote: remoteUrl as string,
              http,
              offlinability: false,
              crossTab: false,
              ws: false
            }
          : { mode }
  });
  if (retiredStorageDbName) {
    await deleteDatafnLocalClone(retiredStorageDbName);
  }
  let isDestroyed = false;

  const runtime: NucleumDatafnRuntime = {
    storage,
    namespace,
    storageDbName,
    product: input.product,
    mode,
    remoteUrl,
    bootResources,
    backgroundResources,
    e2eeKeyRef: e2ee.settings?.keyRef ?? null,
    destroy: async () => {
      if (isDestroyed) return;
      isDestroyed = true;
      if (get(runtimeStore) === runtime) {
        clearNucleumDatafnStatusBinding();
      }
      await flushNucleumDatafnMutations();
      stopNucleumDatafnSync();
      await closeNucleumDatafnRuntimeStorage(storage);
      const searchProvider = datafnSearchProvider;
      try {
        await disposeNucleumDatafnSearchProvider(searchProvider);
      } finally {
        if (datafnSearchProvider === searchProvider) {
          datafnSearchProvider = undefined;
        }
      }
    }
  };

  runtimeStore.set(runtime);
  bindNucleumDatafnStatus(runtime);
  await refreshNucleumDatafnStatus();
  lastInitializeInput = effectiveInput;
  return runtime;
}

let connectivityGeneration = 0;
let connectivityTransition = Promise.resolve<
  NucleumDatafnRuntime | null | undefined
>(undefined);

export async function destroyNucleumDatafn() {
  connectivityGeneration += 1;
  await connectivityTransition.catch(() => undefined);
  const existing = get(runtimeStore);
  if (!existing) return;
  try {
    await existing.destroy();
  } finally {
    if (get(runtimeStore) === existing) {
      runtimeStore.set(null);
    }
    clearNucleumDatafnStatusBinding();
    nucleumDatafnStatus.set(initialStatus);
  }
}

function requireLastInitializeInput() {
  if (!lastInitializeInput) {
    throw new Error("DataFn runtime is not initialized");
  }
  return lastInitializeInput;
}

export async function cloneUpAllDatafnData() {
  const runtime = get(runtimeStore);
  if (!runtime || runtime.mode !== "sync") {
    throw new Error("A synchronized DataFn runtime is required for clone-up");
  }
  await datafn.sync.cloneUp({
    recordOperation: "replace",
    clearChangelogOnSuccess: true,
    setGlobalCursorOnSuccess: true,
    pullAfter: false
  });
  await refreshNucleumDatafnStatus();
}

export async function enableNucleumDatafnE2ee(password: string) {
  const initInput = requireLastInitializeInput();
  const runtime = get(runtimeStore);
  if (!runtime) throw new Error("DataFn runtime is not initialized");
  if (runtime.mode === "sync-direct") {
    throw new Error("Enable offline storage before turning on E2EE");
  }
  const previousSettings = await getLocalDatafnE2eeSettings(runtime.namespace);
  const setup = await createDatafnE2eeSetup(password, runtime.namespace);
  try {
    await writeRemoteDatafnE2eeSettings(setup.settings);
    await initializeNucleumDatafn({
      ...initInput,
      isOfflinabilityEnabled: true
    });
    await cloneUpAllDatafnData();
  } catch (error) {
    const restoredSettings =
      previousSettings ?? createDisabledDatafnE2eeSettings();
    await writeRemoteDatafnE2eeSettings(restoredSettings).catch(
      (restoreError) => {
        logger.error({
          at: "datafn.e2ee.enable.restoreRemoteSettings",
          error: restoreError
        });
      }
    );
    await disableLocalDatafnE2ee(
      setup.settings,
      runtime.namespace,
      restoredSettings
    );
    await initializeNucleumDatafn(initInput).catch((restoreError) => {
      logger.error({
        at: "datafn.e2ee.enable.restoreRuntime",
        error: restoreError
      });
    });
    throw error;
  }
  datafnE2eeState.set({
    enabled: true,
    unlocked: true,
    keyRef: setup.settings.keyRef ?? null
  });
  return setup.settings;
}

export async function changeNucleumDatafnE2eePassword(password: string) {
  const runtime = get(runtimeStore);
  if (!runtime) throw new Error("DataFn runtime is not initialized");
  const settings = await getLocalDatafnE2eeSettings(runtime.namespace);
  if (!settings?.enabled) {
    throw new Error("E2EE is not enabled");
  }
  const next = await rewrapCachedDatafnE2eeKey(
    settings,
    password,
    runtime.namespace
  );
  try {
    await writeRemoteDatafnE2eeSettings(next.settings);
    await initializeNucleumDatafn({
      ...requireLastInitializeInput(),
      isOfflinabilityEnabled: true
    });
    await cloneUpAllDatafnData();
  } catch (error) {
    await writeRemoteDatafnE2eeSettings(settings).catch((restoreError) => {
      logger.error({
        at: "datafn.e2ee.password.restoreRemoteSettings",
        error: restoreError
      });
    });
    await persistDatafnE2eeSettings(runtime.namespace, settings);
    await initializeNucleumDatafn({
      ...requireLastInitializeInput(),
      isOfflinabilityEnabled: true
    }).catch((restoreError) => {
      logger.error({
        at: "datafn.e2ee.password.restoreRuntime",
        error: restoreError
      });
    });
    throw error;
  }
  return next.settings;
}

export async function disableNucleumDatafnE2ee() {
  const initInput = requireLastInitializeInput();
  const runtime = get(runtimeStore);
  if (!runtime) throw new Error("DataFn runtime is not initialized");
  const settings = await getLocalDatafnE2eeSettings(runtime.namespace);
  const restoreProvider = await getCachedDatafnE2eeProvider(settings);
  if (settings?.enabled && !restoreProvider) {
    throw new Error("Unlock E2EE before disabling it");
  }
  const disabled = createDisabledDatafnE2eeSettings();
  await datafn.switchContext({ e2ee: null });
  try {
    await writeRemoteDatafnE2eeSettings(disabled);
    await cloneUpAllDatafnData();
    await disableLocalDatafnE2ee(settings, runtime.namespace, disabled);
  } catch (error) {
    if (settings?.enabled && restoreProvider) {
      try {
        await writeRemoteDatafnE2eeSettings(settings);
      } catch (restoreError) {
        const recoverySettings: NucleumDatafnE2eeSettings = {
          ...settings,
          recoveryRequired: "restore-remote"
        };
        await datafn.switchContext({
          e2ee: { enabled: true, provider: restoreProvider },
          sync: { mode: "local-only" }
        });
        await persistDatafnE2eeSettings(runtime.namespace, recoverySettings);
        await initializeNucleumDatafn({
          ...initInput,
          isOffline: true,
          isOfflinabilityEnabled: true
        }).catch((recoveryError) => {
          logger.error({
            at: "datafn.e2ee.disable.enterRecoveryMode",
            error: recoveryError
          });
        });
        logger.error({
          at: "datafn.e2ee.disable.restoreSettings",
          error,
          restoreError
        });
        throw restoreError;
      }
      await datafn.switchContext({
        e2ee: { enabled: true, provider: restoreProvider }
      });
      await persistDatafnE2eeSettings(runtime.namespace, settings);
    }
    throw error;
  }
  await initializeNucleumDatafn(initInput);
  return disabled;
}

export async function refreshNucleumDatafnStatus() {
  const runtime = get(runtimeStore);
  if (!runtime) {
    nucleumDatafnStatus.set(initialStatus);
    return initialStatus;
  }
  const status = await datafn.sync.refreshStatus();
  const next = resolveNucleumDatafnStatus(status, runtime);
  nucleumDatafnStatus.set(next);
  return next;
}

export async function pullDatafnNow() {
  const runtime = get(runtimeStore);
  if (!runtime || runtime.mode !== "sync") return;
  await datafn.sync.pullNow();
  await refreshNucleumDatafnStatus();
}

export async function reconcileDatafnNow() {
  const runtime = get(runtimeStore);
  if (!runtime || runtime.mode !== "sync") return;
  await datafn.sync.reconcileNow();
  await refreshNucleumDatafnStatus();
}

async function applyNucleumDatafnConnectivity(isOffline: boolean) {
  const runtime = get(runtimeStore);
  const input = lastInitializeInput;
  if (!runtime || !input) return runtime;
  const nextInput = { ...input, isOffline };
  const isE2eeEnabled = get(datafnE2eeState).enabled;
  const nextMode = resolveDatafnMode({
    ...nextInput,
    isOfflinabilityEnabled: isE2eeEnabled
      ? true
      : nextInput.isOfflinabilityEnabled
  });
  if (nextMode === runtime.mode) {
    lastInitializeInput = nextInput;
    return runtime;
  }
  return initializeNucleumDatafn(nextInput);
}

export function updateNucleumDatafnConnectivity(isOffline: boolean) {
  const generation = ++connectivityGeneration;
  const transition = connectivityTransition.then(() => {
    if (generation !== connectivityGeneration) return get(runtimeStore);
    return applyNucleumDatafnConnectivity(isOffline);
  });
  connectivityTransition = transition.catch(() => get(runtimeStore));
  return transition;
}

export async function clearDatafnLocalData() {
  const runtime = get(runtimeStore);
  if (!runtime?.storage) return;
  await datafn.clear();
  await refreshNucleumDatafnStatus();
}

async function flushNucleumDatafnMutations() {
  try {
    await datafn.flushAll();
  } catch (error) {
    logger.error({ at: "datafn.runtime.flushAll", error });
  }
}

async function assertDatafnLocalCloneCanBeRetired(
  runtime: NucleumDatafnRuntime
) {
  if (runtime.mode !== "sync") {
    throw new Error(
      "Local DataFn data cannot be retired before synchronization"
    );
  }
  await datafn.flushAll();
  const attempts = 40;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const status = await datafn.sync.refreshStatus();
    if (status.pendingChanges === 0) return;
    if (!status.online || status.status === "error") {
      throw new Error(
        status.lastError ?? "Local DataFn changes are not synchronized"
      );
    }
    await datafn.sync.schedulePush();
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Timed out while synchronizing local DataFn changes");
}

function stopNucleumDatafnSync() {
  try {
    datafn.sync.stop();
  } catch (error) {
    logger.error({ at: "datafn.runtime.stopSync", error });
  }
}

async function closeNucleumDatafnRuntimeStorage(
  storage: DatafnStorageAdapter | undefined
) {
  if (!storage) return;
  await storage.close();
}

async function deleteDatafnLocalClone(storageDbName: string) {
  await Promise.all([
    deleteIndexedDbDatabase(storageDbName),
    deleteIndexedDbDatabase(`${storageDbName}-search`)
  ]);
}

async function disposeNucleumDatafnSearchProvider(
  provider: SearchProvider | undefined
) {
  if (!provider?.dispose) return;
  await provider.dispose();
}

async function resolveDatafnRemoteUrl(account: Pick<UserAccount, "userInfo">) {
  const region =
    account.userInfo?.region ??
    (await clientStorage.get(ClientStorageKey.REGION)) ??
    "insouth";
  return `${resolveAccountBaseUrl(region).replace(/\/$/, "")}/datafn`;
}

export async function createNucleumDatafnHttpOptions(
  input: {
    publicLinkToken?: string;
  } = {}
): Promise<DatafnHttpTransportOptions> {
  return {
    auth: await createNucleumAuthFnTransportAuth({
      plugins: input.publicLinkToken
        ? [createDatafnPublicLinkAuthPlugin(input.publicLinkToken)]
        : []
    }),
    onError: ({ endpoint, status, result }) => {
      logger.error({
        at: "datafn.remote.error",
        endpoint,
        status,
        result
      });
    }
  };
}

/**
 * Configures the shared DataFn client for a read-only public-link session.
 */
export async function initializeNucleumPublicLinkDatafn(input: {
  token: string;
  region: string;
}) {
  await destroyNucleumDatafn();
  const remoteUrl = `${resolveAccountBaseUrl(input.region).replace(/\/$/, "")}/datafn`;
  await datafn.switchContext({
    clientId: `public-link-${crypto.randomUUID()}`,
    namespace: "public-link",
    storage: null,
    searchProvider: null,
    e2ee: null,
    sync: {
      mode: "sync",
      remote: remoteUrl,
      http: await createNucleumDatafnHttpOptions({
        publicLinkToken: input.token
      }),
      offlinability: false,
      crossTab: false,
      ws: false
    }
  });
}
