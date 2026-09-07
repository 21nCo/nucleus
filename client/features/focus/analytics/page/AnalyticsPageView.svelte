<script lang="ts">
  import { isInEditMode } from "@nucleum/stores/app.store";
  import view from "@nucleum/stores/view.store";
  import { bg, cn } from "@21n/utils/ui.utils";
  import { analyticsConfigStore } from "@nucleum/features/focus/analytics/analytics.store";
  import ScrollViewBottomSpacer from "@21n/layout/scrollView/ScrollViewBottomSpacer.svelte";
  import Button from "@21n/elements/button/Button.svelte";
  import AnalyticsCardView from "@nucleum/features/focus/analytics/page/AnalyticsCardView.svelte";
  import { ButtonStyle } from "@21n/types/button.type";
  import Icon from "@21n/elements/Icon.svelte";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import type { IObjectiveThumb } from "@nucleum/features/focus/goals/goal.type";
  import {
    AnalyticsCardType,
    type AnalyticsPage
  } from "@nucleum/features/focus/analytics/analytics.types";
  import type { ITimePeriodResolved } from "@21n/types/time.type";
  import {
    determinePreviousTimePeriod,
    determineTimePeriodv2
  } from "@21n/utils/time.utils";
  import type { ISessionLog } from "@nucleum/features/focus/logs/log.type";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { resolveUnixTimestamp } from "@21n/shared-utils/time.utils";
  import { toSvelteStore } from "@datafn/svelte";

  let {
    id,
    parentBgIndex = 1
  }: {
    id: string;
    parentBgIndex?: number;
  } = $props();

  const objectiveStore = toSvelteStore<IObjectiveThumb[]>(
    datafn.objective.signal({
      select: ["*", "parent.*", "children.*", "tasks.*"],
      filters: {
        id: { $ne: "" }
      }
    }),
    { initialData: [] }
  );
  const config = $derived.by(() =>
    ($analyticsConfigStore.pages ?? []).find((x) => x.id === id)
  );
  let cards = $derived(config?.cards ?? []);
  const pageTimeContext = $derived.by(() => resolvePageTimeContext(cards));
  const cardsTimePeriods = $derived(pageTimeContext.cardsTimePeriods);
  const timeRangeForPage = $derived(pageTimeContext.timeRangeForPage);
  const sessionLogStore = $derived.by(() =>
    toSvelteStore<ISessionLog[]>(
      datafn.sessionLog.signal({
        select: ["id", "startUnix", "objectiveId", "focus", "breakTime"],
        filters: {
          startUnix: timeRangeForPage
            ? {
                $gte: timeRangeForPage.begin - 24 * 60 * 60,
                $lte: timeRangeForPage.end + 24 * 60 * 60
              }
            : { $gte: 1, $lte: 0 }
        },
        sort: ["-startUnix"]
      }),
      { initialData: [] }
    )
  );
  const objectives = $derived($objectiveStore.data);
  const logs = $derived($sessionLogStore.data);
  const isLoading = $derived(
    $objectiveStore.loading ||
      $objectiveStore.refreshing ||
      $sessionLogStore.loading ||
      $sessionLogStore.refreshing
  );

  const heightAdjuster = "4.475rem";

  async function addCard() {
    analyticsConfigStore.addCard(id);
  }

  function resolvePageTimeContext(cards: AnalyticsPage["cards"] = []) {
    const cardsTimePeriods = cards.reduce(
      (acc, card) => {
        const timePeriod = determineTimePeriodv2(card.period);
        acc[card.id] = {
          begin: resolveUnixTimestamp(timePeriod.begin),
          end: resolveUnixTimestamp(timePeriod.end),
          title: timePeriod.title
        };
        return acc;
      },
      {} as { [key: string]: ITimePeriodResolved }
    );
    let previousPeriods: { [key: string]: number } = {};
    if (
      cards.some(
        (x) =>
          x.type === AnalyticsCardType.TOP_N ||
          x.type === AnalyticsCardType.METRICS
      )
    ) {
      const cardsWithPreviousPeriods = cards.filter(
        (x) =>
          x.type === AnalyticsCardType.TOP_N ||
          x.type === AnalyticsCardType.METRICS
      );
      cardsWithPreviousPeriods.forEach((card) => {
        const timePeriod = determinePreviousTimePeriod(card.period);
        previousPeriods[card.id] = resolveUnixTimestamp(timePeriod);
      });
    }
    if (cards.length === 0) {
      return {
        cardsTimePeriods,
        timeRangeForPage: undefined
      };
    }
    return {
      cardsTimePeriods,
      timeRangeForPage: {
        begin: Math.min(
          ...Object.values(cardsTimePeriods).map((x) => x.begin),
          ...Object.values(previousPeriods).map((x) => x)
        ),
        end: Math.max(...Object.values(cardsTimePeriods).map((x) => x.end))
      }
    };
  }
</script>

{#if config}
  <div
    class={cn("flex h-full max-h-full px-4 pb-4 pt-2 overflow-auto", {
      "flex-col gap-3": $view.isPortrait,
      "flex-wrap gap-2": !$view.isPortrait
    })}
  >
    {#each cards as card, index (card.id)}
      <AnalyticsCardView
        {card}
        {objectives}
        {logs}
        isPageLoaded={!isLoading}
        timePeriod={cardsTimePeriods[card.id]}
        position={{ index, total: cards.length }}
        pageId={id}
        {parentBgIndex}
        {heightAdjuster}
      />
    {/each}
    {#if $isInEditMode && cards.length < 10}
      <div>
        <button
          class={cn(
            "border-2 border-dotted border-fgs4 rounded-md grow flex flex-col gap-1 justify-center items-center",
            `hover:${bg(parentBgIndex)}`,
            {
              "w-full": $view.isPortrait,
              "w-60": !$view.isPortrait
            }
          )}
          style={!$view.isPortrait
            ? cards.length === 1
              ? "height: calc(100vh - 8rem);"
              : $view.height < 900
                ? `height: calc(70vh - ${heightAdjuster});`
                : `height: calc(60vh - ${heightAdjuster});`
            : ""}
          onclick={addCard}
        >
          <Icon icon="plus-circled" />
          <Button label="Add card" style={ButtonStyle.PLAIN} />
        </button>
      </div>
    {/if}
    {#if $view.isPortrait}
      <ScrollViewBottomSpacer />
    {/if}
  </div>
{:else}
  <EmptyStatusView
    isLoadingState={isLoading}
    mainText={!config
      ? "Geez Something went wrong!"
      : "Shoot! No cards configured."}
    subText={!config
      ? "Please try again after sometime or chat with us"
      : "Please click on edit and add cards to display them here."}
  />
{/if}
