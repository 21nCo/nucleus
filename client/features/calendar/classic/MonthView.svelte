<script lang="ts">
  import { cn } from "@21n/utils/ui.utils";
  import { onDestroy } from "svelte";
  import {
    CalendarTileIndicatorDisplayType,
    type ICalendarIndicatorData
  } from "@nucleum/features/calendar/calendar.type";
  import CalendarTileIndicator from "@nucleum/features/calendar/classic/indicator/CalendarTileIndicator.svelte";
  import { resizeListener } from "@nucleum/actions/resize.action";
  import { preferences } from "@nucleum/stores/preferences/preferences.store";
  import { Preference } from "@nucleum/stores/preferences/preferences.type";
  import { tooltip } from "@nucleum/actions/popover.action";
  import { Placement } from "@21n/types/direction.enum";
  import { TimeScaleUnit } from "@21n/types/time.type";
  import { getWeekNumber } from "@21n/utils/time.utils";
  import {
    buildResolvedIndicatorDataByDayMap,
    resolveIndicatorDayKey
  } from "@nucleum/features/calendar/classic/indicator/resolveIndicatorDataByDay";

  let {
    selectedDate = $bindable(new Date()),
    indicatorData = [],
    selectedScale = $bindable(TimeScaleUnit.DAY),
    onDateChange = void 0,
    onMonthChange = void 0,
    onWeekSelect = void 0
  }: {
    selectedDate?: Date;
    indicatorData?: ICalendarIndicatorData[];
    selectedScale?: TimeScaleUnit;
    onDateChange?: (date: Date) => void;
    onMonthChange?: (date: Date) => void;
    onWeekSelect?: (payload: { date: Date }) => void;
  } = $props();
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  let isScrolling = false;
  let scrollTimeout: NodeJS.Timeout;
  let containerWidth = $state(0);
  let today = $state(new Date());
  const isConstrainedWidth = $derived(containerWidth < 600);

  let showMonthIndicators = $state(
    preferences.resolve(Preference.CALENDAR_TILE_INDICATORS_MONTH) ?? true
  );
  const unsubscribe = preferences.subscribe((prefs) => {
    showMonthIndicators =
      prefs[Preference.CALENDAR_TILE_INDICATORS_MONTH] ?? true;
  });

  onDestroy(unsubscribe);
  function handleWheel(event: WheelEvent) {
    if (isScrolling) return;

    isScrolling = true;
    clearTimeout(scrollTimeout);

    const delta = event.deltaY;
    const newDate = new Date(selectedDate);

    if (delta > 0) {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }

    selectedDate = newDate;
    onMonthChange?.(newDate);

    scrollTimeout = setTimeout(() => {
      isScrolling = false;
    }, 150);
  }

  function getDaysInMonth(date: Date): Date[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysFromPrevMonth = firstDay.getDay();
    const prevMonthDays = [...Array(daysFromPrevMonth)].map((_, i) => {
      return new Date(year, month, -daysFromPrevMonth + i + 1);
    });

    const daysInMonth = [...Array(lastDay.getDate())].map((_, i) => {
      return new Date(year, month, i + 1);
    });

    const remainingDays =
      (7 - ((daysFromPrevMonth + daysInMonth.length) % 7)) % 7;
    const nextMonthDays = [...Array(remainingDays)].map((_, i) => {
      return new Date(year, month + 1, i + 1);
    });

    return [...prevMonthDays, ...daysInMonth, ...nextMonthDays];
  }

  const calendarDays = $derived(getDaysInMonth(selectedDate));
  const resolvedIndicatorDataByDay = $derived.by(() =>
    buildResolvedIndicatorDataByDayMap(indicatorData)
  );

  /**
   *
   * TODO - adjust the reference date of the week according to the first day of the week user preference - Use Thursday always as reference day of the week (used for saving calendar notes etc and avoiding data loss if user changes first day of the week)
   *
   * Current default first day of week is Sunday
   *
   * @param firstDay
   */
  function resolveReferenceDayOfWeek(firstDay: Date) {
    const referenceDay = new Date(firstDay);
    referenceDay.setDate(referenceDay.getDate() - referenceDay.getDay());
    referenceDay.setDate(referenceDay.getDate() + 4);
    return referenceDay;
  }

  function handleWeekSelect(weekReferenceDay: Date) {
    onWeekSelect?.({ date: weekReferenceDay });
  }

  /**
   * Formats a local calendar day key for deterministic E2E tile selection.
   */
  function formatCalendarDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
