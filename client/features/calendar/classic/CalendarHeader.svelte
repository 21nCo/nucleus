<script lang="ts">
  import { TimeScaleUnit } from "@21n/types/time.type";
  import DatePicker from "@21n/elements/datetime/DatePicker.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import BoxButton from "@21n/elements/button/BoxButton.svelte";

  let {
    selectedDate = $bindable(new Date()),
    selectedView = $bindable(TimeScaleUnit.MONTH),
    visibleWeekDates = undefined,
    parentBgIndex = 2,
    onDateChange = undefined,
    onGoToPrevious = undefined,
    onGoToNext = undefined
  }: {
    selectedDate?: Date;
    selectedView?: TimeScaleUnit;
    visibleWeekDates?: Date[];
    parentBgIndex?: number;
    onDateChange?: (() => void) | undefined;
    onGoToPrevious?: (() => void) | undefined;
    onGoToNext?: (() => void) | undefined;
  } = $props();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];

  function goToPrevious() {
    if (
      selectedView === TimeScaleUnit.YEAR ||
      selectedView === TimeScaleUnit.WEEK
    ) {
      onGoToPrevious?.();
    } else {
      const date = new Date(selectedDate);
      switch (selectedView) {
        case TimeScaleUnit.MONTH:
          date.setMonth(date.getMonth() - 1);
          break;
        case TimeScaleUnit.DAY:
          date.setDate(date.getDate() - 1);
          break;
      }
      selectedDate = date;
      onDateChange?.();
    }
  }

  function goToNext() {
    if (
      selectedView === TimeScaleUnit.YEAR ||
      selectedView === TimeScaleUnit.WEEK
    ) {
      onGoToNext?.();
    } else {
      const date = new Date(selectedDate);
      switch (selectedView) {
        case TimeScaleUnit.MONTH:
          date.setMonth(date.getMonth() + 1);
          break;
        case TimeScaleUnit.DAY:
          date.setDate(date.getDate() + 1);
          break;
      }
      selectedDate = date;
      onDateChange?.();
    }
  }

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

  const weekDates = $derived(getWeekDates(selectedDate));
  const currentMonth = $derived(monthNames[selectedDate.getMonth()]);
  const currentYear = $derived(selectedDate.getFullYear());
</script>

<div class="flex items-center justify-center">
  <div class="h-full w-10">
    <BoxButton
      icon="chevron-left"
      ariaLabel="Previous calendar period"
      onclick={goToPrevious}
    />
  </div>
  <h2
    class={cn("text-h4 h-full  flex items-center justify-center px-3", {
      "hover:bg-bgs2-striped": selectedView === TimeScaleUnit.DAY
    })}
  >
    {#if selectedView === TimeScaleUnit.YEAR}
      {currentYear}
    {:else if selectedView === TimeScaleUnit.WEEK}
      {#if visibleWeekDates && visibleWeekDates.length >= 7}
        {monthNames[visibleWeekDates[0].getMonth()]}
        {visibleWeekDates[0].getDate()} - {monthNames[
          visibleWeekDates[6].getMonth()
        ]}
        {visibleWeekDates[6].getDate()}, {visibleWeekDates[6].getFullYear()}
      {:else}
        {monthNames[weekDates[0].getMonth()]}
        {weekDates[0].getDate()} - {monthNames[weekDates[6].getMonth()]}
        {weekDates[6].getDate()}, {currentYear}
      {/if}
    {:else if selectedView === TimeScaleUnit.MONTH}
      {currentMonth} {currentYear}
    {:else}
      <DatePicker bind:date={selectedDate} variant="inline-with-icon" />
    {/if}
  </h2>
  <div class="h-full w-10">
    <BoxButton
      icon="chevron-right"
      ariaLabel="Next calendar period"
      onclick={goToNext}
    />
  </div>
</div>
