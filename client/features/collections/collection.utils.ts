import {
  CollectionType,
  type ICollectionExpanded,
  type ICollectionItem
} from "@nucleum/features/collections/collection.type";
import type { IRecordId } from "@nucleum/schema/legacy/data.type";
import type { IProperty } from "@nucleum/features/collections/properties/property.type";
import { PropertyType } from "@nucleum/features/collections/properties/property.type";
import {
  resolvePropertyOptions as _resolvePropertyOptions,
  resolveUniversalPropertyOptions
} from "@nucleum/features/collections/properties/property.utils";
import {
  isNoneResource,
  resourceInList
} from "@nucleum/datafn/resource.utils";
import type { ISelectItem } from "@21n/elements/select/select.type";
import { Resource } from "@nucleum/datafn/resource.enum";
import { Product } from "@nucleum/client/config/product.type";
import type { IAvatar } from "@21n/elements/avatarPicker/avatar.type";
import { datafn } from "@nucleum/datafn/datafn.store";

export const UNASSIGNED_VALUE = "unassigned";
export const UNASSIGNED_LABEL = "Unassigned";

function resolveGroupingCountKey(value: unknown) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return value.toString();
  }
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === "object") return JSON.stringify(value);
  return UNASSIGNED_VALUE;
}

export function resolveCollectionTypeIcon(type: CollectionType) {
  switch (type) {
    case CollectionType.UNTYPED:
      return "collection";
    case CollectionType.TYPED:
      return "cube";
    case CollectionType.QUERY:
      return "ph:database-light";
    case CollectionType.SYNCED:
      return "sync";
  }
}

export function resolveCollectionTypeLabel(type: CollectionType) {
  switch (type) {
    case CollectionType.UNTYPED:
      return "Simple";
    case CollectionType.TYPED:
      return "Typed";
    case CollectionType.QUERY:
      return "Query";
    case CollectionType.SYNCED:
      return "Synced";
  }
}

export interface IPropertyOption extends ISelectItem {
  color?: number;
}

