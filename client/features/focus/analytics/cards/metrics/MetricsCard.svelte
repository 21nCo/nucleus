<script lang="ts">
  import type {
    AnalyticsDataRecord
  } from "@nucleum/features/focus/analytics/analytics.types";
  import MetricItem from "@nucleum/features/focus/analytics/cards/metrics/MetricItem.svelte";

  let {
    data,
    previousTimePeriodData = []
  }: {
    data: AnalyticsDataRecord[];
    previousTimePeriodData?: AnalyticsDataRecord[];
  } = $props();

  function resolveMetricSeconds(value: unknown) {
    const numericValue = typeof value === "number" ? value : Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  function sumMetricSeconds(
    records: AnalyticsDataRecord[],
    field: keyof Pick<AnalyticsDataRecord, "focus" | "brek">
  ) {
    return records.reduce(
      (acc, curr) => acc + resolveMetricSeconds(curr[field]),
      0
    );
  }

  let totalFocus = $derived(sumMetricSeconds(data, "focus"));
  let totalBreak = $derived(sumMetricSeconds(data, "brek"));
  let total = $derived(totalFocus + totalBreak);
  let previousFocus = $derived(
    sumMetricSeconds(previousTimePeriodData, "focus")
  );
  let previousBreak = $derived(sumMetricSeconds(previousTimePeriodData, "brek"));
  let previousTotal = $derived(previousFocus + previousBreak);
</script>

<div
  class="w-full h-full flex flex-wrap justify-start items-start content-start dp:gap-4 gap-3"
>
  <MetricItem type="total" value={total} previousValue={previousTotal} />
  <MetricItem type="focus" value={totalFocus} previousValue={previousFocus} />
  <MetricItem type="break" value={totalBreak} previousValue={previousBreak} />
</div>
