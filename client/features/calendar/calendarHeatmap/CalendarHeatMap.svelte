<script lang="ts">
  import {
    selectedTimePeriod,
    isTouchDevice
  } from "@nucleum/stores/app.store";
  import {
    CalendarHeatMapData,
    CalendarHeatMapLayout
  } from "@nucleum/features/calendar/calendarHeatmap/calendarHeatmap.store";
  import {
    TileScale,
    CalendarHmVariant,
    type ICalendarHeatMapDataProvider,
    type CalendarHeatmapOptions
  } from "@nucleum/features/calendar/calendarHeatmap/calendarHeatmap.types";
  import { CalendarHeatmapDataManager } from "@nucleum/features/calendar/calendarHeatmap/calendarHeatMap.utils";
  import { onMount } from "svelte";
  import Footer from "@nucleum/features/calendar/calendarHeatmap/Footer.svelte";
  import HeaderV1 from "@nucleum/features/calendar/calendarHeatmap/HeaderV1.svelte";
  import HeaderV2 from "@nucleum/features/calendar/calendarHeatmap/HeaderV2.svelte";
  import HorizontalCalendarLayout from "@nucleum/features/calendar/calendarHeatmap/HorizontalCalendarLayout.svelte";
  import MonthsLayout from "@nucleum/features/calendar/calendarHeatmap/MonthsLayout.svelte";
  import QuadrennialLayout from "@nucleum/features/calendar/calendarHeatmap/QuadrennialLayout.svelte";
  import VerticalCalendarLayout from "@nucleum/features/calendar/calendarHeatmap/VerticalCalendarLayout.svelte";
  import VerticalQuadrennialLayout from "@nucleum/features/calendar/calendarHeatmap/VerticalQuadrennialLayout.svelte";
  import VerticalYearsLayout from "@nucleum/features/calendar/calendarHeatmap/VerticalYearsLayout.svelte";
  import YearsLayout from "@nucleum/features/calendar/calendarHeatmap/YearsLayout.svelte";
  import { Orientation } from "@21n/elements/direction.enum";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import { Size } from "@21n/elements/size.enum";

  let {
    variant = CalendarHmVariant.PLAIN,
    orientation,
    touchDevice,
    provider,
    options = {},
    tileScale = $bindable(TileScale.DAYS)
  }: {
    variant?: CalendarHmVariant;
    orientation: Orientation;
    touchDevice: boolean;
    provider: ICalendarHeatMapDataProvider;
    options?: CalendarHeatmapOptions;
    tileScale?: TileScale;
  } = $props();

  let heatmapDataManager = new CalendarHeatmapDataManager(provider, options);
  let data = $state<any>(undefined);
  let isLoading = $state(false);
  const currentYear = new Date().getFullYear();
  const endYear = currentYear;
  $effect(() => {
    $CalendarHeatMapLayout = orientation;
  });
  $effect(() => {
    $isTouchDevice = touchDevice;
  });

  function viewChangeHandler(scale: TileScale) {
    tileScale = scale;
    refreshData();
  }
  function refreshSelectedTile() {
    if (tileScale === TileScale.DAYS) {
      selectedTimePeriod.set(new Date());
    }
  }
  async function refreshData() {
    data = undefined;
    isLoading = true;
    if (
      tileScale === TileScale.DAYS &&
      variant != CalendarHmVariant.SCALE_SWITCH
    ) {
      if (options.selectedYear)
        heatmapDataManager.fetchDailyDataForTheYear(options.selectedYear);
      else await heatmapDataManager.fetchLast12MonthsDailyData();
    } else if (
      tileScale === TileScale.DAYS &&
      variant === CalendarHmVariant.SCALE_SWITCH
    )
      await heatmapDataManager.fetchDailyDataForTheYear(
        new Date().getFullYear()
      );
    else if (tileScale == TileScale.MONTHS) {
      const startYear = currentYear - 21;
      heatmapDataManager.fetchMonthlyAggData(startYear, endYear);
    } else if (tileScale == TileScale.YEARS) {
      const startYear = currentYear - 47;
      heatmapDataManager.fetchYearlyAggData(startYear, endYear);
    }
    refreshSelectedTile();
    isLoading = false;
  }
  async function prev() {
    if (tileScale == TileScale.DAYS)
      await heatmapDataManager.paginateDailyData("prev");
    else if (tileScale == TileScale.MONTHS)
      heatmapDataManager.paginateMonthlyAggData("prev");
    else heatmapDataManager.paginateYearlyAggData("prev");
  }
  async function next() {
    if (tileScale == TileScale.DAYS)
      await heatmapDataManager.paginateDailyData("next");
    else if (tileScale == TileScale.MONTHS)
      heatmapDataManager.paginateMonthlyAggData("next");
    else heatmapDataManager.paginateYearlyAggData("next");
  }
  onMount(async () => {
    await refreshData();
    const hmsub = CalendarHeatMapData.subscribe((x) => {
      data = undefined;
      data = x;
    });
    return () => {
      hmsub();
    };
  });
</script>

<div class="flex h-full w-full flex-col gap-2 items-center">
  {#if variant === CalendarHmVariant.PLAIN}
  {:else if variant === CalendarHmVariant.YEARS_SWITCH}
    <HeaderV1 {provider} {options} />
  {:else if variant === CalendarHmVariant.SCALE_SWITCH}
    <HeaderV2
      {orientation}
      onSwitch={viewChangeHandler}
      onPrev={prev}
      onNext={next}
    />
  {/if}
  <div class="h-full w-full">
    {#if isLoading}
      <EmptyStatusView
        size={Size.sm}
        isLoadingState={isLoading}
        mainText=""
        loadingText=""
      />
    {:else if data}
      {#if orientation === Orientation.Horizontal}
        <HorizontalCalendarLayout {data} scale={tileScale}>
          {#snippet children(datum)}
          {#if tileScale === TileScale.DAYS}
            <MonthsLayout data={datum} />
          {:else if tileScale === TileScale.MONTHS}
            <YearsLayout data={datum} />
          {:else}
            <QuadrennialLayout data={datum} />
          {/if}
          {/snippet}
        </HorizontalCalendarLayout>
      {:else}
        <VerticalCalendarLayout {data} scale={tileScale}>
          {#snippet children(datum)}
          {#if tileScale === TileScale.DAYS}
            <MonthsLayout data={datum} />
          {:else if tileScale === TileScale.MONTHS}
            <VerticalYearsLayout data={datum} />
          {:else}
            <VerticalQuadrennialLayout data={datum} />
          {/if}
          {/snippet}
        </VerticalCalendarLayout>
      {/if}
    {/if}
  </div>
  {#if variant === CalendarHmVariant.PLAIN}
  {:else}
    <Footer />
  {/if}
</div>
