<script lang="ts">
  import AnalyticsChart from "@nucleum/features/focus/analytics/page/AnalyticsChart.svelte";
  import {
    AnalyticsCardType,
    type IAnalyticsCard,
    type AnalyticsDataRecord,
    type IAnalyticsLabelColor
  } from "@nucleum/features/focus/analytics/analytics.types";
  import TopNCard from "@nucleum/features/focus/analytics/cards/topN/TopNCard.svelte";
  import MetricsCard from "@nucleum/features/focus/analytics/cards/metrics/MetricsCard.svelte";
  import TargetGuages from "@nucleum/features/focus/analytics/targets/TargetGuages.svelte";
  import { Size } from "@21n/types/size.enum";
  import view from "@nucleum/stores/view.store";

  let {
    card,
    data,
    parentBgIndex = 1,
    previousTimePeriodData = [],
    objectiveColors
  }: {
    card: IAnalyticsCard;
    data: AnalyticsDataRecord[];
    parentBgIndex?: number;
    previousTimePeriodData?: AnalyticsDataRecord[];
    objectiveColors: IAnalyticsLabelColor[];
  } = $props();
</script>

{#if card.type === AnalyticsCardType.TOP_N || card.type === AnalyticsCardType.TARGETS || card.type === AnalyticsCardType.METRICS}
  <div
    class="flex self-start w-full h-full mo:p-0.5 p-3 overflow-auto userdata"
  >
    {#if card.type === AnalyticsCardType.TOP_N}
      <TopNCard {card} {data} {objectiveColors} {previousTimePeriodData} />
    {:else if card.type === AnalyticsCardType.TARGETS}
      <div class="w-full h-full flex items-center">
        <TargetGuages
          size={$view.isPortrait ? Size.md : Size.lg}
          {parentBgIndex}
          type="full"
        />
      </div>
    {:else if card.type === AnalyticsCardType.METRICS}
      <MetricsCard {data} {previousTimePeriodData} />
    {/if}
  </div>
{:else}
  <AnalyticsChart chart={card} rawData={data} {objectiveColors} />
{/if}
