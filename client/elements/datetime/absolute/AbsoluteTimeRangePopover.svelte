<script lang="ts">
  import { onMount } from "svelte";
  import Divider from "@21n/elements/Divider.svelte";
  import Icon from "@21n/elements/Icon.svelte";
  import dayjs from "dayjs";
  import "dayjs/locale/en";
  import { Size } from "@21n/elements/size.enum";
  import { TimeScale } from "@21n/utils/time.type";
  import Button from "@21n/elements/button/Button.svelte";
  import { abg, bg, cn } from "@21n/utils/ui.utils";
  import { isSameDay } from "@21n/utils/time.utils";
  let {
    scale = TimeScale.DAYS,
    parentBgIndex = 0,
    isDatePickerMode = false,
    selectedDate = $bindable(new Date()),
    onDateChange,
    onChange,
    onRangePicked,
    isPickerOpen = true
  }: any = $props();
  const yearMode = $derived(scale === TimeScale.YEARS);
  const monthMode = $derived(scale === TimeScale.MONTHS);
  const dayMode = $derived(scale === TimeScale.DAYS);
  const arrDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  let thisDay = +dayjs().format("D"); // 1..31
  let thisMonth = +dayjs().format("M"); // 1..12
  let thisYear = +dayjs().format("YYYY"); // 2021...
  let mapDay = $state(+dayjs().format("D")); // 1..31
  let mapMonth = $state(+dayjs().format("M")); // 1..12
  let mapYear = $state(+dayjs().format("YYYY")); // 2021...
  let startDay = $state<number | undefined>(undefined);
  let startMonth = $state<number | undefined>(undefined);
  let startYear = $state<number | undefined>(undefined);
  let endDay = $state<number | undefined>(undefined);
  let endMonth = $state<number | undefined>(undefined);
  let endYear = $state<number | undefined>(undefined);
  let startString = $state("");
  let endString = $state("");
  let startSelected = $state(false);
  let endSelected = $state(false);
  let selectedDecade = $state(Math.floor(mapYear / 10) * 10); // 2021...
  let rows = $state<any>();
  // let monthPool: any[] = [
  //   mapMonth - 2,
  //   mapMonth - 1,
  //   mapMonth,
  //   mapMonth + 1,
  //   mapMonth + 2
  // ];
  let monthPool = $state<any[]>([...Array.from({ length: 12 }, (_, i) => i + 1)]);
  let yearPool = $state<any[]>([
    mapYear - 2,
    mapYear - 1,
    mapYear,
    mapYear + 1,
    mapYear + 2
  ]);
  $effect(() => {
    if (!isDatePickerMode || !selectedDate) return;
    mapDay = +dayjs(selectedDate).format("D");
    mapMonth = +dayjs(selectedDate).format("M");
    mapYear = +dayjs(selectedDate).format("YYYY");
    startDay = +dayjs(selectedDate).format("D");
    startMonth = +dayjs(selectedDate).format("M");
    startYear = +dayjs(selectedDate).format("YYYY");
    startSelected = true;
    handlePoolChangeForYears();
    getDecade();
  });
  $effect(() => {
    if (monthMode) {
      rows = initMonth();
    } else if (yearMode) {
      rows = initYear();
    } else {
      changeRows();
    }
  });
  let getDecade = () => {
    selectedDecade = Math.floor(mapYear / 10) * 10;
  };
  onMount(() => {
    dayjs.locale("en"); // use locale
    if (dayMode) {
      changeRows();
    } else if (monthMode) {
      rows = initMonth();
    } else if (yearMode) {
      rows = initYear();
    }
  });
  let handlePoolChange = (function () {
    let previousIndex = 1;
    return function (index?: number) {
      if (index !== undefined) {
        previousIndex = index;
        changeRows();
      } else {
        monthPool.forEach((m, i) => {
          monthPool[i] = mapMonth - (previousIndex - i);
        });
      }
    };
  })();

  let handlePoolChangeForYears = (function () {
    let previousIndex = 1;
    return function (index?: number) {
      if (index !== undefined) {
        previousIndex = index;
        changeRows();
      } else {
        yearPool.forEach((m, i) => {
          yearPool[i] = mapYear - (previousIndex - i);
        });
      }
    };
  })();
  function reset(start: boolean = false, end: boolean = false) {
    if (start) {
      startDay = undefined;
      startMonth = undefined;
      startYear = undefined;
      startString = "";
      startSelected = false;
    }
    if (end) {
      endDay = undefined;
      endMonth = undefined;
      endYear = undefined;
      endString = "";
      endSelected = false;
    }
  }

  function enablePicker() {
    mapDay = +dayjs().format("D");
    mapMonth = +dayjs().format("M");
    mapYear = +dayjs().format("YYYY");
    reset(true, true);
    getDecade();
    changeRows();
    isPickerOpen = true;
  }

  function dispatchRangePicked(val: { start: string; end: string }) {
    onRangePicked?.(val);
  }

  function handleOutsideClickModal() {
    if (startString && endString)
      dispatchRangePicked({ start: startString, end: endString });
    startString = "";
    endString = "";
  }

  function initRows() {
    return [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0]
    ];
  }

  function changeRows() {
    if (dayMode) {
      rows = initRows();

      const firstDayOfCurrentMonth = ucFirst(
        dayjs(mapYear + "-" + mapMonth)
          .startOf("month")
          .format("ddd")
      ).toUpperCase(); // 'Wed'
      const lastDayOfCurrentMonth = +dayjs(mapYear + "-" + mapMonth)
        .endOf("month")
        .format("D"); // 31
      let iRow = 0;
      let iCol = 0;
      let start = false;
      let cpt = 0;
      for (iRow = 0; iRow < 6; iRow++) {
        arrDays.forEach((daystr: String) => {
          if (cpt > lastDayOfCurrentMonth) {
            return;
          }
          if (!start && daystr === firstDayOfCurrentMonth) {
            cpt++;
            start = true;
          }
          rows[iRow][iCol] = cpt;
          iCol++;
          if (start) {
            cpt++;
          }
        });
        iCol = 0;
      }
    } else if (monthMode) {
      rows = initMonth();
    } else if (yearMode) {
      rows = initYear();
    }
  }
  function initMonth() {
    return [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12]
    ];
  }
  function initYear() {
    return [
      [-1, 0, 1, 2],
      [3, 4, 5, 6],
      [7, 8, 9, 10]
    ];
  }

  function ucFirst(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  function previousDecade() {
    selectedDecade--;
    previousYear(10);
    // changeRows()
  }

  function previousMonth(decreaseConst: number) {
    mapMonth -= decreaseConst;
    if (mapMonth <= 0) {
      mapMonth += 12;
      mapYear--;
      getDecade();
    }
    changeRows();
    handlePoolChange();
  }
  function previousYear(decreaseConst: number) {
    mapYear -= decreaseConst;
    getDecade();
    changeRows();
    handlePoolChangeForYears();
  }

  function nextMonth(increaseConst: number) {
    mapMonth += increaseConst;
    if (mapMonth > 12) {
      mapMonth = increaseConst % 12;
      mapYear++;
      getDecade();
    }
    changeRows();
    handlePoolChange();
  }
  function nextYear(increaseConst: number) {
    mapYear += increaseConst;
    getDecade();
    changeRows();
    handlePoolChangeForYears();
  }
  function nextDecade() {
    selectedDecade++;
    nextYear(10);
  }

  function dispatchDateChange(val: Date) {
    onChange?.(val);
    onDateChange?.(val);
  }

  function selectDate(y: number, m: number, d: number) {
    let date = y + "-" + m + "-" + d;
    if (isDatePickerMode) {
      selectedDate = new Date(dayjs(date).format("YYYY-MM-DD"));
      dispatchDateChange(selectedDate);
      return;
    }
    if (startSelected == false || dayjs(date).isBefore(dayjs(startString))) {
      startSelected = true;
      startDay = +d;
      startMonth = +m;
      startYear = +y;
      // endSelected = false;
      startString = dayMode
        ? dayjs(date).format("YYYY-MM-DD")
        : monthMode
          ? dayjs(date).format("YYYY-MM")
          : dayjs(date).format("YYYY");
    } else {
      endDay = +d;
      endMonth = +m;
      endYear = +y;
      if (monthMode) {
        endDay = +dayjs(y + "-" + m)
          .endOf("month")
          .format("D"); // 31
      }
      if (yearMode) {
        endDay = 31;
        endMonth = 12;
      }
      // startSelected = false;
      endSelected = true;

      endString = dayMode
        ? dayjs(date).format("YYYY-MM-DD")
        : monthMode
          ? dayjs(date).format("YYYY-MM")
          : dayjs(date).format("YYYY");
    }
  }
  function laterDate(
    d: number,
    m: number,
    y: number,
    nd: number,
    nm: number,
    ny: number
  ) {
    let curDate = dayjs(y + "-" + m + "-" + d).format("YYYY-MM-DD");
    let nextDate = dayjs(ny + "-" + nm + "-" + nd).format("YYYY-MM-DD");
    if (curDate < nextDate) {
      return true;
    } else {
      return false;
    }
  }
</script>

<svelte:window onclick={handleOutsideClickModal} />
{#if isPickerOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    class={cn(
      "flex flex-col gap-4  cw:w-full w-80 px-4 py-4 text-fgs3 rounded-md shadow-lg border border-brs2",
      bg(parentBgIndex)
    )}
    onclick={(event) => event.stopPropagation()}
  >
    <div class="flex items-center w-full justify-between text-b2">
      <div class="flex gap-1 items-center">
        <Button icon="chevron-left" onclick={previousDecade} size={Size.sm} />

        <div class="flex justify-between">
          <div
            class={cn(
              "focus:outline-none rounded-md px-2 py-1 text-center",
              bg(parentBgIndex)
            )}
          >
            {selectedDecade + "-" + (selectedDecade + 10).toString().slice(2)}
          </div>
        </div>
        <Button icon="chevron-right" onclick={nextDecade} size={Size.sm} />
      </div>
      {#if !isSameDay(selectedDate, new Date())}
        <Button
          icon="calendar"
          label="Jump to Today"
          size={Size.xs}
          onclick={() => {
            // selectDate(thisYear, thisMonth, thisDay);
            selectedDate = new Date();
          }}
        />
      {/if}
    </div>
    {#if monthMode || dayMode}
      <div class="w-full flex items-center justify-between text-b3">
        <Button
          icon="chevron-left"
          onclick={() => previousYear(2)}
          size={Size.sm}
        />
        <div class="grow flex items-center justify-around">
          <div
            parentBgIndex={parentBgIndex + 1}
            classList="focus:outline-none rounded-md px-2 py-1 text-center"
            >{ucFirst(
              dayjs(mapYear + "-" + mapMonth).format("YYYY")
            )}</div
          > -->
          {#each yearPool as year, index (year)}
            <button
              onclick={() => {
                mapYear = yearPool[index];
                handlePoolChangeForYears(index);
              }}
              class={cn(
                "focus:outline-none px-2 py-1 rounded-md text-center",
                abg(mapYear == yearPool[index]),
                {
                  "font-medium": mapYear == yearPool[index],
                  "hover:bg-bgs2": mapYear != yearPool[index]
                }
              )}
              >{ucFirst(
                dayjs(yearPool[index] + "-" + mapMonth).format("YYYY")
              )}</button
            >
          {/each}
        </div>
        <Button
          icon="chevron-right"
          onclick={() => nextYear(2)}
          size={Size.sm}
        />
      </div>
    {/if}

    {#if dayMode}
      <div class="flex w-full items-center text-b3 justify-between">
        <div
          class="px-2 w-full flex items-center justify-evenly gap-3 flex-wrap"
        >
          {#each monthPool as month, index (month)}
            <button
              onclick={() => {
                mapMonth = monthPool[index];
                handlePoolChange(index);
              }}
              class={cn(
                "focus:outline-none px-1.5 py-1 rounded-md  text-center",
                abg(mapMonth == monthPool[index]),
                {
                  "font-medium": mapMonth == monthPool[index],
                  "hover:bg-bgs2": mapMonth != monthPool[index]
                }
              )}
              >{ucFirst(
                dayjs(mapYear + "-" + monthPool[index]).format("MMM")
              )}</button
            >
          {/each}
        </div>
      </div>
      <div class="flex w-full justify-center">
        <div class="w-1/2">
          <Divider />
        </div>
      </div>
      <div class="flex w-full">
        <table class="w-full text-b3" cellpadding="0">
          <thead>
            <tr>
              {#each arrDays as day}
                <td>
                  <div class="flex w-full p-2 justify-center">
                    <p class="text-center" style="font-size: xx-small;">
                      {day}
                    </p>
                  </div>
                </td>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each rows as col}
              <tr>
                {#each col as i}
                  <td>
                    <div class="flex w-full h-8 justify-center items-center">
                      {#if i > 0}
                        {#if (i === startDay && mapMonth === startMonth && mapYear === startYear && startSelected) || (i === endDay && mapMonth === endMonth && mapYear === endYear && endSelected)}
                          <button
                            class={cn(
                              "rounded-md w-full h-full focus:ring-1 focus:opacity-80 hover:opacity-80 text-b2 flex items-center justify-center",
                              abg()
                            )}
                            onclick={() => selectDate(mapYear, mapMonth, i)}
                          >
                            {i}
                          </button>
                        {:else if startDay && startMonth && startYear && laterDate(startDay, startMonth, startYear, i, mapMonth, mapYear) && endDay && endMonth && endYear && laterDate(i, mapMonth, mapYear, endDay, endMonth, endYear) && endSelected == true}
                          <button
                            class="w-full h-full flex items-center justify-center hover:bg-aps1 hover:text-abg text-b2 text-bgs1 bg-aps2"
                            onclick={() => {
                              selectDate(mapYear, mapMonth, i);
                            }}
                          >
                            {i}
                          </button>
                        {:else if i === thisDay && mapMonth === thisMonth && mapYear === thisYear}
                          <button
                            class="rounded-full w-7 h-7 focus:ring-1 focus:opacity-90 hover:bg-aps1 text-base flex items-center justify-center font-medium text-abg bg-ass1"
                            onclick={() => {
                              selectDate(mapYear, mapMonth, i);
                            }}
                          >
                            {i}
                          </button>
                        {:else}
                          <button
                            class="rounded w-full h-full focus:ring-1 focus:opacity-80 hover:bg-bgs2 flex items-center justify-center"
                            onclick={() => {
                              selectDate(mapYear, mapMonth, i);
                            }}
                          >
                            {i}
                          </button>
                        {/if}
                      {/if}
                    </div>
                  </td>{/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

    {#if monthMode}
      <div
        class="flex items-center justify-between pt-4 text-fgs3 overflow-x-auto"
      >
        <table class="w-full" cellpadding="0">
          <tbody>
            {#each rows as col}
              <tr>
                {#each col as i}
                  <td>
                    <div class="flex w-full h-8 justify-center">
                      {#if i > 0}
                        {#if (i === startMonth && mapYear === startYear && startSelected) || (i === endMonth && mapYear === endYear && endSelected)}
                          <button
                            class="rounded w-full h-full focus:ring-1focus:opacity-80 hover:opacity-80 text-b2 flex items-center justify-center text-bgs1 bg-aps1"
                            onclick={() => {
                              selectDate(mapYear, i, 1);
                            }}>{dayjs(mapYear + "-" + i).format("MMM")}</button
                          >
                        {:else if startMonth && startYear && laterDate(1, startMonth, startYear, 1, i, mapYear) && endMonth && endYear && laterDate(1, i, mapYear, 1, endMonth, endYear) && endSelected == true}
                          <button
                            class=" bg-aps2 text-bgs1 w-full text-b2 text-center hover:bg-aps1 hover:text-bgs1"
                            onclick={() => {
                              selectDate(mapYear, i, 1);
                            }}
                          >
                            {dayjs(mapYear + "-" + i).format("MMM")}
                          </button>
                        {:else if i === thisMonth && mapYear === thisYear}
                          <button
                            class="rounded-full w-full h-full focus:ring-1 focus:bg-aps1 hover:bg-aps1 hover:text-white flex items-center justify-center text-b2 text-bgs1 bg-ass1"
                            onclick={() => {
                              selectDate(mapYear, i, 1);
                            }}
                          >
                            {dayjs(mapYear + "-" + i).format("MMM")}
                          </button>
                        {:else}
                          <button
                            class="rounded w-full h-full focus:ring-1 focus:opacity-80 hover:bg-aps1 hover:text-bgs1 text-b2 flex items-center justify-center"
                            onclick={() => {
                              selectDate(mapYear, i, 1);
                            }}
                          >
                            {dayjs(mapYear + "-" + i).format("MMM")}
                          </button>
                        {/if}
                      {/if}
                    </div>
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
    {#if yearMode}
      <div class="flex items-center justify-between pt-4 overflow-x-auto">
        <table class="w-full" cellpadding="0">
          <tbody>
            {#each rows as col}
              <tr>
                {#each col as i}
                  <td>
                    <div class="flex w-full h-8 justify-center">
                      {#if i > -2}
                        {#if (i + selectedDecade === startYear && startSelected) || (selectedDecade + i == endYear && endSelected)}
                          <button
                            class="rounded w-full h-full focus:ring-1 focus:opacity-80 hover:opacity-80 text-b2 flex items-center justify-center text-bgs1 bg-aps1"
                            onclick={() => {
                              selectDate(selectedDecade + i, 1, 1);
                            }}
                          >
                            {selectedDecade + i}
                          </button>
                        {:else if startYear && laterDate(1, 1, startYear, 1, 1, selectedDecade + i) && endYear && laterDate(1, 1, selectedDecade + i, 1, 1, endYear) && endSelected == true}
                          <button
                            class="rounded w-full h-full focus:ring-1 focus:bg-aps1 text-bgs1 bg-aps2 text-b2 flex items-center justify-center hover:text-bgs1 hover:bg-aps1"
                            onclick={() => {
                              selectDate(selectedDecade + i, 1, 1);
                            }}
                          >
                            {selectedDecade + i}
                          </button>
                        {:else if i + selectedDecade === thisYear}
                          <button
                            class="rounded-full w-full h-full focus:ring-1 focus:bg-aps1 hover:bg-aps1 text-b2 flex items-center justify-center text-bgs1 bg-ass1"
                            onclick={() => {
                              selectDate(mapYear, i, 1);
                            }}
                          >
                            {selectedDecade + i}
                          </button>
                        {:else}
                          <button
                            class="rounded w-full h-full focus:ring-1 focus:bg-aps1 focus:text-bgs1 text-b2 flex items-center justify-center hover:text-bgs1 hover:bg-aps1"
                            onclick={() => {
                              selectDate(selectedDecade + i, 1, 1);
                            }}
                          >
                            {selectedDecade + i}
                          </button>
                        {/if}
                      {/if}
                    </div>
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
    {#if !isDatePickerMode}
      <Divider />
      <div class="flex justify-between pt-1">
        <div class="flex flex-col w-4/10">
          <div class="text-b2">Start</div>
          <div
            class={cn(
              "text-b2 text-fgs3 p-1 rounded-sm",
              bg(parentBgIndex + 1)
            )}
          >
            {#if startSelected}
              {startString}<button
                onclick={() => reset(true, false)}
                ><Icon
                  icon="ph:x-circle-light"
                  size={Size.xs}
                  class="stroke-ars1"
                /></button
              >
            {:else}
              {"-/-"}
            {/if}
          </div>
        </div>
        <Icon icon="proceed" />
        <div class="flex flex-col w-4/10">
          <div class="text-b2">End</div>
          <div
            class={cn(
              "text-b2 text-fgs3 p-1 rounded-sm",
              bg(parentBgIndex + 1)
            )}
          >
            {#if endSelected}
              {endString}<button
                onclick={() => reset(false, true)}
                ><Icon
                  icon="ph:x-circle-light"
                  size={Size.xs}
                  class="stroke-ars1"
                /></button
              >
            {:else}
              -/-
            {/if}
          </div>
        </div>
      </div>
    {/if}
  </div>
{:else}
  <button
    onclick={(event) => {
      event.stopPropagation();
      enablePicker();
    }}
    class="text-fgs1"
  >
    -- Pick Range --
  </button>
{/if}
