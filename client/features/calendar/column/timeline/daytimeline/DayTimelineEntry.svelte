<script lang="ts">
  import dayjs from "dayjs";
  import type { CalendarTimelineEntry } from "@nucleum/features/calendar/calendar.type";
  import ComponentResolver from "@21n/layout/paint/ComponentResolver.svelte";
  import { resizeListener } from "@nucleum/actions/resize.action";

  let {
    entry
  }: {
    entry: CalendarTimelineEntry & {
      top: number;
      height: number;
      groupSize?: number;
      positionInGroup?: number;
    };
  } = $props();
  /**
   * Offset from the left side edge of the timeline to accomodate the
   * timeline markers
   */
  const leftOffset = 72;
  const offsetDeduction = leftOffset + 4;
  let height = $state(0);

  const isOverlapping = $derived(!!entry.groupSize && entry.groupSize > 1);

  const width = $derived(
    isOverlapping
      ? `calc((100% - ${offsetDeduction}px) / ${entry.groupSize})`
      : `calc(100% - ${offsetDeduction}px)`
  );

  const left = $derived(
    isOverlapping && entry.positionInGroup !== undefined
      ? `calc(${leftOffset}px + (${entry.positionInGroup} * (100% - ${offsetDeduction}px) / ${entry.groupSize}))`
      : `${leftOffset}px`
  );
</script>

<button
  class="event-item absolute bg-bgs2 rounded-r-md border-l-2 border-aps1 truncate flex userdata hover:bg-bgs3-striped"
  style="top: {entry.top}px; height: {entry.height}px; width: {width}; left: {left};"
  use:resizeListener={(el) => {
    height = el.height;
  }}
>
  {#if entry.component}
    <ComponentResolver
      path={entry.component}
      params={{ item: entry.item, height, isOverlapping }}
    />
  {:else if entry.item?.label}
    <div class="flex items-center gap-1 px-2 py-1">
      <div class="text-fgs3 text-b3">
        {dayjs(entry.startUnix).format("HH:mm")} - {dayjs(entry.endUnix).format(
          "HH:mm"
        )}
      </div>
      <div class="text-fgs1 text-b3">{entry.item.label ?? "Untitled"}</div>
    </div>
  {/if}
</button>

<style>
  .event-item {
    transition: transform 0.2s;
  }
</style>
