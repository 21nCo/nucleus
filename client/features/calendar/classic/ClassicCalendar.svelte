<script lang="ts">
  import CalendarHeader from "@nucleum/features/calendar/classic/CalendarHeader.svelte";
  import MonthView from "@nucleum/features/calendar/classic/MonthView.svelte";
  import WeekView from "@nucleum/features/calendar/classic/WeekView.svelte";
  import CalendarLayoutView from "@nucleum/features/calendar/CalendarLayout.svelte";
  import view from "@nucleum/stores/view.store";
  import CalendarColumn from "@nucleum/features/calendar/column/CalendarColumn.svelte";
  import { TimeScaleUnit } from "@21n/types/time.type";
  import { uiState } from "@nucleum/stores/uiState/uiState.store";
  import { UIState, UIStateScope } from "@nucleum/stores/uiState/uiState.type";
  import { CalendarLayout } from "@nucleum/features/calendar/calendar.type";
  import { resizable } from "@nucleum/actions/resize.action";
  import { debouncer } from "@21n/utils/utils";
  import { cn } from "@21n/utils/ui.utils";
  import { MetaResource, Resource } from "@nucleum/datafn/resource.enum";
  import { appStore } from "@nucleum/stores/app.store";
  import { Product } from "@nucleum/products/product.type";
  import MemotronTempCalendarColumn from "@nucleum/features/calendar/column/MemotronTempCalendarColumn.svelte";
  import ClassicCalendarHeaderLeftOptions from "@nucleum/features/calendar/classic/ClassicCalendarHeaderLeftOptions.svelte";
  import { Display } from "@21n/types/view.type";
  import YearViewV2 from "@nucleum/features/calendar/classic/YearViewV2.svelte";
  import { toSvelteStore } from "@datafn/svelte";
  import {
    areIndicatorDataEqual,
    createClassicCalendarIndicatorSignal
  } from "@nucleum/features/calendar/classic/indicator/classicCalendarIndicator.signal";
  let {
    panel = $bindable(CalendarLayout.Classic)
  }: {
    panel?: CalendarLayout;
  } = $props();

  let selectedDate = $state(new Date());
  let selectedView = $state<TimeScaleUnit>(resolveSavedScaleSelection());
  let selectedScale = $state<TimeScaleUnit>(TimeScaleUnit.DAY);
  let yearViewRef = $state<YearViewV2>();
  let weekViewRef = $state<WeekView>();
  let visibleWeekDates = $state<Date[] | undefined>(undefined);
  let width = $derived(resolveSavedWidthSelection(selectedView));
  let yearViewRefreshId = $state(new Date().getTime());
  const resourcesForIndicators = $derived(resolveResourcesForIndicators());
  const indicatorStore = $derived.by(() => {
    if (selectedView === TimeScaleUnit.DAY) return undefined;
    const date = selectedDate;
    const scale = selectedView;
    const resources = resourcesForIndicators;
    return toSvelteStore(
      () =>
        createClassicCalendarIndicatorSignal({
          resources,
          date,
          scale
        }),
      {
        initialData: [],
        defer: { strategy: "idle", delayMs: 500 },
        equals: areIndicatorDataEqual
      }
    );
  });
  const indicatorData = $derived(indicatorStore ? $indicatorStore!.data : []);
  const isRefreshing = $derived(
    Boolean(
      indicatorStore &&
      ($indicatorStore!.loading || $indicatorStore!.refreshing)
    )
  );

  function resolveSavedScaleSelection() {
    if ($appStore.product === Product.MEMOTRON) return TimeScaleUnit.YEAR;
    const scaleState = uiState.getState(UIState.classicCalendarScale, {
      scope: UIStateScope.DAP
    });
    return scaleState ?? TimeScaleUnit.YEAR;
  }

  function resolveSavedWidthSelection(view: TimeScaleUnit) {
    const widthState = uiState.getState(UIState.classicCalendarColumnWidth, {
      scope: UIStateScope.DAP,
      subVariables: [view.toString()]
    });
    const defaultVal = $appStore.product === Product.MEMOTRON ? 650 : 450;
    return widthState ?? defaultVal;
  }

  function handleYearChange(payload?: { year: number }) {
    if (!payload) return;
    setDate(
      new Date(payload.year, selectedDate.getMonth(), selectedDate.getDate())
    );
  }

  function handleMonthChange(date?: Date) {
    if (!date) return;
    setDate(date);
  }

  function handleMonthSelect(payload?: { date: Date }) {
    if (!payload || $appStore.product === Product.POINTRON) return;
    selectedScale = TimeScaleUnit.MONTH;
    setDate(payload.date);
  }

  function handleYearSelect(payload?: { date: Date }) {
    if (!payload || $appStore.product === Product.POINTRON) return;
    selectedScale = TimeScaleUnit.YEAR;
    setDate(payload.date);
  }

  function handleWeekSelect(payload?: { date: Date }) {
    if (!payload || $appStore.product === Product.POINTRON) return;
    selectedScale = TimeScaleUnit.WEEK;
    setDate(payload.date);
  }

  function handleVisibleDatesChange(payload?: { dates: Date[] }) {
    visibleWeekDates = payload?.dates;
  }

  function onResize(e: any) {
    width = e.width;
    debouncedResizePersist(width);
  }

  const debouncedResizePersist = debouncer((width: number) => {
    uiState.setState(UIState.classicCalendarColumnWidth, width, {
      scope: UIStateScope.DAP,
      subVariables: [selectedView.toString()]
    });
  }, 1000);

  function resolveResourcesForIndicators(): (Resource | MetaResource)[] {
    const product = $appStore.product;
    switch (product) {
      case Product.POINTRON:
        return [Resource.task, Resource.session];
      case Product.MEMOTRON:
        return [Resource.node, MetaResource.calendarNotes];
      case Product.NUCLEUM:
        return [
          Resource.task,
          Resource.session,
          Resource.node,
          MetaResource.calendarNotes
        ];
      default:
        return [];
    }
  }

  function handleScaleSelection(event: CustomEvent) {
    selectedView = event.detail;
  }

  function setDate(date: Date) {
    selectedDate = date;
  }

  function onDateChange() {}

  function onWindowResize() {
    if (selectedView !== TimeScaleUnit.YEAR) return;
    debouncedYearViewRefresh();
  }
  const debouncedYearViewRefresh = debouncer(() => {
    yearViewRefreshId = new Date().getTime();
  }, 500);
