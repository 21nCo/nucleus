<script lang="ts">
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import type { ISessionLog } from "@nucleum/features/focus/logs/log.type";
  import { Size } from "@21n/types/size.enum";
  import { LoadingAnimationType } from "@21n/types/feedback.type";
  import HistoricalMetrics from "@nucleum/features/calendar/column/overview/HistoricalMetrics.svelte";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { time } from "@datafn/client";
  import { toSvelteStore } from "@datafn/svelte";

  let {
    date
  }: {
    date: Date;
  } = $props();

  const lastMonthDate = $derived(getLastMonthDate(date));
  const lastYearDate = $derived(getLastYearDate(date));
  const twoYearsAgoDate = $derived(getTwoYearsAgoDate(date));
  const lastMonthStore = $derived.by(() =>
    createSessionLogStore(lastMonthDate)
  );
  const lastYearStore = $derived.by(() => createSessionLogStore(lastYearDate));
  const twoYearsAgoStore = $derived.by(() =>
    createSessionLogStore(twoYearsAgoDate)
  );
  const lastMonthData = $derived($lastMonthStore.data);
  const lastYearData = $derived($lastYearStore.data);
  const twoYearsAgoData = $derived($twoYearsAgoStore.data);
  const hasData = $derived(
    lastMonthData.length > 0 ||
      lastYearData.length > 0 ||
      twoYearsAgoData.length > 0
  );
  const isRefreshing = $derived(
    $lastMonthStore.loading ||
      $lastMonthStore.refreshing ||
      $lastYearStore.loading ||
      $lastYearStore.refreshing ||
      $twoYearsAgoStore.loading ||
      $twoYearsAgoStore.refreshing
  );

  const lastMonthFocusHours = $derived(
    lastMonthData.reduce((acc, curr) => acc + (curr.focus ?? 0), 0)
  );
  const lastYearFocusHours = $derived(
    lastYearData.reduce((acc, curr) => acc + (curr.focus ?? 0), 0)
  );
  const twoYearsAgoFocusHours = $derived(
    twoYearsAgoData.reduce((acc, curr) => acc + (curr.focus ?? 0), 0)
  );

  function isValidDate(year: number, month: number, day: number): boolean {
    const date = new Date(year, month, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day
    );
  }

  function getLastMonthDate(currentDate: Date): Date | null {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() - 1;
    const day = currentDate.getDate();

    if (isValidDate(year, month, day)) {
      return new Date(year, month, day);
    }
    return null;
  }

  function getLastYearDate(currentDate: Date): Date | null {
    const year = currentDate.getFullYear() - 1;
    const month = currentDate.getMonth();
    const day = currentDate.getDate();

    if (isValidDate(year, month, day)) {
      return new Date(year, month, day);
    }
    return null;
  }

  function getTwoYearsAgoDate(currentDate: Date): Date | null {
    const year = currentDate.getFullYear() - 2;
    const month = currentDate.getMonth();
    const day = currentDate.getDate();

    if (isValidDate(year, month, day)) {
      return new Date(year, month, day);
    }
    return null;
  }

  function createSessionLogStore(day: Date | null) {
    if (!day) {
      return toSvelteStore<ISessionLog[]>(datafn.emptySignal([]), {
        initialData: []
      });
    }
    return toSvelteStore<ISessionLog[]>(
      datafn.sessionLog.signal({
        temporal: time.day("startUnix", day)
      }),
      { initialData: [] }
    );
  }
</script>

<div class="flex flex-wrap gap-4 w-full">
  {#if isRefreshing}
    <EmptyStatusView
      isLoadingState={true}
      loadingAnimation={LoadingAnimationType.ON_THIS_DAY_PULSE}
      loadingText="Loading historical data"
    />
  {:else if !hasData}
    <EmptyStatusView
      mainText="No historical data found"
      subText="You don't have any focus sessions recorded for this day in previous periods"
      size={Size.sm}
    />
  {:else}
    {#if lastMonthData.length > 0 && lastMonthDate}
      <HistoricalMetrics
        title="1 Month ago"
        date={lastMonthDate}
        totalFocus={lastMonthFocusHours}
      />
    {/if}

    {#if lastYearData.length > 0 && lastYearDate}
      <HistoricalMetrics
        title="1 Year ago"
        date={lastYearDate}
        totalFocus={lastYearFocusHours}
      />
    {/if}

    {#if twoYearsAgoData.length > 0 && twoYearsAgoDate}
      <HistoricalMetrics
        title="2 Years ago"
        date={twoYearsAgoDate}
        totalFocus={twoYearsAgoFocusHours}
      />
    {/if}
  {/if}
</div>
