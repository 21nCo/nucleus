<script lang="ts">
  import { resolveSessionTimeSplit } from "@nucleum/products/pointron/pointron.utils";
  import LogTotalCard from "@nucleum/features/focus/logs/logPage/LogTotalCard.svelte";

  let { log }: { log: any } = $props();
  let totals = $derived(resolveSessionTimeSplit(log));
</script>

<div class="flex flex-wrap gap-2 justify-between w-full">
  <LogTotalCard value={totals.focus + totals.brek} type="total" />
  <LogTotalCard value={totals.focus} type="focus" />
  <LogTotalCard value={totals.brek} type="break" />
</div>
