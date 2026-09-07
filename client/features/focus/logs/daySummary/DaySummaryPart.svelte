<script lang="ts">
  import Divider from "@21n/elements/Divider.svelte";
  import type { DaySummary } from "@nucleum/features/focus/logs/log.type";
  import DaySummaryTotalItem from "@nucleum/features/focus/logs/daySummary/DaySummaryTotalItem.svelte";

  let { summary }: { summary: DaySummary } = $props();
</script>

<div class="flex flex-col gap-1 w-full max-w-md">
  <div class="flex flex-wrap justify-between w-full px-2 py-1">
    <DaySummaryTotalItem value={summary.focus + summary.break} type="total" />
    <DaySummaryTotalItem value={summary.focus} type="focus" />
    <DaySummaryTotalItem value={summary.break} type="break" />
  </div>
  <Divider />
</div>
