import { ActiveResourceStore } from "@nucleum/components/record/active-resource.store";
import type { IRecordId } from "@21n/types/data.type";
import {
  determineResourceType,
  isSameResource
} from "@nucleum/datafn/resource.utils";
import type {
  ICollectible,
  ICollectionExpanded,
  ICollectionItemPropertyValue
} from "@nucleum/features/collections/collection.type";
import { logger } from "@nucleum/client/runtime/logging/logger";
import { isValidArrayWithData } from "@21n/shared-utils/obj.utils";
import {
  resolveAvatar,
  resolveCollectionTypes
} from "@nucleum/features/collections/collection.utils";
import { Resource } from "@nucleum/datafn/resource.enum";
import { datafn } from "@nucleum/datafn/datafn.store";
import type {
  IActiveResource,
  IResource
} from "@nucleum/datafn/resource.type";

function resolveResourceKey(item: unknown): string | undefined {
  if (!item) return undefined;
  if (typeof item === "string") return item;
  if (typeof item === "object") {
    if ("tb" in item && "id" in item) {
      const tb = item.tb;
      const id = item.id;
      if (typeof tb === "string" && id !== undefined && id !== null) {
        return `${tb}:${id}`;
      }
    }
    if ("id" in item) {
      return resolveResourceKey(item.id);
    }
  }
  try {
    return String(item);
  } catch {
    return undefined;
  }
}

export class CollectibleStore<
  T extends IResource & ICollectible,
  V extends IActiveResource & ICollectible
> extends ActiveResourceStore<T, V> {
  async linkCollection(id: IRecordId, src?: IRecordId) {
    const resource = this.get();
    const previousCollections = resource.collections ?? [];
    const collections = [...previousCollections, id];
    this.update((prev) => ({ ...prev, collections }) as V);
    const sourceId = src ?? resource.id;
    const resourceType = determineResourceType(sourceId);
    if (resourceType === Resource.unknown) return undefined;
    let result;
    try {
      result = await datafn.table(resourceType).mutate({
        operation: "relate",
        id: sourceId.toString(),
        relations: {
          collections: [
            {
              $ref: id.toString(),
              fromResource: resourceType.toString()
            }
          ]
        }
      });
    } catch (error) {
      this.update(
        (prev) => ({ ...prev, collections: previousCollections }) as V
      );
      await this.refreshTypes();
      throw error;
    }
    try {
      await this.refreshTypes();
    } catch (error) {
      logger.error({
        at: "CollectibleStore.linkCollection.refreshTypes",
        error
      });
    }
    return result;
  }

  async unlinkCollection(id: IRecordId, src?: IRecordId) {
    const resource = this.get();
    const previousCollections = resource.collections ?? [];
    const collectionId = resolveResourceKey(id);
    const collections = previousCollections.filter(
      (item) => resolveResourceKey(item) !== collectionId
    );
    this.update((prev) => ({ ...prev, collections }) as V);
    try {
      const sourceId = src ?? resource.id;
      const resourceType = determineResourceType(sourceId);
      if (resourceType !== Resource.unknown) {
        await datafn.table(resourceType).mutate({
          operation: "unrelate",
          id: sourceId.toString(),
          relations: {
            collections: [id]
          }
        });
      }
    } catch (error) {
      this.update(
        (prev) => ({ ...prev, collections: previousCollections }) as V
      );
      await this.refreshTypes();
      throw error;
    }
    try {
      await this.refreshTypes();
    } catch (error) {
      logger.error({
        at: "CollectibleStore.unlinkCollection.refreshTypes",
        error
      });
    }
  }

  protected async refreshTypes() {
    const self = this.get();
    const collections = self.collections;
    if (!collections || collections.length === 0) {
      this.update((n) => ({ ...n, types: [] }));
      return;
    }
    const types = await resolveCollectionTypes(collections);
    // const avatar = await this.refreshAvatar(self.id, {
    //   types
    // });
    this.update((n) => ({ ...n, types }));
  }

  /**
   * @deprecated - using collections array at record source instead to avoid duplicate avatar, other type inherited settings for nodes, goals etc.
   * @param id
   * @param params
   * @returns
   */
  async refreshAvatar(
    id: IRecordId,
    params: {
      collections?: IRecordId[];
      types?: ICollectionExpanded[];
    }
  ) {
    logger.log({
      at: "CollectibleStore.refreshAvatar",
      params
    });
    let types = params?.types;
    if (!types && params.collections) {
      types = await resolveCollectionTypes(params.collections);
    }
    if (!types || !isValidArrayWithData(types)) return;
    const avatar = resolveAvatar(types);
    const resourceType = determineResourceType(id);
    if (resourceType !== Resource.unknown) {
      await datafn.table(resourceType).mutate({
        operation: "merge",
        id: id.toString(),
        record: { avatar },
        system: true
      });
    }
    return avatar;
  }

  updateProperty = async (property: ICollectionItemPropertyValue) => {
    const resource = this.get();
    let propertyValues = this.get().propertyValues ?? [];
    propertyValues = propertyValues.filter((x) => !isSameResource(x, property));
    this.update((prev) => ({
      ...prev,
      propertyValues: [...propertyValues, property]
    }));
    const resourceType = determineResourceType(resource.id);
    if (resourceType === Resource.unknown) return undefined;
    return datafn.table(resourceType).mutate({
      operation: "relate",
      id: resource.id.toString(),
      relations: {
        propertyValues: [
          {
            $ref: property.id.toString(),
            fromResource: resourceType.toString(),
            collectionId: property.collectionId,
            value: property.value
          }
        ]
      },
      debounceKey: "property" + property.id.toString(),
      debounceMs: 1500
    });
  };
}
