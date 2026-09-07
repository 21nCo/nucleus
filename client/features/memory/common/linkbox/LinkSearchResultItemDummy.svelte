<script lang="ts">
  import { type INode } from "@nucleum/features/memory/node/node.type";
  import type { ICollectionThumb } from "@nucleum/features/collections/collection.type";
  import type { IObjectiveThumb } from "@nucleum/features/focus/goals/goal.type";
  import LinkSearchResultItem from "@nucleum/features/memory/common/linkbox/LinkSearchResultItem.svelte";
  import type { Resource } from "@nucleum/datafn/resource.enum";
  let {
    item,
    isHideResourceType = false,
    resourceType
  }: {
    item: INode | ICollectionThumb | IObjectiveThumb;
    isHideResourceType?: boolean;
    resourceType: Resource;
  } = $props();
</script>

<LinkSearchResultItem {item} {isHideResourceType} {resourceType} />
