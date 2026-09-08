<script lang="ts">
  import { onMount, tick } from "svelte";
  import { vTrail } from "../topNav/tabs/tabs.store";
  import ResourceResolver from "@21n/layout/paint/ResourceResolver.svelte";
  import { AccessMode } from "@nucleum/datafn/resource.type";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import type { Action } from "@nucleum/client/config/action.enum";
  const ITEM_WIDTH =
    (typeof window !== "undefined" ? window.innerWidth : 1200) - 300;
  const VISIBLE_ITEMS = 3;

  let containerRef: HTMLDivElement;
  let virtualScrollLeft = $state(0);
  let startItemIndex = $state(0);
  let visibleItems = $state<(Action | IRecordId)[]>([]);
  let isMounted = $state(false);

  const path = $derived($vTrail.items);
  const activatedItem = $derived($vTrail.activated);
  const totalWidth = $derived($vTrail.items.length * ITEM_WIDTH);

  $effect(() => {
    if (activatedItem && isMounted) {
      scrollToItem(activatedItem);
    }
  });

  $effect(() => {
    updateVisibleItems(path, virtualScrollLeft);
  });

  onMount(() => {
    tick().then(() => {
      isMounted = true;
      if (activatedItem) {
        scrollToItem(activatedItem);
      }
    });
  });

  function updateVisibleItems(
    items: (Action | IRecordId)[],
    scrollLeft: number
  ) {
    if (!items.length) {
      visibleItems = [];
      return;
    }

    const centerIndex = Math.floor(scrollLeft / ITEM_WIDTH);
    startItemIndex = Math.max(0, centerIndex - Math.floor(VISIBLE_ITEMS / 2));

    const maxStartIndex = Math.max(0, items.length - VISIBLE_ITEMS);
    startItemIndex = Math.min(startItemIndex, maxStartIndex);

    visibleItems = items.slice(startItemIndex, startItemIndex + VISIBLE_ITEMS);
  }

  function scrollToItem(item: IRecordId) {
    if (!containerRef) return;

    const itemIndex = path.indexOf(item);
    if (itemIndex === -1) return;
    const targetPosition = itemIndex * ITEM_WIDTH;
    virtualScrollLeft = targetPosition;
    containerRef.scrollLeft = targetPosition;
  }

  function onScroll(e: Event) {
    if (!isMounted) return;
    const target = e.target as HTMLElement;
    virtualScrollLeft = target.scrollLeft;
  }

  function getItemPosition(index: number): number {
    return (startItemIndex + index) * ITEM_WIDTH;
  }
</script>

<div
  bind:this={containerRef}
  class="relative w-screen h-full overflow-x-auto overflow-y-hidden"
  onscroll={onScroll}
  style="scroll-behavior: smooth;"
>
  <div class="relative h-full" style="width: {totalWidth}px;">
    {#each visibleItems as item, index (item)}
      {@const parts = item.split("-")}
      <div
        class="absolute top-0 h-full rounded-md"
        style="left: {getItemPosition(index)}px; width: {ITEM_WIDTH}px;"
      >
        <ResourceResolver
          id={parts[parts.length - 1]}
          accessMode={AccessMode.INLINE}
        />
      </div>
    {/each}
  </div>
</div>
