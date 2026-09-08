<script lang="ts">
  import ComingSoonView from "@21n/elements/ComingSoonView.svelte";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import {
    CollectionLayout,
    type ICollectionItem,
    type ICollectionView
  } from "@nucleum/features/collections/collection.type";
  import { Arrangement } from "@21n/elements/direction.enum";
  import { isValidArrayWithData } from "@21n/shared-utils/obj.utils";
  import BoardView from "@nucleum/features/collections/boardView/BoardView.svelte";
  import type { IActiveCollectionStore } from "./collection.store";
  let {
    collection,
    view = $bindable(),
    data = [],
    isBoardOverflow = false
  }: {
    collection: IActiveCollectionStore;
    view: ICollectionView;
    data?: ICollectionItem[];
    isBoardOverflow?: boolean;
  } = $props();

  $effect(() => {
    if (!view.arrangement) {
      view.arrangement = Arrangement.LIST;
    }
  });
</script>

{#if isValidArrayWithData(data)}
  {#if view.layout === CollectionLayout.BOARD}
    <BoardView {view} {data} {isBoardOverflow} {collection} />
  {:else}
    <ComingSoonView subText="View not built yet. Stay tuned." />
  {/if}
{:else}
  <EmptyStatusView subText="No records match the criteria." />
{/if}
