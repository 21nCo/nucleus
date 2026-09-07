<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import { cn } from "@21n/utils/ui.utils";
  import { compareDates, isSameDay } from "@21n/utils/time.utils";
  import CalendarTileIndicator from "@nucleum/features/calendar/classic/indicator/CalendarTileIndicator.svelte";
  import type { ICalendarIndicatorData } from "@nucleum/features/calendar/calendar.type";
  import { preferences } from "@nucleum/stores/preferences/preferences.store";
  import { Preference } from "@nucleum/stores/preferences/preferences.type";
  import { TimeScaleUnit } from "@21n/utils/time.type";
  import { logger } from "@nucleum/client/runtime/logging/logger";
  import {
    buildResolvedIndicatorDataByDayMap,
    resolveIndicatorDayKey
  } from "@nucleum/features/calendar/classic/indicator/resolveIndicatorDataByDay";

  let {
    selectedDate = $bindable(new Date()),
    indicatorData = [],
    selectedScale = TimeScaleUnit.DAY,
    onDateChange = void 0,
    onMonthSelect = void 0,
    onYearChange = void 0,
    onYearSelect = void 0
  }: {
    selectedDate?: Date;
    indicatorData?: ICalendarIndicatorData[];
    selectedScale?: TimeScaleUnit;
    onDateChange?: (payload: { date: Date }) => void;
    onMonthSelect?: (payload: { date: Date }) => void;
    onYearChange?: (payload: { year: number }) => void;
    onYearSelect?: (payload: { date: Date }) => void;
  } = $props();

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];

  const YEAR_RANGE = 200;
  const BASE_YEAR = new Date().getFullYear() - 100;
  let yearHeight = $state(1200);
  const virtualHeight = $derived(YEAR_RANGE * yearHeight);

  const getVisibleYears = () => {
    if (typeof window === "undefined") return 3;
    const width = window.innerWidth;
    if (width >= 1920) return 5;
    return 3;
  };

  const VISIBLE_YEARS = getVisibleYears();
  let visibleYears = $state<ReturnType<typeof getYearData>[]>([]);
  let visibleYear = $state<number>(selectedDate.getFullYear());
  let scrollTimeout: ReturnType<typeof setTimeout> | undefined;
  let containerRef: HTMLDivElement;
  let isExplicitNavigation = false;
  let virtualScrollTop = $state(
    (selectedDate.getFullYear() - BASE_YEAR) * yearHeight
  );
  let startYearIndex = $state(0);
  let isMounted = $state(false);
  let isRecalibrating = false;
  let calibratedWidth = 0;

  let showYearIndicators = $state(
    preferences.resolve(Preference.CALENDAR_TILE_INDICATORS_YEAR) ?? true
  );
  const resolvedIndicatorDataByDay = $derived.by(() =>
    buildResolvedIndicatorDataByDayMap(indicatorData)
  );

  const unsubscribe = preferences.subscribe((prefs) => {
    showYearIndicators =
      prefs[Preference.CALENDAR_TILE_INDICATORS_YEAR] ?? true;
  });

  onDestroy(unsubscribe);
  onMount(() => {
    updateVisibleYears();
    calibratedWidth = containerRef?.clientWidth ?? 0;
    requestAnimationFrame(() => {
      remeasureAndRecalibrate(selectedDate.getFullYear());
    });

    let timeoutId: ReturnType<typeof setTimeout>;
    timeoutId = setTimeout(() => {
      scrollToYear(selectedDate.getFullYear(), selectedDate.getMonth());
      tick().then(() => {
        isMounted = true;
      });
    }, 500);

    // Re-calibrate YEAR_HEIGHT when the container is resized (e.g. side panels
    // opening/closing narrow the calendar area, making year elements taller).
    let lastContainerWidth = 0;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = Math.round(entry.contentRect.width);
        if (lastContainerWidth !== 0 && newWidth !== lastContainerWidth) {
          // Capture the current year+month and block onScroll BEFORE the rAF
          // so that any scroll events fired by the layout change cannot
          // corrupt state.
          const targetYear = visibleYear || selectedDate.getFullYear();
          const targetMonth = selectedDate.getMonth();
          isRecalibrating = true;
          requestAnimationFrame(() => {
            remeasureAndRecalibrate(targetYear, targetMonth);
          });
        }
        lastContainerWidth = newWidth;
      }
    });
    resizeObserver.observe(containerRef);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  });

  function remeasureAndRecalibrate(targetYear: number, targetMonth?: number) {
    const yearElement = containerRef?.querySelector(
      '[id^="year-"]'
    ) as HTMLElement | null;
    if (!yearElement) { isRecalibrating = false; return; }
    const actualHeight = yearElement.offsetHeight;
    if (actualHeight <= 0) { isRecalibrating = false; return; }
    yearHeight = actualHeight;
    virtualScrollTop = getVirtualPosition(targetYear);
    updateVisibleYears();

    // Flush Svelte DOM updates first, then set scrollTop so the browser
    // scrolls into already-rendered content.  After the year is in view,
    // refine to the exact month so the user's position is fully restored.
    tick().then(() => {
      if (!containerRef) { isRecalibrating = false; return; }
      containerRef.scrollTop = virtualScrollTop;
      requestAnimationFrame(() => {
        if (targetMonth !== undefined) {
          const useYearLevel =
            containerRef?.clientWidth > 1200;
          const targetId = useYearLevel
            ? `year-${targetYear}`
            : `month-${targetYear}-${targetMonth}`;
          const el = document.getElementById(targetId);
          if (el) {
            el.scrollIntoView({ block: useYearLevel ? "start" : "center" });
          }
        }
        requestAnimationFrame(() => {
          if (containerRef) calibratedWidth = containerRef.clientWidth;
          isRecalibrating = false;
        });
      });
    });
  }

  function getYearFromIndex(index: number): number {
    return BASE_YEAR + index;
  }

  function getIndexFromYear(year: number): number {
    return year - BASE_YEAR;
  }

  function updateVisibleYears() {
    const centerIndex = Math.floor(virtualScrollTop / yearHeight);
    startYearIndex = Math.max(0, centerIndex - Math.floor(VISIBLE_YEARS / 2));

    const maxStartIndex = Math.max(0, YEAR_RANGE - VISIBLE_YEARS);
    startYearIndex = Math.min(startYearIndex, maxStartIndex);

    visibleYears = Array.from({ length: VISIBLE_YEARS }, (_, i) => {
      const yearIndex = startYearIndex + i;
      const year = getYearFromIndex(yearIndex);
      return getYearData(year);
    });
  }

  function getVirtualPosition(year: number): number {
    const index = getIndexFromYear(year);
    return index * yearHeight;
  }

  function getDaysInMonth(year: number, month: number) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    const totalDays = days.length;
    const remainingDays = 42 - totalDays;
    for (let i = 0; i < remainingDays; i++) {
      days.push(null);
    }

    return days;
  }

  function createSafeDate(year: number, month: number, day: number): Date {
    // Get the last day of the target month to clamp the day
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const clampedDay = Math.min(day, lastDayOfMonth);
    return new Date(year, month, clampedDay);
  }

  function getYearData(year: number) {
    return {
      year,
      months: Array.from({ length: 12 }, (_, i) => ({
        monthIndex: i,
        days: getDaysInMonth(year, i)
      }))
    };
  }

  function scrollToYear(year: number, month?: number) {
    if (!containerRef) return;

    const targetPosition = getVirtualPosition(year);
    virtualScrollTop = targetPosition;
    updateVisibleYears();

    containerRef.scrollTop = targetPosition;

    requestAnimationFrame(() => {
      const isScrollToYear =
        containerRef?.clientWidth > 1200 || month === undefined;
      const targetId = isScrollToYear
        ? `year-${year}`
        : `month-${year}-${month}`;
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: isScrollToYear ? "start" : "center"
        });
      }
    });
  }

  function onScroll(e: Event) {
    if (!isMounted || isRecalibrating) return;

    // If the container width changed since the last calibration, a layout
    // transition is in progress (e.g. side panel opening/closing).  Year
    // element positions are stale so skip all year detection until the
    // ResizeObserver recalibrates.
    if (calibratedWidth && containerRef &&
        containerRef.clientWidth !== calibratedWidth) return;

    const target = e.target as HTMLElement;
    const { scrollTop } = target;

    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    virtualScrollTop = scrollTop;

    const newVisibleYear = getVisibleYearFromDOM();

    if (newVisibleYear !== null &&
      newVisibleYear !== visibleYear &&
      newVisibleYear >= BASE_YEAR &&
      newVisibleYear < BASE_YEAR + YEAR_RANGE
    ) {
      visibleYear = newVisibleYear;
      selectedDate = createSafeDate(
        newVisibleYear,
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      onYearChange?.({ year: newVisibleYear });
    }

    scrollTimeout = setTimeout(() => {
      updateVisibleYears();
    }, 16);
  }

  function getVisibleYearFromDOM(): number | null {
    if (!containerRef) return null;
    const containerRect = containerRef.getBoundingClientRect();
    const centerY = containerRect.top + containerRef.clientHeight / 2;
    for (const { year } of visibleYears) {
      const yearEl = document.getElementById(`year-${year}`);
      if (!yearEl) continue;
      const rect = yearEl.getBoundingClientRect();
      if (rect.top <= centerY && rect.bottom >= centerY) return year;
    }
    return null;
  }

  export function scrollToToday() {
    const today = new Date();
    const targetYear = today.getFullYear();
    navigateToYear(targetYear, {
      month: today.getMonth(),
      day: today.getDate()
    });
  }

  function isScrollRequired(targetId: string): boolean {
    try {
      const targetElement = document.getElementById(targetId);
      if (!targetElement || !containerRef) return true;
      const elRect = targetElement.getBoundingClientRect();
      const containerRect = containerRef.getBoundingClientRect();
      return (
        elRect.top < containerRect.top || elRect.bottom > containerRect.bottom
      );
    } catch (e) {
      logger.error(e);
      return true;
    }
  }

  export function scrollToDate(date: Date) {
    const elementId = `month-${date.getFullYear()}-${date.getMonth()}`;
    const isPreventScroll = !isScrollRequired(elementId);
    const targetYear = date.getFullYear();

    if (targetYear < BASE_YEAR || targetYear >= BASE_YEAR + YEAR_RANGE) {
      logger.error({
        at: "YearViewV2.scrollToDate",
        message: `Year ${targetYear} is outside the supported range (${BASE_YEAR} - ${BASE_YEAR + YEAR_RANGE - 1})`,
        targetYear,
        supportedRange: { min: BASE_YEAR, max: BASE_YEAR + YEAR_RANGE - 1 }
      });
      return;
    }

    const targetPosition = getVirtualPosition(targetYear);
    if (!isPreventScroll) {
      virtualScrollTop = targetPosition;
      updateVisibleYears();
      containerRef.scrollTop = targetPosition;
    }

    requestAnimationFrame(() => {
      navigateToYear(targetYear, {
        month: date.getMonth(),
        day: date.getDate(),
        isPreventScroll
      });
    });
  }

  export function navigateToYear(
    targetYear: number,
    props?: {
      month?: number;
      day?: number;
      isPreventScroll?: boolean;
    }
  ) {
    isExplicitNavigation = true;
    selectedDate = createSafeDate(
      targetYear,
      props?.month ?? selectedDate.getMonth(),
      props?.day ?? selectedDate.getDate()
    );
    if (!props?.isPreventScroll)
      scrollToYear(targetYear, selectedDate.getMonth());
    onYearChange?.({ year: targetYear });
    isExplicitNavigation = false;
  }

  export function navigatePrevYear() {
    const currentYear = visibleYear || selectedDate.getFullYear();
    const targetYear = currentYear - 1;
    visibleYear = targetYear;
    navigateToYear(targetYear);
  }

  export function navigateNextYear() {
    const currentYear = visibleYear || selectedDate.getFullYear();
    const targetYear = currentYear + 1;
    visibleYear = targetYear;
    navigateToYear(targetYear);
  }

  $effect(() => {
    if (visibleYears.length === 0) {
      const currentYear = selectedDate.getFullYear();
      virtualScrollTop = getVirtualPosition(currentYear);
      updateVisibleYears();
      visibleYear = currentYear;
      onYearChange?.({ year: currentYear });
    }
  });

  $effect(() => {
    if (containerRef && selectedDate && isExplicitNavigation) {
      scrollToYear(selectedDate.getFullYear(), selectedDate.getMonth());
    }
  });

  $effect(() => {
    if (selectedDate) {
      visibleYear = selectedDate.getFullYear();
    }
  });

  function isToday(date: Date | null) {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  function isPastDate(date: Date | null) {
    if (!date) return false;
    const today = new Date();
    return compareDates(date, today, "<");
  }

  function resolveIfFutureMonth(year: number, monthIndex: number) {
    const today = new Date();
    return (
      year > today.getFullYear() ||
      (monthIndex > today.getMonth() && year === today.getFullYear())
    );
  }
  function resolveIfCurrentMonth(year: number, monthIndex: number) {
    const today = new Date();
    return year === today.getFullYear() && monthIndex === today.getMonth();
  }

  function handleMonthSelect(year: number, monthIndex: number) {
    const monthDate = new Date(year, monthIndex, 1);
    onMonthSelect?.({ date: monthDate });
  }

  function handleYearSelect(year: number) {
    const yearDate = new Date(year, 0, 1);
    onYearSelect?.({ date: yearDate });
  }
</script>

<div
  class="h-full overflow-y-auto px-6"
  bind:this={containerRef}
  onscroll={onScroll}
>
  <div style="height: {virtualHeight}px; position: relative;">
    <div
      style="position: absolute; top: {startYearIndex *
        yearHeight}px; width: 100%;"
    >
      {#each visibleYears as { year, months }}
        {@const isFutureYear = year > new Date().getFullYear()}
        {@const isSelectedYear =
          selectedScale === TimeScaleUnit.YEAR &&
          selectedDate.getFullYear() === year}
        <div
          class={cn(
            "mb-1 has-[.year-label:hover]:bg-bgs2 rounded-md transition-colors",
            {
              "bg-bgs2": isSelectedYear
            }
          )}
          id="year-{year}"
        >
          <button
            class={cn("year-label pt-2 w-full text-start group cursor-pointer")}
            onclick={() => handleYearSelect(year)}
          >
            <span
              class={cn("text-h2 font-medium ml-8 mr-2 group-hover:text-aps1", {
                "text-fgs4": isFutureYear && !isSelectedYear,
                "text-aps1 font-bold": isSelectedYear
              })}
            >
              {year}
            </span>
          </button>
          <div
            class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-x-1 gap-y-1"
          >
            {#each months as { days, monthIndex }}
              {@const isFutureMonth = resolveIfFutureMonth(year, monthIndex)}
              {@const isCurrentMonth = resolveIfCurrentMonth(year, monthIndex)}
              {@const isSelectedMonth =
                selectedScale === TimeScaleUnit.MONTH &&
                selectedDate.getFullYear() === year &&
                selectedDate.getMonth() === monthIndex}
              <button
                class={cn(
                  "flex flex-col min-w-[240px] p-4 dp:p-6 transition-all duration-200 rounded-md",
                  {
                    "bg-bgs2": isSelectedMonth,
                    "has-[.first:hover]:bg--bgs2 hover:bg-bgs1-striped":
                      !isSelectedMonth
                  }
                )}
                id="month-{year}-{monthIndex}"
                onclick={() => handleMonthSelect(year, monthIndex)}
              >
                <div
                  class={cn(
                    "first flex items-center gap-1 mb-2 ml-3 font-medium text-h5 transition-colors cursor-pointer text-left",
                    {
                      "text-fgs4": isFutureMonth && !isSelectedMonth,
                      "text-fgs1":
                        !isFutureMonth && !isCurrentMonth && !isSelectedMonth,
                      "text-ass1": isCurrentMonth && !isSelectedMonth,
                      "text-aps1 font-bold": isSelectedMonth
                    }
                  )}
                >
                  <span>{monthNames[monthIndex]}</span>
                  <span>{year}</span>
                </div>
                <div
                  class="grid grid-cols-7 gap-x-1 gap-y-1 text-center number-grid-size"
                >
                  {#each weekDays as day}
                    <div class="text-fgs4 mb-1 text-b4">{day}</div>
                  {/each}
                  {#each days as date}
                    {#if date}
                      {@const isSelected =
                        selectedScale === TimeScaleUnit.DAY &&
                        isSameDay(selectedDate, date)}
                      {@const isCurrentDay = isToday(date)}
                      {@const isPastDay = isPastDate(date)}
                      <button
                        class={cn(
                          "py-1 rounded-md border flex flex-col items-center h-9 w-full",
                          {
                            "bg-aps1 text-abg border-transparent": isSelected,
                            "text-ass1 font-medium border-ass1 notouch:hover:bg-ass2 active:bg-ass2":
                              isCurrentDay && !isSelected
                          },
                          !isSelected &&
                            !isCurrentDay && {
                              "hover:text-fgs1 border-transparent notouch:hover:bg-bgs3 active:bg-bgs3": true,
                              "text-fgs1 border-transparent": isPastDay,
                              "text-fgs3": !isPastDay
                            }
                        )}
                        onclick={(e) => {
                          e.stopPropagation();
                          selectedDate = date;
                          onDateChange?.({ date });
                        }}
                      >
                        {date.getDate()}
                        {#if indicatorData.length > 0 && showYearIndicators}
                          <CalendarTileIndicator
                            resolvedData={resolvedIndicatorDataByDay.get(
                              resolveIndicatorDayKey(date)
                            )}
                            isActive={isSelected}
                          />
                        {/if}
                      </button>
                    {:else}
                      <div class="py-0.5 text-fgs4"></div>
                    {/if}
                  {/each}
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
