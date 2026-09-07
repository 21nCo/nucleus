<script lang="ts">
  import { isSameDay } from "@21n/utils/time.utils";
  import { abg, cn } from "@21n/utils/ui.utils";
  import {
    getDaysInMonth,
    getFirstAlphabetPosition,
    monthNames
  } from "@nucleum/features/calendar/birdView/Birdview.utils";
  const monthNamesFull = [
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
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  let { date }: { date: string } = $props();
  const firstAlphPos = $derived(getFirstAlphabetPosition(date));
  const year = $derived(Number(date.slice(0, firstAlphPos)));
  const month = $derived(date.slice(-3));
  const monthIndex = $derived(monthNames.indexOf(month));
  const monthFull = $derived(monthNamesFull[monthIndex]);
  const monthEndDate = $derived(getDaysInMonth(monthIndex, year));
  const data = $derived(Array.from({ length: monthEndDate }, (_, i) => i + 1));
  const startDay = $derived(new Date(Date.UTC(year, monthIndex, 1)).getDay() + 1);
</script>

<div
  data-date={`${year}-${monthIndex < 9 ? "0" : ""}${monthIndex + 1}`}
  class="text-fgs2 h-full w-80 flex-none border-r border-brs3"
>
  <div
    class="border-b h-12 border-brs3 flex flex-col justify-center items-center p-2"
  >
    <p class={cn("text-b3 text-fgs3", { hidden: month != "Jan" })}>
      {year}
    </p>
    <p class="font-medium text-h5">{monthFull}</p>
  </div>
  <div class="grid grid-cols-7 gap-1 p-2 text-b2">
    {#each dayNames as dayName}
      <p class="w-8 text-center text-b4 text-fgs3">{dayName}</p>
    {/each}
    {#each data as day, index (index)}
      <button
        class={cn("w-6 h-6 text-fgs1 text-b3 text-center rounded-full", {
          [abg()]: isSameDay(
            new Date(year + "-" + (monthIndex + 1) + "-" + day),
            new Date()
          )
        })}
        style={index == 0 ? `grid-column-start: ${startDay};` : ""}
      >
        {day}
      </button>
    {/each}
  </div>
</div>
