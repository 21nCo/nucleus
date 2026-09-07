<script lang="ts">
  import {
    dayNames,
    monthNames
  } from "@nucleum/features/calendar/birdView/Birdview.utils";

  let { date }: { date: string } = $props();
  const dayMonth = $derived(date.split("-")[1]);
  const dayDate = $derived.by(() => {
    const splitDate = date.split("-");
    if (splitDate[2] == "01") {
      return monthNames[Number(splitDate[1]) - 1] + " - " + splitDate[2];
    }
    return splitDate[2];
  });
  const day = $derived(new Date(date).getDay());
</script>

<div
  data-date={date}
  class="flex-none text-fgs1 box-content font-medium text-h5 w-80 border-r border-brs3 break-words"
>
  <div class="p-2 h--12 w-full text-center border-b border-brs3">
    <p class="text-b3 text-fgs3">
      {dayNames[day]}
    </p>
    <p class="font-medium">{dayDate}</p>
  </div>
</div>
