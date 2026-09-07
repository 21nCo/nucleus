<script lang="ts">
  import { Arrangement } from "@21n/elements/direction.enum";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import type { IProperty } from "@nucleum/features/collections/properties/property.type";
  import NodeRecords from "@nucleum/features/memory/node/NodeRecords.svelte";
  import type { ICollectionItem } from "@nucleum/features/collections/collection.type";
  import type { INodeThumb } from "@nucleum/features/memory/node/node.type";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import Records from "@nucleum/application/record/Records.svelte";

  let {
    items = [],
    resource = undefined,
    arrangement = Arrangement.LIST,
    density = 1,
    isHidePreview = false,
    isHideTitle = false,
    parentBgIndex = 1,
    isApplyCustomColor = false,
    isDraggable = false,
    accessPointId = undefined,
    accessPoint = undefined,
    visibleProps = []
  }: {
    items?: ICollectionItem[];
    resource?: Resource | undefined;
    arrangement?: Arrangement;
    density?: number;
    isHidePreview?: boolean;
    isHideTitle?: boolean;
    parentBgIndex?: number;
    isApplyCustomColor?: boolean;
    isDraggable?: boolean;
    accessPointId?: IRecordId | undefined;
    accessPoint?: ResourceAccessPoint | undefined;
    visibleProps?: IProperty[];
  } = $props();

  let isMasonryAvailable = $derived(
    !resource || [Resource.node].includes(resource)
  );

  function resolveNodeItems() {
    return items as unknown as INodeThumb[];
  }
</script>

{#if isMasonryAvailable}
  <NodeRecords
    nodes={resolveNodeItems()}
    {arrangement}
    {isHidePreview}
    {isHideTitle}
    {density}
    {isDraggable}
    {accessPointId}
    {accessPoint}
    {isApplyCustomColor}
    {visibleProps}
    {parentBgIndex}
  />
{:else}
  <Records
    {resource}
    data={items}
    {arrangement}
    {accessPoint}
    {visibleProps}
  />
{/if}
