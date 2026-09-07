<script lang="ts">
  import { selectedTimePeriod } from "@nucleum/stores/app.store";
  import { Placement, Orientation } from "@21n/types/direction.enum";
  import { parseAndFormatDate } from "@21n/utils/time.utils";
  import {
    TileAppearance,
    type DailyData,
    type MonthlyData
  } from "@nucleum/features/calendar/calendarHeatmap/calendarHeatmap.types";
  import { CalendarHeatMapLayout } from "@nucleum/features/calendar/calendarHeatmap/calendarHeatmap.store";
  import { heatMapColorRange } from "@21n/utils/theme.utils";
  import appearance from "@nucleum/stores/appearance.store";
  import HoverableElement from "@21n/elements/HoverableElement.svelte";
  import { cn } from "@21n/utils/ui.utils";

  let {
    data,
    classList = "",
    tileValue = ""
  }: {
    data: DailyData | MonthlyData;
    classList?: string;
    tileValue?: string;
  } = $props();
  const initialTileValue =
    data.display == TileAppearance.FTile || data.display == TileAppearance.LTile
      ? "🔥"
      : tileValue;
  const colors = $derived(heatMapColorRange($appearance, "aps1", 6));
  let tileRef: HTMLSpanElement;
  const tooltip = $derived(resolveToolTip(data.date));
  const isActive = $derived(
    ("date" in data &&
      data.date == parseAndFormatDate($selectedTimePeriod, "iso-short")) ||
      ("month" in data &&
        data.month ==
          parseAndFormatDate($selectedTimePeriod, "iso-short")
            .split("-")
            .slice(0, 2)
            .join("-"))
  );
  const monthTitles = [
    "J",
    "F",
    "M",
    "A",
    "M",
    "J",
    "J",
    "A",
    "S",
    "O",
    "N",
    "D"
  ];
  const resolvedTileValue = $derived.by(() => {
    if (initialTileValue !== "") return initialTileValue;
    if ("date" in data) return data.date.split("-")[2];
    if ($CalendarHeatMapLayout == Orientation.Horizontal && "month" in data) {
      const month = Number(data.month.split("-")[1]) - 1;
      return monthTitles[month];
    }
    return "";
  });
  function resolveToolTip(date: string | undefined) {
    if (!date) return;
    if ("date" in data) {
      return parseAndFormatDate(new Date(date), "verbose");
    }
  }
</script>

<span
  style:--topThreadColor={data.display == TileAppearance.LTile ||
  data.display == TileAppearance.MTile
    ? colors[5]
    : ""}
  style:--bottomThreadColor={data.display === TileAppearance.FTile ||
  data.display === TileAppearance.MTile
    ? colors[5]
    : ""}
  bind:this={tileRef}
  class="relative {classList}"
>
  <HoverableElement
    id="MITile"
    type="button"
    {tooltip}
    tooltipOptions={{
      placement: Placement.Right,
      offsetInPx: 4
    }}
    class={cn("tile text-b5 w-3 h-3 rounded-sm", {
      "border-2 border-bgs1 outline outline-ass1 shadow-outline": isActive
    })}
    style={`background-color: ${colors[data.color]};`}
    onclick={() => {
      let val;
      if ("date" in data) {
        val = new Date(data.date);
      } else if ("month" in data) {
        val = new Date(data.month + "-01");
      }
      selectedTimePeriod.set(val ?? new Date());
    }}
  >
    {#if resolvedTileValue === "🔥"}
    {/if}
  </HoverableElement>
</span>

<style>
  .tile {
    /* color: var(--colors-fg-s2, #545454); */
    font-size: 8px;
    height: 13px;
    width: 13px;
    background-color: var(--tileBgColor);
    border-radius: 3px;
  }
  .firstDay {
    grid-row: var(--startDay);
  }
  span {
    display: flex;
    flex-direction: var(--direction, column);
    justify-self: center;
    align-items: center;
    /* border: 1px solid red; */
  }
  span::before {
    content: "";
    width: var(--width, 0.5px);
    height: var(--height, 4.5px);
    background-color: var(--topThreadColor, inherit);
  }
  span::after {
    content: "";
    width: var(--width, 0.5px);
    height: var(--height, 4.5px);
    background-color: var(--bottomThreadColor, inherit);
  }
  .shadow-outline {
    box-shadow: 0 0 0 2px rgba(var(--colors-fgs3));
  }
</style>
