<script lang="ts">
  import {
    AccessMode,
    ResourceAccessPoint
  } from "@nucleum/datafn/resource.type";
  import Collection from "@nucleum/features/collections/Collection.svelte";
  let {
    id,
    accessPoint = ResourceAccessPoint.SELF,
    parentBgIndex = 1,
    accessMode = AccessMode.POP
  }: {
    id: any;
    accessPoint?: ResourceAccessPoint;
    parentBgIndex?: number;
    accessMode?: AccessMode;
  } = $props();
  // TODO - This component is created to resolve issue of actionMap item for Resource.collection -> component is resolving as undefined when directly using Collection.svelte for some reason. Need to find the root cause and fix it.
</script>

<Collection {id} {accessPoint} {parentBgIndex} {accessMode} />
