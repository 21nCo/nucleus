<script lang="ts">
  import { datafn } from "@nucleum/datafn/datafn.store";
  import {
    determineResourceType,
    isSameResource,
    resourceInList
  } from "@nucleum/datafn/resource.utils";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import type {
    ICollectionItem,
    ICollectionItemPropertyValue
  } from "@nucleum/features/collections/collection.type";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import type {
    IProperty,
    IPropertyValue
  } from "@nucleum/features/collections/properties/property.type";
  import PropertyItem from "@nucleum/features/collections/properties/PropertyItem.svelte";

  let {
    item,
    values = [],
    properties = [],
    accessPoint = ResourceAccessPoint.BROWSER,
    collectionId = undefined
  }: {
    item: { id: IRecordId };
    values?: ICollectionItemPropertyValue[];
    properties?: IProperty[];
    accessPoint?: ResourceAccessPoint;
    collectionId?: IRecordId | undefined;
  } = $props();
  const propertyItem = $derived(item as unknown as ICollectionItem);

  async function propagateChanges(
    propertyId: IRecordId,
    value: IPropertyValue | null
  ) {
    const existingProperty = values?.find(resourceInList(propertyId));
    const resolvedCollectionId = collectionId ?? existingProperty?.collectionId;
    values = values?.filter((x) => !isSameResource(x, propertyId)) ?? [];
    const property = {
      id: propertyId,
      collectionId: resolvedCollectionId,
      value
    };
    values = [...values, property];
    const resourceType = determineResourceType(item.id);
    if (resourceType === Resource.unknown) return;
    await datafn.table(resourceType).mutate({
      operation: "relate",
      id: item.id.toString(),
      relations: {
        propertyValues: [
          {
            $ref: propertyId.toString(),
            fromResource: resourceType.toString(),
            ...(resolvedCollectionId
              ? { collectionId: resolvedCollectionId.toString() }
              : {}),
            value
          }
        ]
      },
      debounceKey: "property" + propertyId.toString(),
      debounceMs: 1500
    });
  }

  function stopClickPropagation(node: HTMLElement) {
    const handleClick = (event: MouseEvent) => event.stopPropagation();
    node.addEventListener("click", handleClick);
    return {
      destroy() {
        node.removeEventListener("click", handleClick);
      }
    };
  }
</script>

<div
  class="flex gap-3 flex-wrap items-center userdata"
  use:stopClickPropagation
>
  {#each properties as property (property.id)}
    <PropertyItem
      value={values?.find(resourceInList(property))?.value}
      {property}
      item={propertyItem}
      onChange={(e) => {
        propagateChanges(property.id, e.detail);
      }}
      context={accessPoint === ResourceAccessPoint.COLLECTION
        ? "collectionView"
        : "default"}
    />
  {/each}
</div>
