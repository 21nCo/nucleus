<script lang="ts">
  import Roller from "@nucleum/features/calendar/birdView/Roller.svelte";
  import {
    Itemtype,
    type YearPhase,
    type ProgrammedVerticalWheelEvent
  } from "@nucleum/features/calendar/birdView/Birdview.type";
  import {
    currentDate,
    currentMonth,
    currentMonthEndDate,
    currentYear,
    getDaysInMonth,
    getLastAlphabetPosition,
    waitForTimeout
  } from "@nucleum/features/calendar/birdView/Birdview.utils";
  import { onMount as onLifecycleMount } from "svelte";
  import { debouncer } from "@21n/utils/utils";
  import { TimeScaleUnit } from "@21n/utils/time.type";

  type SelectedDateChange =
    | string
    | {
        selectedDate: string;
        isPostive: boolean;
      };

  type SelectedMonthChange =
    | string
    | {
        selectedMonth: string;
        isPostive: boolean;
      };

  type SelectedYearChange =
    | number
    | {
        selectedYear: number;
        isPostive: boolean;
      };

  type RollerPickerMountPayload = {
    handleDaysWheelEvent: (
      e: WheelEvent | ProgrammedVerticalWheelEvent
    ) => Promise<void | true>;
    handleMonthsWheelEvent: (
      e: WheelEvent | ProgrammedVerticalWheelEvent
    ) => Promise<void | true>;
    handleYearsWheelEvent: (
      e: WheelEvent | ProgrammedVerticalWheelEvent
    ) => Promise<void | true>;
  };

  let containerHeight = $state(0);
  let monthNames = [
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
  let {
    mode,
    birthdate = undefined,
    groupByBirthdate = false,
    yearPhases = [],
    onSelectedDateReset = undefined,
    onSelectedMonthReset = undefined,
    onSelectedDateChange = undefined,
    onSelectedMonthChange = undefined,
    onSelectedYearChange = undefined,
    onMount = undefined
  }: {
    mode: TimeScaleUnit;
    birthdate?: Date | string;
    groupByBirthdate?: boolean;
    yearPhases?: YearPhase[];
    onSelectedDateReset?: ((selectedDate: string) => void) | undefined;
    onSelectedMonthReset?: ((selectedMonth: string) => void) | undefined;
    onSelectedDateChange?: ((detail: SelectedDateChange) => void) | undefined;
    onSelectedMonthChange?: ((detail: SelectedMonthChange) => void) | undefined;
    onSelectedYearChange?: ((detail: SelectedYearChange) => void) | undefined;
    onMount?: ((detail: RollerPickerMountPayload) => void) | undefined;
  } = $props();

  let selectedYear = $state(currentYear);
  let selectedMonth = $state(currentYear + currentMonth);
  let selectedMonthEndDate = $state(currentMonthEndDate);
  let selectedDate = $state(selectedMonth + currentDate.getDate());
  const lowerYearLimit = currentYear - 25;
  let years = $state(Array.from({ length: 50 }, (_, i) => lowerYearLimit + i));
  let yearsForMonths = $state(getYearsForMonths());
  let days = $state([] as string[]);

  let monthContainer: HTMLDivElement;
  let yearContainer: HTMLDivElement;
  let dayContainer: HTMLDivElement;
  let scrollToSelectedYear: () => void;
  let scrollToSelectedMonth: () => void;
  let scrollToSelectedDay: () => void;
  const rollerItemHeight = 30;

  let rollerConfig = $state({
    itemHeight: rollerItemHeight,
    containerHeight: 744
  });

  const debouncedDispatchSelectedDateReset = debouncer(
    () => onSelectedDateReset?.(selectedDate),
    200
  );

  const debouncedDispatchSelectedMonthReset = debouncer(
    () => onSelectedMonthReset?.(selectedMonth),
    200
  );

  function getDatesInMonth(year: number, month: number) {
    const numDays = new Date(year, month + 1, 0).getDate();
    return Array.from(
      { length: numDays },
      (_, i) => `${selectedYear}${monthNames[month]}${i + 1}`
    );
  }

  function updateDays() {
    days = [];
    const monthIndex = monthNames.indexOf(selectedMonth.slice(-3));
    const x = monthIndex == 0 ? 11 : monthIndex - 1;
    const y = monthIndex;
    const z = monthIndex == 11 ? 0 : monthIndex + 1;
    days = [
      ...getDatesInMonth(selectedYear, x),
      ...getDatesInMonth(selectedYear, y),
      ...getDatesInMonth(selectedYear, z)
    ];
  }
  updateDays();

  /**
   * A closure function to remember the previous month so that it can be used to update the days roller when year changes and also invoked on month change with the month value.
   */
  let updateSelectedMonthEndDate = (function () {
    let prevMonth = selectedMonth;
    return function (updateToMonth?: string) {
      if (updateToMonth != undefined) prevMonth = updateToMonth;
      selectedMonthEndDate = getDaysInMonth(
        monthNames.indexOf(prevMonth),
        selectedYear
      );
    };
  })();

  function updateSelectedYear(isPositive: boolean) {
    if (isPositive) {
      selectedYear = Number(selectedYear) + 1;
    } else {
      selectedYear = Number(selectedYear) - 1;
    }
  }

  function getTopElement(items: any[]): number {
    let value: number = 0;
    items.forEach((item: number) => {
      const selectedItemElement: HTMLElement | null =
        yearContainer.querySelector(`[data-year="${item}"]`);
      if (
        Math.ceil(yearContainer.scrollTop) +
          (yearContainer.clientHeight - rollerConfig.itemHeight) / 2 ==
        selectedItemElement?.offsetTop
      ) {
        value = item;
      }
    });
    return value;
  }

  function updateYears(isPositive: boolean) {
    if (isPositive) {
      years = [...years, years[years.length - 1] + 1];
      years.shift();
      yearsForMonths = [
        ...yearsForMonths,
        yearsForMonths[yearsForMonths.length - 1] + 1
      ];
      yearsForMonths.shift();
    } else {
      years = [years[0] - 1, ...years];
      years.pop();
      yearsForMonths = [yearsForMonths[0] - 1, ...yearsForMonths];
      yearsForMonths.pop();
    }
  }

  function getYearsForMonths() {
    const index = years.findIndex((year) => year == selectedYear);
    if (index !== -1) {
      const start = Math.max(0, index - 3);
      const end = Math.min(years.length, index + 4);
      const surroundingYears = years.slice(start, end);
      return surroundingYears;
    }
    return [];
  }

  async function handleYearsWheelEvent(
    e: WheelEvent | ProgrammedVerticalWheelEvent
  ): Promise<void | true> {
    if (e instanceof WheelEvent) e.preventDefault();
    if (e.deltaY > 0) {
      if (selectedYear == 9969) return true;
      updateYears(true);
      updateSelectedYear(true);
    } else {
      if (selectedYear == 0) return true;
      updateYears(false);
      updateSelectedYear(false);
    }
    await waitForTimeout(scrollToSelectedYear);
    selectedMonth = selectedYear + selectedMonth.slice(-3);
    updateSelectedMonthEndDate();
    updateDays();
    const lastAlphIndex = getLastAlphabetPosition(selectedDate);
    if (e instanceof WheelEvent || e.isWheelEvent == true) {
      selectedDate =
        selectedYear +
        selectedMonth.slice(-3) +
        (Number(selectedDate.slice(lastAlphIndex + 1)) > selectedMonthEndDate
          ? selectedMonthEndDate
          : selectedDate.slice(lastAlphIndex + 1));
      if (mode == TimeScaleUnit.PART) {
        debouncedDispatchSelectedDateReset();
        await waitForTimeout(scrollToSelectedDay);
      } else if (mode == TimeScaleUnit.DAY)
        debouncedDispatchSelectedMonthReset();
      else if (mode == TimeScaleUnit.MONTH)
        if (!e?.isPanelEvent) {
          onSelectedYearChange?.({
            selectedYear,
            isPostive: e?.deltaY > 0
          });
        }
    }
  }

  async function handleMonthsWheelEvent(
    e: WheelEvent | ProgrammedVerticalWheelEvent
  ): Promise<void | true> {
    if (e instanceof WheelEvent) e.preventDefault();
    let updateToMonth;
    const month = selectedMonth.slice(-3);
    const monthIndex = monthNames.indexOf(month);
    let limitReached: Promise<true | void>;
    if (e.deltaY > 0) {
      if (month == "Dec") {
        limitReached = handleYearsWheelEvent({
          deltaY: 1,
          isWheelEvent: false
        });
        if (await limitReached) {
          return true;
        }
      }
      updateToMonth = monthNames[(monthIndex + 1) % 12];
      selectedMonth = selectedYear + updateToMonth;
    } else {
      if (month == "Jan") {
        limitReached = handleYearsWheelEvent({
          deltaY: -1,
          isWheelEvent: false
        });
        if (await limitReached) {
          return true;
        }
      }
      updateToMonth = monthNames[monthIndex == 0 ? 11 : monthIndex - 1];
      selectedMonth = selectedYear + updateToMonth;
    }
    await waitForTimeout(scrollToSelectedMonth);
    updateSelectedMonthEndDate(selectedMonth.slice(-3));
    updateDays();
    const lastAlphIndex = getLastAlphabetPosition(selectedDate);
    selectedDate =
      selectedYear +
      selectedMonth.slice(-3) +
      (Number(selectedDate.slice(lastAlphIndex + 1)) > selectedMonthEndDate
        ? selectedMonthEndDate
        : selectedDate.slice(lastAlphIndex + 1));
    if (e instanceof WheelEvent || e.isWheelEvent == true) {
      if (mode == TimeScaleUnit.PART) {
        debouncedDispatchSelectedDateReset();
        await waitForTimeout(scrollToSelectedDay);
      } else if (mode == TimeScaleUnit.DAY)
        onSelectedMonthChange?.({
          selectedMonth,
          isPostive: e?.deltaY > 0
        });
    }
  }

  async function handleDaysWheelEvent(
    e: WheelEvent | ProgrammedVerticalWheelEvent
  ) {
    if (e instanceof WheelEvent) e.preventDefault();
    let day: number;
    const lastAlphIndex = getLastAlphabetPosition(selectedDate);
    if (e.deltaY > 0) {
      const lastMonthIndex = monthNames.indexOf(
        days[days.length - 1].slice(4, 7)
      );
      day = Number(selectedDate.slice(lastAlphIndex + 1)) + 1;
      if (day <= selectedMonthEndDate) {
        selectedDate = selectedYear + selectedMonth.slice(-3) + day;
      } else {
        const monthIndex = monthNames.indexOf(selectedMonth.slice(-3));
        if (monthIndex == 11 && selectedYear == 9969) return true;
        const month = monthNames[(monthIndex + 1) % 12];
        selectedDate = selectedYear + month + 1;
        handleMonthsWheelEvent({ deltaY: 1, isWheelEvent: false });
      }
    } else {
      day = Number(selectedDate.slice(lastAlphIndex + 1)) - 1;
      if (day >= 1) selectedDate = selectedYear + selectedMonth.slice(-3) + day;
      else {
        const monthIndex = monthNames.indexOf(selectedMonth.slice(-3));
        if (monthIndex == 0 && selectedYear == 0) return true;
        const month = monthNames[monthIndex == 0 ? 11 : monthIndex - 1];
        updateSelectedMonthEndDate(month);
        selectedDate = selectedYear + month + selectedMonthEndDate;
        handleMonthsWheelEvent({ deltaY: -1, isWheelEvent: false });
      }
    }

    if (!e?.isPanelEvent) {
      onSelectedDateChange?.({
        selectedDate,
        isPostive: e?.deltaY > 0
      });
    }
    await waitForTimeout(scrollToSelectedDay);
  }
  onLifecycleMount(() => {
    rollerConfig = {
      itemHeight: rollerItemHeight,
      containerHeight: containerHeight
    };
    if (mode == TimeScaleUnit.PART) onSelectedDateChange?.(selectedDate);
    else if (mode == TimeScaleUnit.DAY) onSelectedMonthChange?.(selectedMonth);
    else if (mode == TimeScaleUnit.MONTH) onSelectedYearChange?.(selectedYear);

    onMount?.({
      handleDaysWheelEvent,
      handleMonthsWheelEvent,
      handleYearsWheelEvent
    });
  });
</script>

<div
  class="relative flex bg-bgs1 border-r border-brs2"
  bind:clientHeight={containerHeight}
>
  <Roller
    handleWheelEvent={handleYearsWheelEvent}
    items={years}
    bind:container={yearContainer}
    bind:selectedItem={selectedYear}
    config={{
      ...rollerConfig,
      itemType: Itemtype.YEAR,
      birthdate,
      groupByBirthdate,
      yearPhases
    }}
    onMount={(scrollToSelectedItem) =>
      (scrollToSelectedYear = scrollToSelectedItem)}
  />
  {#if mode == TimeScaleUnit.MONTH || mode == TimeScaleUnit.DAY || mode == TimeScaleUnit.PART}
    <Roller
      handleWheelEvent={handleMonthsWheelEvent}
      items={yearsForMonths}
      bind:container={monthContainer}
      bind:selectedItem={selectedMonth}
      config={{
        ...rollerConfig,
        itemType: Itemtype.MONTH,
        birthdate,
        groupByBirthdate
      }}
      onMount={(scrollToSelectedItem) =>
        (scrollToSelectedMonth = scrollToSelectedItem)}
    />
  {/if}
  {#if mode == TimeScaleUnit.DAY || mode == TimeScaleUnit.PART}
    <Roller
      handleWheelEvent={handleDaysWheelEvent}
      items={days}
      bind:container={dayContainer}
      bind:selectedItem={selectedDate}
      config={{
        ...rollerConfig,
        itemType: Itemtype.DAY,
        birthdate,
        groupByBirthdate
      }}
      onMount={(scrollToSelectedItem) =>
        (scrollToSelectedDay = scrollToSelectedItem)}
    />
  {/if}
  <div
    class="absolute z-0 w-full bg-aps3"
    style="top:{containerHeight / 2 -
      rollerConfig.itemHeight /
        2}px;height:{rollerConfig.itemHeight}px;max-height:{rollerConfig.itemHeight}px;"
  ></div>
</div>
