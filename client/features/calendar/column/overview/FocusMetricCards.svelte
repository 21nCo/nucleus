<script lang="ts">
  import MetricItem from "@nucleum/features/focus/analytics/cards/metrics/MetricItem.svelte";
  import type { ISessionLog } from "@nucleum/features/focus/logs/log.type";

  let {
    data,
    previousTimePeriodData
  }: {
    data: ISessionLog[];
    previousTimePeriodData: ISessionLog[];
  } = $props();

  const totalFocus = $derived(data.reduce((acc, curr) => acc + (curr.focus ?? 0), 0));
  const totalBreak = $derived(
    data.reduce((acc, curr) => acc + (curr.breakTime ?? 0), 0)
  );
  const previousFocus = $derived(previousTimePeriodData.reduce(
    (acc, curr) => acc + (curr.focus ?? 0),
    0
  ));
  const previousBreak = $derived(previousTimePeriodData.reduce(
    (acc, curr) => acc + (curr.breakTime ?? 0),
    0
  ));
</script>

<div
  class="w-full flex flex-wrap justify-start items-start content-start dp:gap-4 gap-3"
>
  <MetricItem
    type="total"
    value={totalFocus + totalBreak}
    previousValue={previousFocus + previousBreak}
  />
  <MetricItem type="focus" value={totalFocus} previousValue={previousFocus} />
  <MetricItem type="break" value={totalBreak} previousValue={previousBreak} />
</div>