</script>

<div
  class="flex-1 overflow-auto h-full"
  onwheel={handleWheel}
  use:resizeListener={(e) => {
    containerWidth = e.width;
  }}
>
  <div
    class="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr] h-full grid-rows-[auto_1fr_1fr_1fr_1fr_1fr_1fr]"
  >
    <div
      class="h-10 flex items-center justify-center text-b4 text-fgs3 border-b border-r border-brs2 w-8 2k:w-10"
    >
      W
    </div>
    {#each weekDays as day, index}
      <div
        class={cn(
          "h-10 flex items-center justify-center text-b3 text-fgs3 text-center border-b border-r border-brs2",
          {
            "border-r-0": index === 6
          }
        )}
      >
        {day}
      </div>
    {/each}

    {#each calendarDays as day, dayIndex}
      {#if dayIndex % 7 === 0}
        {@const referenceDay = resolveReferenceDayOfWeek(day)}
        {@const weekNumber = getWeekNumber(referenceDay)}
        {@const isSelected =
          selectedScale === TimeScaleUnit.WEEK &&
          referenceDay.toDateString() === selectedDate.toDateString()}
        <button
          class={cn(
            "flex items-center justify-center border-b border-r border-brs2",
            {
              "bg-bgs2 text-aps1 font-bold text-b2": isSelected,
              "bg-bgs1 hover:bg-bgs2 hover:text-fgs1 text-fgs3 text-b3":
                !isSelected
            }
          )}
          use:tooltip={{
            text: `${referenceDay.getFullYear()}: Week ${weekNumber}`,
            direction: Placement.Right
          }}
          onclick={() => handleWeekSelect(referenceDay)}
        >
          {weekNumber}
        </button>
      {/if}
      {@const isToday = day.toDateString() === today.toDateString()}
      {@const isSelected =
        selectedScale === TimeScaleUnit.DAY &&
        day.toDateString() === selectedDate.toDateString()}
      {@const isNotCurrentMonth = day.getMonth() !== selectedDate.getMonth()}
      {@const isInSelectedWeek =
        selectedScale === TimeScaleUnit.WEEK &&
        day.getFullYear() === selectedDate.getFullYear() &&
        getWeekNumber(day) === getWeekNumber(selectedDate)}
      <button
        data-testid="calendar-month-day-tile"
        data-date-key={formatCalendarDateKey(day)}
        class={cn(
          "p-1.5 border-b border-brs2 relative group flex flex-col items-start",
          {
            "border-r": (calendarDays.indexOf(day) + 1) % 7 !== 0
          },
          {
            "bg-bgs2/50": isNotCurrentMonth,
            "notouch:hover:bg-bgs2-striped": !isToday && !isSelected,
            "bg-ass3 text-ass1 notouch:hover:bg-ass2/10":
              isToday && !isSelected,
            "bg-aps3 text-aps1": isSelected,
            "bg-bgs2": isInSelectedWeek
          }
        )}
        onclick={() => {
          selectedDate = day;
          onDateChange?.(day);
        }}
      >
        <span class="flex items-center justify-center">
          <span
            class={cn(
              "text-left w-7 h-7 rounded-full flex items-center justify-center",
              {
                "text-fgs3": isNotCurrentMonth && !isToday && !isSelected,
                "bg-aps1 text-abg": isSelected,
                "bg-ass1 text-abg": isToday && !isSelected
              }
            )}
          >
            {day.getDate()}
          </span>
          {#if isToday && !isConstrainedWidth}
            <span class="text-b3 p-1"> Today </span>
          {/if}
        </span>
        {#if indicatorData.length > 0 && showMonthIndicators}
          <div class="pl-1 pt-1 w-full flex-1">
            <CalendarTileIndicator
              isActive={isSelected}
              resolvedData={resolvedIndicatorDataByDay.get(
                resolveIndicatorDayKey(day)
              )}
              type={isConstrainedWidth
                ? CalendarTileIndicatorDisplayType.DOTS
                : CalendarTileIndicatorDisplayType.METRICS}
            />
          </div>
        {/if}
      </button>
    {/each}
  </div>
</div>
<svelte:window
  onfocus={() => {
    today = new Date();
  }}
/>
