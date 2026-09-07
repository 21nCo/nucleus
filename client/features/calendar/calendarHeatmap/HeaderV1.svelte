<script lang="ts">
  import DropDown from "@21n/elements/dropdown/DropDown.svelte";
  import type { DropdownItem } from "@21n/elements/dropdown/dropdownItem.type";
  import { InputStyle } from "@21n/elements/input/input.type";
  import { CalendarHeatmapDataManager } from "@nucleum/features/calendar/calendarHeatmap/calendarHeatMap.utils";
  import type {
    ICalendarHeatMapDataProvider,
    CalendarHeatmapOptions
  } from "@nucleum/features/calendar/calendarHeatmap/calendarHeatmap.types";
  import { getContext } from "svelte";

  const handleEvent = getContext<any>("heatmap-event");

  function propagateEvent(data: any) {
    handleEvent(data);
  }

  let {
    provider,
    options = {}
  }: {
    provider: ICalendarHeatMapDataProvider;
    options?: CalendarHeatmapOptions;
  } = $props();
  let dataManager = new CalendarHeatmapDataManager(provider, options);
  let logstartdate = "2000-01-01";
  let logstartYear = new Date(logstartdate).getFullYear();
  let currentYear = new Date().getFullYear();
  let items: DropdownItem[] = [];

  for (let year = logstartYear; year <= currentYear; year++) {
    items.push({ label: year.toString(), value: year });
  }
  items.push({ label: "Last 365 days", value: 0 });
  items.reverse();
  let value: any = options.selectedYear ?? items[0].value;
  async function handleSelect(event: any) {
    const year = event.detail;
    if (year == 0) {
      await dataManager.fetchLast12MonthsDailyData();
    } else {
      await dataManager.fetchDailyDataForTheYear(year);
    }
    propagateEvent({
      year,
      type: "year-selection"
    });
  }
</script>

<div class="flex gap-2 px-2 w-full justify-end items-center p-1">
  <span class="w-40">
    <DropDown
      onSelect={handleSelect}
      {items}
      bind:value
      style={InputStyle.PLAIN}
      isDisableSearch={true}
    />
  </span>
</div>
