<script lang="ts">
  import { onMount } from "svelte";
  import Divider from "@21n/elements/Divider.svelte";
  import Icon from "@21n/elements/Icon.svelte";
  import dayjs from "dayjs";
  import "dayjs/locale/en";
  import { Size } from "@21n/elements/size.enum";
  import Button from "@21n/elements/button/Button.svelte";
  import { abg, bg, cn } from "@21n/utils/ui.utils";
  import { isSameDay } from "@21n/utils/time.utils";
  import DateInputBox from "@21n/elements/datetime/absolute/DateInputBox.svelte";
  let {
    parentBgIndex = 0,
    isDatePickerMode = false,
    selectedDate = new Date(),
    isInline = false,
    initialStartDate = null,
    initialEndDate = null,
    onDateChange,
    onRangeChange
  }: any = $props();

  const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
  const MONTHS = Array.from({ length: 12 }, (_, i) =>
    dayjs().month(i).format("MMM")
  );

  let today = dayjs();
  let currentView = $state(
    isDatePickerMode
    ? dayjs(selectedDate)
    : initialStartDate && dayjs(initialStartDate).isValid()
      ? dayjs(initialStartDate)
      : dayjs()
  );
  let selectedYear = $state(currentView.year());

  let startDate = $state<dayjs.Dayjs | null>(
    initialStartDate && dayjs(initialStartDate).isValid()
      ? dayjs(initialStartDate)
      : null
  );
  let endDate = $state<dayjs.Dayjs | null>(
    initialEndDate && dayjs(initialEndDate).isValid()
      ? dayjs(initialEndDate)
      : null
  );
  let isSelectingEnd = $state(false);
  let isSelectingStart = $state(true);
  const selectedMonth = $derived(currentView.month());
  const calendarRows = $derived(generateCalendarRows(currentView));

  onMount(() => {
    dayjs.locale("en");
  });

  function generateCalendarRows(date: dayjs.Dayjs) {
    const firstDayOfMonth = date.startOf("month");
    const lastDayOfMonth = date.endOf("month");
    const startDayIndex =
      firstDayOfMonth.day() === 0 ? 6 : firstDayOfMonth.day() - 1;

    const rows: (number | null)[][] = Array(6)
      .fill(0)
      .map(() => Array(7).fill(null));

    let currentDate = firstDayOfMonth;
    let weekRow = 0;
    let weekDay = startDayIndex;

    while (currentDate.isSame(lastDayOfMonth, "month")) {
      rows[weekRow][weekDay] = currentDate.date();
      weekDay++;
      if (weekDay === 7) {
        weekDay = 0;
        weekRow++;
      }
      currentDate = currentDate.add(1, "day");
    }

    return rows;
  }

  function handleYearChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const year = parseInt(input.value);
    if (!isNaN(year) && year > 1900 && year < 2100) {
      selectedYear = year;
      if (isDatePickerMode) {
        currentView = dayjs(currentView).year(year);
      } else {
        currentView = currentView.year(year);
      }
    }
  }

  function selectMonth(month: number) {
    if (isDatePickerMode) {
      currentView = dayjs(currentView).month(month - 1);
    } else {
      currentView = currentView.month(month - 1);
    }
  }

  /**
   * Selects a day in the calendar.
   * If the date picker mode is active, it will select the day and update the current view.
   * If the date picker mode is not active, it will select the day and update the start or end date depending on the state.
   * @param day - The day to select.
   */
  function selectDay(day: number) {
    const selectedDay = currentView.date(day);

    if (isDatePickerMode) {
      selectedDate = selectedDay.toDate();
      currentView = dayjs(selectedDay);
      dispatchDateChange(selectedDate);
      return;
    }

    if (isSelectingStart) {
      startDate = selectedDay;
      currentView = selectedDay;
      if (!endDate) {
        isSelectingStart = false;
        isSelectingEnd = true;
      }
      dispatchRangeChange({
        start: startDate.format("YYYY-MM-DD"),
        end: endDate ? endDate.format("YYYY-MM-DD") : ""
      });
    } else if (isSelectingEnd) {
      if (selectedDay.isBefore(startDate)) {
        return;
      }
      endDate = selectedDay;
      dispatchRangeChange({
        start: startDate?.format("YYYY-MM-DD") ?? "",
        end: endDate.format("YYYY-MM-DD")
      });
    }
    selectedYear = currentView.year();
  }

  function dispatchDateChange(val: Date) {
    if (onDateChange) onDateChange(val);
  }

  function dispatchRangeChange(val: { start: string; end: string }) {
    if (onRangeChange) onRangeChange(val);
  }

  function isDateInRange(date: dayjs.Dayjs): boolean {
    if (!startDate || !endDate) return false;
    return (
      (date.isAfter(startDate) || date.isSame(startDate, "day")) &&
      (date.isBefore(endDate) || date.isSame(endDate, "day"))
    );
  }

  function resetStart() {
    startDate = null;
    isSelectingEnd = false;
    dispatchRangeChange({
      start: "",
      end: endDate ? endDate.format("YYYY-MM-DD") : ""
    });
  }
  function resetEnd() {
    endDate = null;
    isSelectingEnd = true;
    dispatchRangeChange({
      start: startDate ? startDate.format("YYYY-MM-DD") : "",
      end: ""
    });
  }

  function setSelectionMode(selectingEnd: boolean, event: MouseEvent) {
    event.stopPropagation();
    isSelectingEnd = selectingEnd;
    isSelectingStart = !selectingEnd;

    if (selectingEnd) {
      if (endDate) {
        currentView = endDate;
        selectedYear = endDate.year();
      } else if (startDate) {
        currentView = startDate.add(1, "month");
        selectedYear = currentView.year();
      }
    } else {
      if (startDate) {
        currentView = startDate;
        selectedYear = startDate.year();
      } else if (endDate) {
        currentView = endDate.subtract(1, "month");
        selectedYear = currentView.year();
      }
    }
  }

  function handleClearClick(clearStart: boolean, event: MouseEvent) {
    event.stopPropagation();
    if (clearStart) {
      resetStart();
    } else {
      resetEnd();
    }
  }

  function navigateMonth(delta: number) {
    if (isDatePickerMode) {
      currentView = dayjs(currentView).add(delta, "month");
    } else {
      currentView = currentView.add(delta, "month");
    }
  }

  function navigateYear(delta: number) {
    const newYear = selectedYear + delta;
    if (newYear > 1900 && newYear < 2100) {
      selectedYear = newYear;
      if (isDatePickerMode) {
        currentView = dayjs(currentView).year(newYear);
      } else {
        currentView = currentView.year(newYear);
      }
    }
  }

  function handleDateInput(input: string, isStart: boolean) {
    if (input.length < 10) {
      if (input.length >= 4) {
        const year = parseInt(input.substring(0, 4));
        if (!isNaN(year) && year >= 1900 && year <= 2100) {
          selectedYear = year;
          currentView = currentView.year(year);
        }
      }

      if (input.length >= 7) {
        const month = parseInt(input.substring(5, 7));
        if (!isNaN(month) && month >= 1 && month <= 12) {
          currentView = currentView.month(month - 1);
        }
      }

      return;
    }

    const parsed = dayjs(input, "YYYY-MM-DD", true);
    if (parsed.isValid()) {
      if (isStart) {
        startDate = parsed;
        if (!isSelectingEnd) {
          currentView = parsed;
          selectedYear = parsed.year();
        }
        dispatchRangeChange({
          start: startDate.format("YYYY-MM-DD"),
          end: endDate ? endDate.format("YYYY-MM-DD") : ""
        });
      } else {
        if (startDate && parsed.isBefore(startDate)) {
          return;
        }
        endDate = parsed;
        if (isSelectingEnd) {
          currentView = parsed;
          selectedYear = parsed.year();
        }
        dispatchRangeChange({
          start: startDate ? startDate.format("YYYY-MM-DD") : "",
          end: endDate.format("YYYY-MM-DD")
        });
      }
    }
  }

  function onStartInputChange(value: string) {
    handleDateInput(value, true);
  }

  function onStartClear(event: MouseEvent) {
    handleClearClick(true, event);
  }

  function onStartBoxClick(event: MouseEvent) {
    setSelectionMode(false, event);
  }

  function onEndInputChange(value: string) {
    handleDateInput(value, false);
  }

  function onEndClear(event: MouseEvent) {
    handleClearClick(false, event);
  }

  function onEndBoxClick(event: MouseEvent) {
    setSelectionMode(true, event);
  }
