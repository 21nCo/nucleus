<script lang="ts">
  import type { Snippet } from "svelte";
  import { startTouch } from "@21n/utils/touchGesture";
  import MonthsHeader from "@nucleum/features/calendar/calendarHeatmap/MonthsHeader.svelte";
  import WeekDays from "@nucleum/features/calendar/calendarHeatmap/WeekDays.svelte";
  import { TileScale } from "@nucleum/features/calendar/calendarHeatmap/calendarHeatmap.types";
  let {
    data,
    scale,
    numberOfColumns = 3,
    children = undefined
  }: {
    data: any;
    scale: TileScale;
    numberOfColumns?: number;
    children?: Snippet<[any]> | undefined;
  } = $props();
</script>

<div
  class="VerticalCL"
  style:--times={scale === TileScale.DAYS ? numberOfColumns : 0}
  style:--itemSize={scale === TileScale.DAYS ? "28%" : "300px"}
  style:--columnGap={scale === TileScale.DAYS ? "20px" : "0px"}
  style:--rowHeight={scale === TileScale.YEARS
    ? "58px"
    : scale === TileScale.MONTHS
      ? "30px"
      : undefined}
  ontouchstart={startTouch}
>
  {#if scale === TileScale.MONTHS}
    <MonthsHeader />
  {/if}
  {#each Object.entries(data) as [slot, slotData], index}
    {#if scale === TileScale.DAYS && (index == 0 || index % numberOfColumns == 0)}
      <WeekDays />
    {/if}
    {@render children?.([slot, slotData, index])}
  {/each}
</div>

<style>
  .VerticalCL {
    display: grid;
    grid-template-columns: 20px repeat(var(--times, 3), var(--itemSize, 30%));
    grid-column-gap: var(--columnGap, 10px);
    grid-auto-rows: var(--rowHeight, auto);
    /* justify-content: stretch; */
    padding: 10px;
    align-items: center;
    /* border: 1px solid red; */
  }
</style>
