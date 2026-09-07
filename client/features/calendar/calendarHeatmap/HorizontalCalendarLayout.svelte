<script lang="ts">
  import type { Snippet } from "svelte";
  import { TileScale } from "@nucleum/features/calendar/calendarHeatmap/calendarHeatmap.types";
  import { startTouch } from "@21n/utils/touchGesture";
  import WeekDays from "@nucleum/features/calendar/calendarHeatmap/WeekDays.svelte";
  let {
    scale,
    data,
    children = undefined
  }: {
    scale: TileScale;
    data: any;
    children?: Snippet<[any]> | undefined;
  } = $props();
</script>

<div
  style:--times={scale != TileScale.MONTHS ? 12 : 22}
  style:--itemSize={scale === TileScale.YEARS
    ? "85px"
    : scale === TileScale.MONTHS
      ? "44px"
      : "7%"}
  style:--columnGap={scale === TileScale.YEARS
    ? "7px"
    : scale === TileScale.MONTHS
      ? "4px"
      : "20px"}
  ontouchstart={startTouch}
>
  {#if scale === TileScale.DAYS}
    <WeekDays />
  {:else}
    <div><!-- place holder for the WeekDays gap--></div>
  {/if}

  {#each Object.entries(data) as [slot, slotData] (slot)}
    {@render children?.([slot, slotData])}
  {/each}
</div>

<style>
  div {
    display: grid;
    grid-template-columns: 23px repeat(var(--times, 12), var(--itemSize, 7%));
    grid-column-gap: var(--columnGap, 10px);
    grid-auto-rows: minmax(126px, auto);
    justify-content: space-around;
    padding: 10px;
    /* border: 1px solid red; */
  }
</style>
