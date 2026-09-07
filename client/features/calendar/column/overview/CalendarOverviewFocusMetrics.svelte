<script lang="ts">
  import AnalyticsChartStandalone from "@nucleum/features/focus/analytics/page/AnalyticsChartStandalone.svelte";
  import type { ISessionLog } from "@nucleum/features/focus/logs/log.type";
  import { TimeScale } from "@21n/types/time.type";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import { LoadingAnimationType } from "@21n/types/feedback.type";
  import FocusMetricCards from "@nucleum/features/calendar/column/overview/FocusMetricCards.svelte";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { toSvelteStore } from "@datafn/svelte";
  import { combineSignals, time } from "@datafn/client";
  import { datafnHeavyComputedSignalOptions } from "@nucleum/datafn/signalCache";

  let {
    date,
    scale = TimeScale.DAYS
  }: {
    date: Date;
    scale?: TimeScale;
  } = $props();

  const sessionLogStore = $derived.by(() => {
    const resolvedDate = date instanceof Date ? date : new Date(date);
    const previousDate = new Date(
      resolvedDate.getFullYear(),
      resolvedDate.getMonth(),
      resolvedDate.getDate() - 1
    );
    const currentSignal = datafn.sessionLog.signal(
      resolveSessionLogQuery(resolvedDate),
      datafnHeavyComputedSignalOptions
    );
    const previousSignal = datafn.sessionLog.signal(
      resolveSessionLogQuery(previousDate),
      datafnHeavyComputedSignalOptions
    );
    return toSvelteStore(
      combineSignals([currentSignal, previousSignal], () => ({
        current: resolveSignalRows(currentSignal.get()),
        previous: resolveSignalRows(previousSignal.get())
      })),
      { initialData: { current: [], previous: [] } }
    );
  });
  const isRefreshing = $derived(
    $sessionLogStore.loading || $sessionLogStore.refreshing
  );
  const errorMessage = $derived($sessionLogStore.error?.message ?? "");

  function resolveSessionLogQuery(date: Date) {
    return {
      temporal: time.day("startUnix", date),
      select: ["*", "objective.*", "session.*", "task.*"],
      sort: ["startUnix"]
    };
  }

  function resolveSignalRows(value: unknown): ISessionLog[] {
    return Array.isArray(value) ? value : [];
  }
</script>

{#if isRefreshing}
  <EmptyStatusView
    isLoadingState={true}
    loadingAnimation={LoadingAnimationType.OVERVIEW_CARDS_PULSE}
  />
{:else if errorMessage}
  <EmptyStatusView mainText="Something went wrong." />
{:else}
  <div class="flex flex-col gap-4 h-full w-full">
    <div class="flex flex-col gap-4">
      <FocusMetricCards
        data={$sessionLogStore.data.current}
        previousTimePeriodData={$sessionLogStore.data.previous}
      />
      <AnalyticsChartStandalone {date} {scale} showLegend={false} />
    </div>
  </div>
{/if}
