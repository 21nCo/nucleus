<script lang="ts">
  import CollectionItem from "@nucleum/extensions/clipper/sidePanel/collectionsOnClipper/CollectionItem.svelte";
  import type { CollectionData } from "@nucleum/extensions/clipper/sidePanel/collectionsOnClipper/types";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import ScrollViewBottomSpacer from "@21n/layout/scrollView/ScrollViewBottomSpacer.svelte";

  let {
    collections,
    onCollectionClick = undefined
  }: {
    collections: CollectionData[];
    onCollectionClick?: ((collection: CollectionData) => void) | undefined;
  } = $props();
</script>

<div class="flex-1 overflow-y-auto">
  {#if collections.length === 0}
    <EmptyStatusView
      mainText="No collections found"
      subText="Only collections that has web page nodes will be shown here."
      isSearchContext={true}
    />
  {:else}
    <div class="p-3 space-y-1">
      {#each collections as collection (collection.id)}
        <CollectionItem {collection} onclick={onCollectionClick} />
      {/each}
      <ScrollViewBottomSpacer />
    </div>
  {/if}
</div>