</script>

<CalendarLayoutView
  bind:panel
  onGoToToday={() => {
    if (
      selectedView === TimeScaleUnit.YEAR ||
      selectedView === TimeScaleUnit.WEEK
    ) {
      if (selectedView === TimeScaleUnit.YEAR) {
        yearViewRef?.scrollToToday();
      } else if (selectedView === TimeScaleUnit.WEEK) {
        weekViewRef?.scrollToToday();
      }
      selectedDate = new Date();
    } else {
      selectedDate = new Date();
      onDateChange();
    }
  }}
>
  {#snippet headerLeftOptions()}
    <ClassicCalendarHeaderLeftOptions
      bind:selectedView
      {isRefreshing}
      onScaleSelection={handleScaleSelection}
    />
  {/snippet}
  {#snippet header()}
    <CalendarHeader
      bind:selectedDate
      bind:selectedView
      {visibleWeekDates}
      {onDateChange}
      onGoToPrevious={() => {
        if (selectedView === TimeScaleUnit.YEAR) {
          yearViewRef?.navigatePrevYear();
        } else if (selectedView === TimeScaleUnit.WEEK) {
          weekViewRef?.scrollToPrevWeek();
        }
      }}
      onGoToNext={() => {
        if (selectedView === TimeScaleUnit.YEAR) {
          yearViewRef?.navigateNextYear();
        } else if (selectedView === TimeScaleUnit.WEEK) {
          weekViewRef?.scrollToNextWeek();
        }
      }}
    />
  {/snippet}

  <div class="flex h-full">
    <div
      class={cn("flex-1 overflow-auto", {
        "min-w-60": selectedView !== TimeScaleUnit.DAY
      })}
    >
      {#if selectedView === TimeScaleUnit.MONTH}
        <MonthView
          bind:selectedDate
          {selectedScale}
          {indicatorData}
          onMonthChange={handleMonthChange}
          onDateChange={() => {
            selectedScale = TimeScaleUnit.DAY;
            onDateChange();
          }}
          onWeekSelect={handleWeekSelect}
        />
      {:else if selectedView === TimeScaleUnit.YEAR}
        {#key yearViewRefreshId}
          <YearViewV2
            bind:this={yearViewRef}
            bind:selectedDate
            {selectedScale}
            {indicatorData}
            onYearChange={handleYearChange}
            onDateChange={() => {
              selectedScale = TimeScaleUnit.DAY;
              onDateChange();
            }}
            onMonthSelect={handleMonthSelect}
            onYearSelect={handleYearSelect}
          />
        {/key}
      {/if}
    </div>
    {#if (selectedView !== TimeScaleUnit.WEEK && !$view.isConstrainedWidth) || selectedView === TimeScaleUnit.DAY}
      <div
        class={cn("relative", {
          "w-[28rem] border-l border-brs3": selectedView !== TimeScaleUnit.DAY,
          "w-full": selectedView === TimeScaleUnit.DAY
        })}
        style={selectedView !== TimeScaleUnit.DAY &&
        $view.display !== Display.TP
          ? `min-width: ${width}px; width: ${width}px; max-width: ${width}px;`
          : ""}
        use:resizable={{
          // enabled: !$context.isTouchDevice,
          enabled:
            selectedView === TimeScaleUnit.MONTH ||
            selectedView === TimeScaleUnit.YEAR,
          minWidth: 430,
          maxWidth: $view.display === Display.TK ? 1400 : 1000,
          edges: ["left"],
          onResize: onResize
        }}
      >
        {#key selectedDate.toISOString()}
          {#if $appStore.product === Product.MEMOTRON || (selectedScale !== TimeScaleUnit.DAY && $appStore.product === Product.NUCLEUM)}
            <MemotronTempCalendarColumn
              date={selectedDate}
              scale={selectedScale}
            />
          {:else}
            <CalendarColumn
              scale={selectedScale}
              viewScale={selectedView}
              date={selectedDate}
              onDateChange={(e) => {
                if (e.detail) {
                  if (selectedView === TimeScaleUnit.YEAR) {
                    yearViewRef?.scrollToDate(e.detail);
                  } else if (selectedView === TimeScaleUnit.MONTH) {
                    setDate(e.detail);
                  } else if (selectedView === TimeScaleUnit.WEEK) {
                    //TODO
                    // weekViewRef?.scrollToToday();
                  }
                }
              }}
            />
          {/if}
        {/key}
      </div>
    {/if}
  </div>
</CalendarLayoutView>
<svelte:window onresize={onWindowResize} />
