import { get } from "svelte/store";
import { ExtensionEvent } from "$lib/client/types/extension.type";
import { relayToSidePanel } from "$lib/client/utils/extension.utils";
import { ClientStorageKey } from "$lib/client/persistence/persistence.type";
import { clientStorage } from "$lib/client/persistence/persistence.utils";
import { getDapId } from "$lib/client/persistence/persistence.utils";
import { logger } from "$lib/client/components/debug/logger.client";
import { Resource } from "@nucleum/datafn/resource.enum";
import type { Extension } from "$lib/client/products/product.type";
import { appStore } from "$lib/client/stores/app.store";
import account from "$lib/client/stores/account.store";
import {
  datafn,
  datafnRuntime,
  initializeNucleumDatafn,
  pullDatafnNow,
  reconcileDatafnNow
} from "@nucleum/datafn/datafn.store";
import { determineResourceType } from "@nucleum/datafn/resource.utils";
import type { IRecordId } from "$lib/client/types/data.type";

type DatafnExtensionSearchParams = {
  query: string;
  fields?: string[];
  type?: string;
};

type DatafnExtensionSelectParams = {
  filters?: Record<string, unknown>;
  limit?: number;
  offset?: number;
  search?: DatafnExtensionSearchParams;
  select?: string[];
  sort?: string[];
};

type DatafnExtensionMutationFragment = {
  operation: string;
  id?: IRecordId;
  record?: Record<string, unknown>;
  relations?: Record<string, unknown>;
  context?: string;
};

type DatafnExtensionMutation =
  | DatafnExtensionMutationFragment
  | DatafnExtensionMutationFragment[];

export enum DatafnExtensionMethod {
  PULL = "pull",
  RECONCILE = "reconcile",
  SELECT_MANY = "selectMany",
  SELECT = "select",
  MUTATION = "mutation",
  KV_MERGE = "kvMerge"
}

export type IDatafnExtensionMethod =
  | {
      method: DatafnExtensionMethod.SELECT_MANY;
      args: {
        resource: Resource;
        params?: DatafnExtensionSelectParams;
        signal?: AbortSignal;
      };
    }
  | {
      method: DatafnExtensionMethod.SELECT;
      args: {
        resourceId: IRecordId;
        select?: string[];
        signal?: AbortSignal;
      };
    }
  | {
      method: DatafnExtensionMethod.MUTATION;
      args: {
        resource: Resource;
        params: DatafnExtensionMutation;
        additionalParams?: {
          context?: string;
        };
      };
    }
  | {
      method: DatafnExtensionMethod.KV_MERGE;
      args: {
        resource: Resource;
        data: Record<string, unknown>;
      };
    }
  | {
      method: DatafnExtensionMethod.PULL;
      args?: {
        isReturnCount?: boolean;
      };
    }
  | {
      method: DatafnExtensionMethod.RECONCILE;
      args?: {
        counts?: Record<string, number>;
      };
    };

export class ExtensionStore {
  static _extension: ExtensionStore | null = null;

  private constructor(_product?: Extension) {}

  static getInstance(product?: Extension) {
    if (ExtensionStore._extension) return ExtensionStore._extension;
    ExtensionStore._extension = new ExtensionStore(product);
    return ExtensionStore._extension;
  }

  async bootup(extension: Extension) {
    try {
      await this.initializeDatafn();
      await clientStorage.set(ClientStorageKey.EXTENSION_BOOTUP, {
        inProgress: true
      });
      await clientStorage.set(ClientStorageKey.PRODUCT, extension);
      await this.pullLatest();
      relayToSidePanel({
        event: ExtensionEvent.BOOTUP
      });
    } catch (error) {
      logger.error({
        at: "ExtensionStore.bootup",
        error
      });
    } finally {
      await clientStorage.set(ClientStorageKey.EXTENSION_BOOTUP, {
        inProgress: false
      });
    }
  }

  async initializeDatafn() {
    const dapId = await getDapId();
    await initializeNucleumDatafn({
      product: get(appStore).product,
      account: get(account),
      dapId: dapId ?? undefined,
      env: import.meta.env.MODE
    });
  }

  pullLatest() {
    return pullDatafnNow();
  }

  reconcile() {
    return reconcileDatafnNow();
  }

  async delegateDatafn(method: IDatafnExtensionMethod) {
    const runtime = get(datafnRuntime);
    if (!runtime) {
      await this.initializeDatafn();
    }
    switch (method.method) {
      case DatafnExtensionMethod.PULL:
        await pullDatafnNow();
        return { counts: {} };
      case DatafnExtensionMethod.RECONCILE:
        await reconcileDatafnNow();
        return true;
      case DatafnExtensionMethod.SELECT_MANY:
        return this.selectMany(
          method.args.resource,
          method.args.params,
          method.args.signal
        );
      case DatafnExtensionMethod.SELECT:
        return this.select(
          method.args.resourceId,
          method.args.select,
          method.args.signal
        );
      case DatafnExtensionMethod.MUTATION:
        return this.mutation(
          method.args.resource,
          method.args.params,
          method.args.additionalParams
        );
      case DatafnExtensionMethod.KV_MERGE:
        return this.kvMerge(method.args.resource, method.args.data);
    }
  }

  private async selectMany(
    resource: Resource,
    params?: DatafnExtensionSelectParams,
    signal?: AbortSignal
  ) {
    const searchQuery = params?.search?.query?.trim();
    if (params && searchQuery) {
      const selectParams = params;
      const search = params.search;
      if (!search) return [];
      const result = (await datafn.search({
        query: searchQuery,
        resources: [resource],
        fields: search.fields,
        filters: selectParams.filters
          ? { [resource]: selectParams.filters }
          : undefined,
        limit: selectParams.limit ?? 100,
        limitPerResource: selectParams.limit ?? 100,
        select: selectParams.select,
        prefix: true,
        fuzzy: 0.2,
        source: "local",
        signal
      })) as { results?: { data: unknown }[] };
      return (result.results ?? []).map((entry: any) => entry.data);
    }
    const result = await datafn.table(resource).query({
      filters: params?.filters as any,
      select: params?.select,
      limit: params?.limit,
      offset: params?.offset,
      sort: params?.sort,
      signal
    });
    return result.data ?? [];
  }

  private async select(
    resourceId: IRecordId,
    select?: string[],
    signal?: AbortSignal
  ) {
    if (typeof resourceId === "string" && resourceId.startsWith("kv:")) {
      return datafn.kv.get(resourceId.replace(/^kv:/, ""));
    }
    const resource = determineResourceType(resourceId);
    const result = await datafn.table(resource).query({
      filters: { id: resourceId },
      select,
      signal
    });
    return result?.data?.[0];
  }

  private async mutation(
    resource: Resource,
    params: DatafnExtensionMutation,
    additionalParams?: { context?: string }
  ) {
    return this.tableMutation(resource, params, additionalParams);
  }

  private async tableMutation(
    resource: Resource,
    params: DatafnExtensionMutation,
    additionalParams?: { context?: string }
  ) {
    const table = datafn.table(resource);
    const resolveContext = (mutation: DatafnExtensionMutationFragment) => ({
      ...mutation,
      context: mutation.context ?? additionalParams?.context
    });
    return table.mutate(
      (Array.isArray(params)
        ? params.map(resolveContext)
        : resolveContext(params)) as any
    );
  }

  private kvMerge(resource: Resource, data: Record<string, unknown>) {
    return datafn.kv.merge(resource.toString(), data);
  }
}

export function extensionDatafn(method: IDatafnExtensionMethod) {
  return ExtensionStore.getInstance().delegateDatafn(method);
}