export function calculateGroupingCounts(
  data: ICollectionItem[],
  propertyId: IRecordId
): Map<string, number> {
  if (!data) return new Map<string, number>();

  const counts = new Map<string, number>();
  counts.set(UNASSIGNED_VALUE, 0);

  if (propertyId) {
    data.forEach((node) => {
      const prop = node.propertyValues?.find(resourceInList(propertyId))?.value;
      if (!prop || prop === UNASSIGNED_VALUE) {
        counts.set(UNASSIGNED_VALUE, (counts.get(UNASSIGNED_VALUE) || 0) + 1);
      } else if (Array.isArray(prop)) {
        prop.forEach((value) => {
          const key = resolveGroupingCountKey(value);
          counts.set(key, (counts.get(key) || 0) + 1);
        });
      } else {
        const key = resolveGroupingCountKey(prop);
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    });
  }
  return counts;
}

export function filterNodesByPropertyValue(
  data: ICollectionItem[],
  propertyId: IRecordId,
  value: string
): ICollectionItem[] {
  if (value === UNASSIGNED_VALUE) {
    return data?.filter((node: ICollectionItem) => {
      const propValue = node.propertyValues?.find(resourceInList(propertyId));
      return (
        !propValue ||
        propValue.value === UNASSIGNED_VALUE ||
        (Array.isArray(propValue.value) && propValue.value.length === 0)
      );
    });
  }
  return data?.filter((node: ICollectionItem) => {
    const prop = node.propertyValues?.find(resourceInList(propertyId));
    if (!prop?.value) return false;
    if (Array.isArray(prop.value)) {
      return prop.value.includes(value);
    }
    return prop.value === value;
  });
}

/**
 * @param id - The id of the property to resolve options for. - comes from view.groupBy or view.subGroupBy or view.tabBy
 * @param properties - All properties in the collection.
 * @param counts - The counts of items in the collection grouped by property options.
 * @param additionalParams - The additional parameters to resolve options for.
 * @returns resolved options for a grouping property
 */
export function resolveOptionsForGrouping(
  id: IRecordId,
  properties: IProperty[],
  counts: Map<string, number>,
  additionalParams: { isBoardView?: boolean } = {}
): IPropertyOption[] {
  if (isNoneResource(id) || !properties?.find(resourceInList(id))) return [];

  const property = properties?.find(resourceInList(id));
  if (!property) return [];

  const unassignedOption = {
    label: UNASSIGNED_LABEL,
    value: UNASSIGNED_VALUE
  };
  let propertyOptions = [];
  if (property.type === PropertyType.UNIVERSAL && property.config?.type) {
    propertyOptions = resolveUniversalPropertyOptions(property.config.type);
    const filteredOptions = propertyOptions
      .filter((option) => {
        const count = counts.get(option.id?.toLowerCase());
        return count && count > 0;
      })
      .map((option) => ({
        label: `${option.icon ? option.icon + " " : ""}${option.label}`,
        value: option.id?.toLowerCase(),
        color: option.color
      }));
    if (additionalParams.isBoardView) {
      return [unassignedOption, ...filteredOptions];
    } else return filteredOptions;
  } else {
    propertyOptions = _resolvePropertyOptions(id, properties, additionalParams);
    const filteredOptions = propertyOptions.filter((option) => {
      const count = counts.get(resolveGroupingCountKey(option.value));
      return count && count > 0;
    });
    if (additionalParams.isBoardView) {
      return [unassignedOption, ...filteredOptions];
    } else return filteredOptions;
  }
}

export function resolveCollectionSubTypesForSwitcher() {
  const collectionTypes = [
    CollectionType.UNTYPED,
    CollectionType.TYPED
    // CollectionType.QUERY
  ].map((x) => {
    return {
      label: resolveCollectionTypeLabel(x),
      value: x.toLowerCase(),
      icon: resolveCollectionTypeIcon(x)
    };
  });
  return collectionTypes;
}

/**
 * TODO - resolve from product config instead
 * @param product
 * @returns
 */
export function resolveCollectionResource(product: Product): Resource[] {
  switch (product) {
    case Product.POINTRON:
      return [Resource.objective];
    case Product.MEMOTRON:
      return [Resource.node];
    case Product.NUCLEUM:
      return [Resource.node, Resource.objective];
    default:
      return [];
  }
}

export async function resolveCollectionTypes(
  collections: IRecordId[],
  isFromExtension: boolean = false
): Promise<ICollectionExpanded[]> {
  if (!collections || collections.length === 0) return [];

  if (isFromExtension) {
    const collectionResult = await datafn.collection.query({
      select: ["*", "properties.*", "typeToExtend.*"],
      filters: {
        id: collections[0].toString()
      },
      limit: 1
    } as any);
    const result = collectionResult.data?.[0] as
      | (ICollectionExpanded & {
          properties?: (IRecordId | IProperty)[];
          typeToExtend?: IRecordId | ICollectionExpanded;
        })
      | undefined;
    if (!result || result.type !== CollectionType.TYPED) return [];
    if (!result.properties && !result.typeToExtend) return [result];

    let typeToExtend: ICollectionExpanded | undefined;
    const typeToExtendId = result.typeToExtend;
    if (typeof typeToExtendId === "string") {
      const extensionResult = await datafn.collection.query({
        select: ["*", "properties.*"],
        filters: {
          id: typeToExtendId.toString()
        },
        limit: 1
      } as any);
      typeToExtend = extensionResult.data?.[0] as
        | ICollectionExpanded
        | undefined;
    } else if (result.typeToExtend && typeof result.typeToExtend === "object") {
      typeToExtend = result.typeToExtend as ICollectionExpanded;
    }

    const propertyIds = (result.properties ?? []).map((property) =>
      typeof property === "string" ? property : property.id
    );
    const extendedPropertyIds = (typeToExtend?.properties ?? []).map(
      (property) => (typeof property === "string" ? property : property.id)
    ) as IRecordId[];
    const propertiesResult = await datafn.property.query({
      filters: {
        id: { $in: [...propertyIds, ...extendedPropertyIds] }
      }
    });
    const properties = (propertiesResult.data ?? []) as IProperty[];
    if (!typeToExtend) return [{ ...result, properties }];
    const mainProps = result.properties
      ?.map((propertyRef) => {
        const id =
          typeof propertyRef === "string" ? propertyRef : propertyRef.id;
        const resolvedProperty = properties.find(resourceInList(id));
        return resolvedProperty ? { ...resolvedProperty } : undefined;
      })
      .filter(Boolean) as IProperty[] | undefined;
    const extendedProps = typeToExtend.properties
      ?.map((propertyRef) => {
        const id =
          typeof propertyRef === "string" ? propertyRef : propertyRef.id;
        const property = properties.find(resourceInList(id));
        return property ? { ...property } : undefined;
      })
      .filter(Boolean) as IProperty[] | undefined;
    return [
      {
        ...result,
        properties: mainProps,
        typeToExtend,
        extendProperties: extendedProps
      }
    ];
  }

  const result = await datafn.collection.query({
    select: ["*", "properties.*", "typeToExtend.*"],
    filters: {
      id: { $in: collections.map((id) => id.toString()) }
    }
  } as any);
  const types = ((result.data ?? []) as ICollectionExpanded[]).filter(
    (collection) => collection.type === CollectionType.TYPED
  );
  if (types.length === 0) return [];
  const extendPropertyIds = types
    .flatMap((collection) => collection.typeToExtend?.properties ?? [])
    .map((property) => (typeof property === "string" ? property : property.id))
    .filter((id): id is IRecordId => Boolean(id));
  if (extendPropertyIds.length > 0) {
    const extendPropertiesResult = await datafn.property.query({
      filters: {
        id: {
          $in: extendPropertyIds
        }
      }
    });
    const extendProperties = (extendPropertiesResult.data ?? []) as IProperty[];
    types.forEach((collection) => {
      if (!collection.typeToExtend) return;
      collection.extendProperties = extendProperties.filter((property) =>
        collection.typeToExtend?.properties?.some(resourceInList(property.id))
      );
    });
  }
  return types;
}

export function resolveAvatar(types: ICollectionExpanded[]) {
  const avatars = types
    ?.flatMap((x) => [x.avatar])
    .filter((a) => a) as IAvatar[];
  const baseAvatars = types
    ?.flatMap((x) => [x.typeToExtend?.avatar])
    .filter((a) => a) as IAvatar[];
  if (baseAvatars.length > 0) {
    return baseAvatars;
  } else {
    return avatars;
  }
}
