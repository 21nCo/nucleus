<script lang="ts">
  import { monthNames } from "@nucleum/features/calendar/birdView/Birdview.utils";
  let { year = 2024 }: { year?: number } = $props();
</script>

<div
  data-date={year}
  class="text-fgs1 flex-shrink-0 min-h-[600px] h-full w-[25%] border-r border-brs3"
>
  <div
    class="border-b border-brs3 bg-bgs2 h-10 flex items-center justify-center text-center text-fgs2"
  >
    <p class="text-xs">
      {year}
    </p>
  </div>
  <div class="grid gap-1 p-2" style="grid-template-columns: repeat(4,25%);">
    {#each monthNames as monthName (monthName)}
      <div class="w-8 text-center text-xs text-fgs2">
        {monthName}
      </div>
    {/each}
  </div>
</div>
