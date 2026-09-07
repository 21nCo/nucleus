<script lang="ts">
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import {
    isSameResource,
    resourceInList
  } from "@nucleum/datafn/resource.utils";
  import type { IRecordId } from "@21n/types/data.type";
  import type { IProperty } from "@nucleum/features/collections/properties/property.type";
  import PropertyItem from "@nucleum/features/collections/properties/PropertyItem.svelte";
  import { ActiveNodeStore } from "@nucleum/features/memory/node/node.store";
  import type { INodePropertyValue } from "@nucleum/features/memory/node/node.type";
  import { datafn } from "@nucleum/datafn/datafn.store";
  let {
    values = [],
    properties = [],
    accessPoint = ResourceAccessPoint.BROWSER,
    nodeId
  }: {
    values?: INodePropertyValue[];
    properties?: IProperty[];
    accessPoint?: ResourceAccessPoint;
    nodeId: IRecordId;
  } = $props();
  let node = ActiveNodeStore.resolve(nodeId);
  async function propagateChanges(id: IRecordId, value: any) {
    values = values?.filter((x) => !isSameResource(x, id)) ?? [];
    const newValue = {
      id,
      value
    };
    values = [...values, newValue];
    await datafn.node.mutate({
      operation: "relate",
      id: nodeId,
      relations: {
        propertyValues: [
          {
            $ref: id.toString(),
            fromResource: "node",
            value
          }
        ]
      },
      debounceKey: "property" + id.toString(),
      debounceMs: 1500
    } as any);
  }
</script>

<button
  class="flex gap-3 flex-wrap items-center userdata"
  onclick={(event) => event.stopPropagation()}
>
  {#each properties as property (property.id)}
    <PropertyItem
      value={values?.find(resourceInList(property))?.value}
      {property}
      item={$node}
      onChange={(e) => {
        propagateChanges(property.id, e.detail);
      }}
      context={accessPoint === ResourceAccessPoint.COLLECTION
        ? "collectionView"
        : "default"}
    />
  {/each}
</button>
