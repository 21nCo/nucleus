import {
  isSameResource,
  resolveProductResources
} from "@nucleum/datafn/resource.utils";
import { ObservableStore } from "@nucleum/stores/client.store";
import type { IRecordId } from "@21n/types/data.type";
import { Resource } from "@nucleum/datafn/resource.enum";
import { resourceInList } from "@nucleum/datafn/resource.utils";
import type { IRecentsStore } from "@nucleum/components/record/record.type";
import { rootNodeTypeList } from "@nucleum/features/memory/node/node.type";
import { logger } from "@nucleum/client/runtime/logging/logger";
import { appStore } from "@nucleum/stores/app.store";
import { datafn } from "@nucleum/datafn/datafn.store";
import { get } from "svelte/store";

function resolveTimestamp(value: unknown): Date | null {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export class RecentsStore extends ObservableStore<IRecentsStore> {
  private readonly LIMIT = 20;
  constructor() {
    super("records-recents");
    this.set({ recents: [], isInitialized: false });
  }

  async refresh(resources: Resource[]) {
    let recents: { type: Resource; record: any; timestamp: Date }[] = [];
    for (const resource of resources) {
      try {
        const data = await this.recents(resource);
        recents = [
          ...recents,
          ...data.flatMap((x) => {
            const timestamp = resolveTimestamp(x.updatedAt);
            if (!timestamp) return [];
            return [
              {
                type: resource,
                record: x,
                timestamp
              }
            ];
          })
        ];
      } catch (error) {
        logger.error({ at: "recentsStore.refresh", resource }, error);
      }
    }
    this.set({ recents, isInitialized: true });
  }

  resolve(params?: { type?: Resource; exclude?: IRecordId[] }) {
    const recents = this.get()
      .recents.map((entry) => ({
        ...entry,
        timestamp: resolveTimestamp(entry.timestamp)
      }))
      .filter((entry) => entry.record && entry.timestamp);
    if (params?.type && params.type !== Resource.everything) {
      return recents
        .filter((x) => x.type === params.type)
        .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime())
        .map((x) => x.record)
        .filter((x) => !params.exclude?.some(resourceInList(x.id)));
    }
    return recents
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime())
      .map((x) => x.record);
  }

  add(record: any, params: { type: Resource; timestamp: Date }) {
    const timestamp = resolveTimestamp(params.timestamp);
    if (!timestamp) return;
    this.update((x) => {
      const filteredRecents = x.recents.filter(
        (y) => !isSameResource(y.record, record)
      );
      return {
        ...x,
        recents: [
          {
            type: params.type,
            timestamp,
            record
          },
          ...filteredRecents
        ]
      };
    });
  }

  private async recents(resource?: Resource) {
    let data: any[] = [];
    if (resource === Resource.everything) {
      const resources = resolveProductResources(get(appStore).product);
      if (!resources) return [];
      for (const resource of resources) {
        const resourceData = await this.recentResources(resource);
        data = [...data, ...(resourceData ?? [])];
      }
    } else if (resource) {
      data = (await this.recentResources(resource)) ?? [];
    }
    return data;
  }

  private async recentResources(resource: Resource) {
    const queryResult = (await datafn.table(resource).query({
      sort: ["-updatedAt"],
      limit: this.LIMIT,
      metadata: {
        includeTrashed: false,
        includeArchived: false
      }
    } as any)) as { data?: any[] };
    const result = queryResult.data ?? [];
    logger.log({ at: "recentResources", resource, result });
    return result;
  }
}

export const recentsStore = new RecentsStore();
