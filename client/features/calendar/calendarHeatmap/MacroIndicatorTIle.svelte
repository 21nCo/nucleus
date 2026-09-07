<script lang="ts">
  import type { YearlyData } from "@nucleum/features/calendar/calendarHeatmap/calendarHeatmap.types";
  let {
    data,
    tileValue = ""
  }: {
    data: YearlyData;
    tileValue?: string;
  } = $props();
  const resolvedTileValue = $derived(tileValue === "" ? String(data.year) : tileValue);
</script>

<span>
  <button id="MaITile">
    {resolvedTileValue ?? ""}
  </button>
</span>

<style>
  button {
    color: var(--colors-fg-s2, #545454);
    font-size: 14px;
    font-weight: 350;
    text-align: center;
    height: 35px;
    width: 85px;
    padding: 8px 10px;
    background-color: var(--tileBgColor);
    border-radius: 3px;
    /* border: 1px solid red; */
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
    /* transform: translate(6px, 0px); */
  }
  span::after {
    content: "";
    width: var(--width, 0.5px);
    height: var(--height, 4.5px);
    background-color: var(--bottomThreadColor, inherit);
    /* transform: translate(6px, 0px); */
  }
</style>
