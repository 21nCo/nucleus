<script lang="ts">
  import { onMount, tick } from "svelte";
  import { hTrail } from "../topNav/tabs/tabs.store";
  import ResourceResolver from "@21n/layout/paint/ResourceResolver.svelte";
  import { AccessMode } from "@nucleum/datafn/resource.type";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import type { Action } from "@nucleum/application/commandBar/action.enum";
  import { isRecordId } from "@nucleum/datafn/resource.utils";

  const ITEM_WIDTH =
    (typeof window !== "undefined" ? window.innerWidth : 1200) - 500;
  const VISIBLE_ITEMS = 3;

  let containerRef: HTMLDivElement;
  let virtualScrollLeft = $state(0);
  let startItemIndex = $state(0);
  let visibleItems = $state<(Action | IRecordId)[]>([]);
  let isMounted = $state(false);

  const path = $derived($hTrail.path);
  const activatedItem = $derived($hTrail.activated);
  const totalWidth = $derived(
    ($hTrail.isBaseNonRecord ? path.length - 1 : path.length) * ITEM_WIDTH
  );

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

  function scrollToItem(item: Action | IRecordId) {
    if (!containerRef) return;

    const itemIndex = path.indexOf(item);
    if (itemIndex === -1) return;
    if (itemIndex === 0 && $hTrail.isBaseNonRecord) {
      return;
    }

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
      {#if isRecordId(item)}
        <div
          class="absolute top-0 h-full rounded-md"
          style="left: {getItemPosition(index)}px; width: {ITEM_WIDTH}px;"
        >
          <ResourceResolver id={item} accessMode={AccessMode.INLINE} />
        </div>
      {/if}
    {/each}
  </div>
</div>
