<script lang="ts">
  import { TimeScaleUnit } from "@21n/types/time.type";
  import CalendarOverviewPanelPointron from "@nucleum/features/calendar/column/overview/CalendarOverviewPanelPointron.svelte";
  import MemoryOverviewForTimePeriod from "@nucleum/features/calendar/column/overview/MemoryOverviewForTimePeriod.svelte";

  let {
    date,
    scale = TimeScaleUnit.DAY,
    isRewind = false
  }: {
    date: Date;
    scale?: TimeScaleUnit;
    isRewind?: boolean;
  } = $props();
</script>

<div class="flex flex-col gap-4 w-full">
  <CalendarOverviewPanelPointron {date} {isRewind} />
  <MemoryOverviewForTimePeriod {date} {scale} {isRewind} />
</div>
