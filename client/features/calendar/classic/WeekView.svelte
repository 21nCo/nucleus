<script lang="ts">
  import { Size } from "@21n/types/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import { onMount } from "svelte";

  let {
    selectedDate = $bindable(new Date()),
    events = [],
    onMonthChange = void 0,
    onVisibleDatesChange = void 0
  }: {
    selectedDate?: Date;
    events?: any[];
    onMonthChange?: (date: Date) => void;
    onVisibleDatesChange?: (payload: { dates: Date[] }) => void;
  } = $props();

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const INITIAL_RANGE = 10; // Initial number of weeks to show
  let weeks = $state<ReturnType<typeof getWeekData>[]>(loadInitialWeeks(selectedDate));
  let containerRef: HTMLDivElement;
  let headerRef: HTMLDivElement;
  let lastScrollLeft = 0;
  let scrollTimeout: ReturnType<typeof setTimeout> | undefined;
  let isExplicitNavigation = false;

  function getWeekDates(date: Date) {
    const week = [];
    const current = new Date(date);
    current.setDate(current.getDate() - current.getDay()); // Start from Sunday

    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return week;
  }

  function getWeekData(startDate: Date) {
    return {
      startDate: new Date(startDate),
      dates: getWeekDates(startDate)
    };
  }

  function loadInitialWeeks(centerDate: Date) {
    const halfRange = Math.floor(INITIAL_RANGE / 2);
    const centerWeekStart = new Date(centerDate);
    centerWeekStart.setDate(
      centerWeekStart.getDate() - centerWeekStart.getDay()
    );

    const weeks = [];
    for (let i = -halfRange; i < halfRange; i++) {
      const weekStart = new Date(centerWeekStart);
      weekStart.setDate(weekStart.getDate() + i * 7);
      weeks.push(getWeekData(weekStart));
    }
    return weeks.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  function loadMoreWeeks(direction: "left" | "right") {
    const BATCH_SIZE = 5;
    const currentWeeks = [...weeks];
    const newWeeks = [];

    if (direction === "left") {
      const firstWeek = currentWeeks[0];
      const startDate = new Date(firstWeek.startDate);
      for (let i = 1; i <= BATCH_SIZE; i++) {
        startDate.setDate(startDate.getDate() - 7);
        newWeeks.push(getWeekData(new Date(startDate)));
      }
      weeks = [...newWeeks.reverse(), ...currentWeeks];
    } else {
      const lastWeek = currentWeeks[currentWeeks.length - 1];
      const startDate = new Date(lastWeek.startDate);
      for (let i = 1; i <= BATCH_SIZE; i++) {
        startDate.setDate(startDate.getDate() + 7);
        newWeeks.push(getWeekData(new Date(startDate)));
      }
      weeks = [...currentWeeks, ...newWeeks];
    }
  }

  function onScroll() {
    if (!containerRef || !headerRef) return;

    // Sync header scroll with content
    headerRef.scrollLeft = containerRef.scrollLeft;

    if (isExplicitNavigation) {
      isExplicitNavigation = false;
      return;
    }

    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    scrollTimeout = setTimeout(() => {
      if (!containerRef) return;

      const { scrollLeft, scrollWidth, clientWidth } = containerRef;
      const isScrollingRight = scrollLeft > lastScrollLeft;
      lastScrollLeft = scrollLeft;

      // Get the visible week's dates and emit them
      const visibleWeekIndex = Math.round(scrollLeft / clientWidth);
      const visibleWeek = weeks[visibleWeekIndex];
      if (visibleWeek) {
        onVisibleDatesChange?.({ dates: visibleWeek.dates });
        // Also update selectedDate to match the visible week
        selectedDate = new Date(visibleWeek.startDate);
        onMonthChange?.(selectedDate);
      }

      // Load more weeks when scrolling near the edges
      if (
        isScrollingRight &&
        scrollWidth - (scrollLeft + clientWidth) < clientWidth
      ) {
        loadMoreWeeks("right");
      } else if (!isScrollingRight && scrollLeft < clientWidth) {
        loadMoreWeeks("left");
      }
    }, 100);
  }

  function scrollToToday() {
    if (!containerRef || !headerRef) return;

    const today = new Date();
    const todayWeekStart = new Date(today);
    todayWeekStart.setDate(today.getDate() - today.getDay());

    // Find the week containing today
    const weekIndex = weeks.findIndex((week) => {
      const weekStart = week.startDate;
      return (
        weekStart.getFullYear() === todayWeekStart.getFullYear() &&
        weekStart.getMonth() === todayWeekStart.getMonth() &&
        weekStart.getDate() === todayWeekStart.getDate()
      );
    });

    if (weekIndex === -1) {
      // If today's week is not loaded, reload weeks centered on today
      weeks = loadInitialWeeks(today);
      isExplicitNavigation = true;
      setTimeout(() => {
        if (containerRef) {
          const weekElement =
            containerRef.children[Math.floor(INITIAL_RANGE / 2)];
          weekElement.scrollIntoView({ behavior: "smooth", inline: "center" });
          headerRef.scrollLeft = containerRef.scrollLeft;
        }
      }, 0);
    } else {
      isExplicitNavigation = true;
      const weekElement = containerRef.children[weekIndex];
      weekElement.scrollIntoView({ behavior: "smooth", inline: "center" });
      headerRef.scrollLeft = containerRef.scrollLeft;
    }
  }

  function navigateWeek(direction: "previous" | "next") {
    if (!containerRef || !headerRef) return;

    const currentScrollLeft = containerRef.scrollLeft;
    const weekWidth = containerRef.firstElementChild?.clientWidth || 0;

    isExplicitNavigation = true;
    containerRef.scrollTo({
      left: currentScrollLeft + (direction === "next" ? weekWidth : -weekWidth),
      behavior: "smooth"
    });
    headerRef.scrollLeft = containerRef.scrollLeft;
  }

  onMount(() => {
    const initialWeek = weeks[Math.floor(INITIAL_RANGE / 2)];
    if (initialWeek) {
      onVisibleDatesChange?.({ dates: initialWeek.dates });
    }
  });

  function isToday(date: Date) {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  export function scrollToPrevWeek() {
    navigateWeek("previous");
  }

  export function scrollToNextWeek() {
    navigateWeek("next");
  }

  export { scrollToToday };
</script>

<div class="grid grid-cols-[auto_1fr] h-full">
  <!-- Time labels -->
  <div class="border-r border-brs3">
    <div class="h-12 border-b border-brs3" />
    <!-- Empty corner -->
    {#each hours as hour}
      <div
        class="h-12 px-2 border-b border-brs3 text-fgs3 text-sm flex items-center justify-end"
      >
        {hour === 0 ? "12" : hour > 12 ? hour - 12 : hour}
        {hour >= 12 ? "PM" : "AM"}
      </div>
    {/each}
  </div>

  <!-- Week grid with horizontal scrolling -->
  <div class="overflow-hidden flex flex-col">
    <!-- Day headers with horizontal scroll -->
    <div
      class="overflow-x-auto border-b border-brs3 bg-bgs1"
      bind:this={headerRef}
    >
      <div class="flex min-w-fit">
        {#each weeks as week}
          <div class="grid grid-cols-7 min-w-full">
            {#each week.dates as date}
              <div
                class="flex flex-col items-center justify-center h-12 border-l border-brs3 first:border-l-0"
              >
                <div class="text-sm text-fgs2">{weekDays[date.getDay()]}</div>
                <div
                  class={cn(
                    "text-sm",
                    isToday(date) && "text-aps1 font-medium"
                  )}
                >
                  {date.getDate()}
                </div>
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>

    <!-- Scrollable weeks container -->
    <div
      class="flex overflow-x-auto flex-1"
      bind:this={containerRef}
      onscroll={onScroll}
    >
      {#each weeks as week}
        <div class="grid grid-cols-7 min-w-full">
          {#each week.dates as date}
            <div class="border-l border-brs3 first:border-l-0">
              {#each hours as hour}
                <div class="h-12 border-b border-brs3" />
              {/each}
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>
</div>