</script>

<button
  class={cn("flex flex-col gap-4 text-fgs3 cw:w-full w-[20rem]", {
    [bg(parentBgIndex)]: true,
    "p-3 cw:rounded-none rounded-md cw:shadow-none shadow-lg cw:border-none border border-brs2":
      !isInline
  })}
  onclick={(event) => event.stopPropagation()}
>
  {#if !isDatePickerMode}
    <div class="flex w-full gap-4">
      <DateInputBox
        {parentBgIndex}
        isActive={isSelectingStart && !isSelectingEnd}
        selectedDate={startDate}
        label="Start"
        onInputChange={onStartInputChange}
        onClear={onStartClear}
        onBoxClick={onStartBoxClick}
      />
      <DateInputBox
        {parentBgIndex}
        isActive={isSelectingEnd}
        selectedDate={endDate}
        label="End"
        onInputChange={onEndInputChange}
        onClear={onEndClear}
        onBoxClick={onEndBoxClick}
      />
    </div>
    <Divider />
  {/if}
  <div class="flex items-center w-full justify-between text-b2">
    <div class="flex gap-2 items-center">
      <Button
        icon="chevron-left"
        size={Size.xs}
        onclick={() => navigateYear(-1)}
      />
      <input
        type="number"
        min="1900"
        max="2100"
        class={cn("w-20 px-2 py-1 rounded-md", bg(parentBgIndex + 1))}
        value={selectedYear}
        onchange={handleYearChange}
      />
      <Button
        icon="chevron-right"
        size={Size.xs}
        onclick={() => navigateYear(1)}
      />
    </div>
  </div>

  <div class="grid grid-rows-2 gap-1 w-full">
    <div class="grid grid-cols-6 gap-1 w-full">
      {#each MONTHS.slice(0, 6) as month, i}
        <button
          class={cn(
            "px-1.5 py-1 rounded-md text-b3 transition-colors",
            i === selectedMonth ? abg() : "hover:bg-bgs2"
          )}
          onclick={() => selectMonth(i + 1)}
        >
          {month}
        </button>
      {/each}
    </div>
    <div class="grid grid-cols-6 gap-1 w-full">
      {#each MONTHS.slice(6) as month, i}
        <button
          class={cn(
            "px-1.5 py-1 rounded-md text-b3 transition-colors",
            i + 6 === selectedMonth ? abg() : "hover:bg-bgs2"
          )}
          onclick={() => selectMonth(i + 7)}
        >
          {month}
        </button>
      {/each}
    </div>
  </div>
  <Divider />
  <div class="flex flex-col w-full number-grid-size">
    <table class="w-full text-b3 border-separate border-spacing-0">
      <thead>
        <tr>
          {#each DAYS as day}
            <td>
              <div class="flex w-full p-1 justify-center">
                <p class="text-center text-b4 text-fgs3">
                  {day}
                </p>
              </div>
            </td>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each calendarRows as week}
          <tr>
            {#each week as day}
              <td class="p-0">
                {#if day !== null}
                  {@const date = currentView.date(day)}
                  <div
                    class="flex w-full h-9 justify-center items-center relative"
                  >
                    {#if startDate && endDate && isDateInRange(date)}
                      <div class="absolute inset-0 bg-aps2/20" />
                    {/if}
                    {#if (startDate && date.isSame(startDate, "day")) || (endDate && date.isSame(endDate, "day"))}
                      <div class="absolute inset-0 bg-aps1" />
                    {/if}
                    <button
                      data-day={date}
                      class={cn(
                        "rounded-md w-7 h-7 text-b2 flex items-center justify-center relative z-10 border border-transparent",
                        {
                          "text-abg bg-aps1 !border-aps1":
                            (isDatePickerMode &&
                              date.isSame(dayjs(selectedDate), "day")) ||
                            (startDate && date.isSame(startDate, "day")) ||
                            (endDate && date.isSame(endDate, "day")),
                          "!border-ass1":
                            date.isSame(today, "day") &&
                            !(
                              isDatePickerMode &&
                              date.isSame(dayjs(selectedDate), "day")
                            ) &&
                            !(startDate && date.isSame(startDate, "day")) &&
                            !(endDate && date.isSame(endDate, "day")),
                          "hover:bg-bgs2":
                            !date.isSame(today, "day") &&
                            !isDateInRange(date) &&
                            !(
                              isDatePickerMode &&
                              date.isSame(dayjs(selectedDate), "day")
                            ) &&
                            !date.isSame(startDate, "day") &&
                            !date.isSame(endDate, "day")
                        }
                      )}
                      onclick={() => selectDay(day)}
                    >
                      {day}
                    </button>
                  </div>
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</button>
