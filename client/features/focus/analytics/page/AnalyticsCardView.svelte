<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import TimePeriodPicker from "@21n/elements/datetime/timeperiodpicker/TimePeriodPicker.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import { isInEditMode } from "@nucleum/stores/app.store";
  import view from "@nucleum/stores/view.store";
  import { Size } from "@21n/elements/size.enum";
  import { determinePreviousTimePeriod } from "@21n/utils/time.utils";
  import { cn } from "@21n/utils/ui.utils";
  import {
    AnalyticsCardType,
    type IAnalyticsCard,
    type AnalyticsDataRecord,
    type IAnalyticsLabelColor
  } from "@nucleum/features/focus/analytics/analytics.types";
  import { analyticsConfigStore } from "@nucleum/features/focus/analytics/analytics.store";
  import CardSelector from "@nucleum/features/focus/analytics/page/CardSelector.svelte";
  import { InputStyle } from "@21n/elements/input/input.type";
  import GroupingAndFilters from "@nucleum/features/focus/analytics/page/GroupingAndFilters.svelte";
  import CardResolver from "@nucleum/features/focus/analytics/page/CardResolver.svelte";
  import { ButtonStyle, ButtonVariant } from "@21n/elements/button/button.type";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import type { ISessionLog } from "@nucleum/features/focus/logs/log.type";
  import { resourceInList } from "@nucleum/datafn/resource.utils";
  import type {
    IObjective,
    IObjectiveThumb
  } from "@nucleum/features/focus/goals/goal.type";
  import { resolveObjectiveColor } from "@nucleum/features/focus/goals/goal.utils";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import { resolveUnixTimestamp } from "@21n/shared-utils/time.utils";
  import {
    TimePeriodType,
    TimeScale,
    type ITimePeriodResolved
  } from "@21n/utils/time.type";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { logger } from "@nucleum/client/runtime/logging/logger";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import { ErrorMessage } from "@nucleum/application/error/resource-error.type";
  import { untrack } from "svelte";
  let {
    card,
    position,
    pageId,
    objectives = [],
    logs = [],
    timePeriod,
    isPageLoaded = false,
    parentBgIndex = 1,
    heightAdjuster = "2.85rem",
    onReload = undefined,
    onRemoved = undefined
  }: {
    card: IAnalyticsCard;
    position: { index: number; total: number };
    pageId: string;
    objectives?: IObjectiveThumb[];
    logs?: ISessionLog[];
    timePeriod?: ITimePeriodResolved;
    isPageLoaded?: boolean;
    parentBgIndex?: number;
    heightAdjuster?: string;
    onReload?: ((event: CustomEvent<void>) => void) | undefined;
    onRemoved?: ((event: CustomEvent<IAnalyticsCard>) => void) | undefined;
  } = $props();
  let cardBgIndex = $derived(parentBgIndex - 1);
  let data = $state<AnalyticsDataRecord[]>([]);
  let previousTimePeriodData = $state<AnalyticsDataRecord[]>([]);
  let objectiveColors = $state<IAnalyticsLabelColor[]>([]);
  let isRefreshing = $state(true);
  let refreshId = $state(new Date().getTime());
  let errorMessage = $state<string | undefined>(undefined);
  function resolveDefaultCardPeriod(): IAnalyticsCard["period"] {
    return {
      scale: TimeScale.DAYS,
      value: {
        type: TimePeriodType.RELATIVE,
        param: 0
      }
    };
  }

  let cardLabel = $state("");
  let cardPeriod = $state<IAnalyticsCard["period"]>(resolveDefaultCardPeriod());
  let cardType = $state<IAnalyticsCard["type"]>(AnalyticsCardType.PIE);
  let timePeriodTitle = $derived(timePeriod?.title ?? "");
  const isCarbonChart = false;
  const isCanRenderInSmallerArea = [
    AnalyticsCardType.PIE,
    AnalyticsCardType.DONUT,
    AnalyticsCardType.SUNBURST,
    AnalyticsCardType.TOP_N,
    AnalyticsCardType.METRICS
  ];

  $effect(() => {
    cardLabel = card.label ?? "";
    cardPeriod = card.period;
    cardType = card.type;
    card;
    logs;
    objectives;
    timePeriod;
    parentBgIndex;
    isPageLoaded;
    if (isPageLoaded) {
      untrack(() => {
        void refresh();
      });
    }
  });
  function emitReload() {
    const reloadEvent = new CustomEvent<void>("reload");
    onReload?.(reloadEvent);
  }

  function emitRemoved() {
    const removedEvent = new CustomEvent<IAnalyticsCard>("removed", {
      detail: card
    });
    onRemoved?.(removedEvent);
  }

  function onRemoveClick() {
    analyticsConfigStore.removeCard(pageId, card.id);
    emitRemoved();
  }

  function onTimePeriodChange(e: CustomEvent) {
    cardPeriod = e.detail;
    analyticsConfigStore.updateCardConfig(pageId, {
      ...card,
      period: cardPeriod
    });
    emitReload();
  }

  function onCardTypeChange(e: CustomEvent) {
    cardType = e.detail;
    analyticsConfigStore.updateCardConfig(pageId, {
      ...card,
      type: cardType
    });
    refresh();
  }

  function onGroupByChange(e: CustomEvent) {
    analyticsConfigStore.updateCardConfig(pageId, {
      ...card,
      isGroupByTopLevelObjectives: e.detail
    });
    refresh();
  }

  function onCardLabelChange() {
    analyticsConfigStore.updateCardConfig(pageId, {
      ...card,
      label: cardLabel
    });
  }

  function resolveObjectiveFromId(id: IRecordId | undefined) {
    if (!id) return;
    const objective = objectives.find(resourceInList(id));
    return objective;
  }

  function resolveObjectiveThumb(
    objective: IObjective | IObjectiveThumb | undefined
  ) {
    return objective as IObjectiveThumb | undefined;
  }

  function resolveAnalyticsSeconds(value: unknown) {
    const numericValue = typeof value === "number" ? value : Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  async function refresh() {
    isRefreshing = true;
    data = [];
    previousTimePeriodData = [];
    errorMessage = undefined;
    try {
      const colors: IAnalyticsLabelColor[] = [];
      if (!card.period || !card.period.value) {
        errorMessage = "Invalid time period.";
        isRefreshing = false;
        return;
      }
      const resolvedTimePeriod = timePeriod;
      if (
        !resolvedTimePeriod?.begin ||
        !resolvedTimePeriod.end ||
        resolvedTimePeriod.begin.toString() === "Invalid Date" ||
        resolvedTimePeriod.end.toString() === "Invalid Date"
      ) {
        errorMessage = "Please select a valid time period.";
        isRefreshing = false;
        return;
      }
      const correctedBegin = datafn.temporal.resolveLocalTimeSync(
        resolvedTimePeriod.begin
      );
      const correctedEnd = datafn.temporal.resolveLocalTimeSync(
        resolvedTimePeriod.end
      );
      const filteredLogs = logs.filter(
        (log) =>
          log.startUnix >= correctedBegin && log.startUnix <= correctedEnd
      );
      const randomColor = () => Math.floor(Math.random() * 360);

      const dataMapper = (log: ISessionLog) => {
        const objective = log.objectiveId
          ? resolveObjectiveFromId(log.objectiveId)
          : undefined;
        const tzCorrectedStart = datafn.temporal.resolveLocalTimeSync(
          log.startUnix
        );
        const resolvedObjectiveLabel = objective?.label ?? "Unknown Objective";
        if (
          objective &&
          !colors.some((x) => x.label === resolvedObjectiveLabel)
        ) {
          const color = resolveObjectiveColor(objective);
          colors.push({
            label: resolvedObjectiveLabel,
            color: color ?? randomColor()
          });
        }
        const topLevelObjective = objective?.parent?.[0];
        const topLevelObjectiveLabel =
          topLevelObjective?.label ?? "Unknown Objective";
        if (
          topLevelObjective &&
          !colors.some((x) => x.label === topLevelObjectiveLabel)
        ) {
          const color = resolveObjectiveColor(
            resolveObjectiveThumb(topLevelObjective)
          );
          colors.push({
            label: topLevelObjectiveLabel,
            color: color ?? randomColor()
          });
        }
        const objectiveLabel = objective
          ? objective.label || "Unknown Objective"
          : "No Objective";
        return {
          brek: resolveAnalyticsSeconds(log.breakTime),
          focus: resolveAnalyticsSeconds(log.focus),
          objectiveLabel,
          objectiveId: log.objectiveId || "",
          start: new Date(tzCorrectedStart).toISOString(),
          topLevelObjectiveLabel: topLevelObjective?.label ?? objectiveLabel
        };
      };

      filteredLogs.forEach((log: ISessionLog) => {
        data.push(dataMapper(log));
      });

      if (
        card.type === AnalyticsCardType.TOP_N ||
        card.type === AnalyticsCardType.METRICS
      ) {
        const previousPeriod = determinePreviousTimePeriod(card.period);
        if (previousPeriod) {
          const correctedPreviousBegin = datafn.temporal.resolveLocalTimeSync(
            resolveUnixTimestamp(previousPeriod)
          );
          const previousLogs = logs.filter(
            (log) =>
              log.startUnix >= correctedPreviousBegin &&
              log.startUnix < correctedBegin
          );
          previousLogs.forEach((log: ISessionLog) => {
            previousTimePeriodData.push(dataMapper(log));
          });
        }
      }
      objectiveColors = [
        ...colors.filter((x) => x.color),
        {
          label: "No Objective",
          color: 250
        },
        {
          label: "Unknown Objective",
          color: 250
        }
      ];
      refreshId = new Date().getTime();
      isRefreshing = false;
    } catch (error) {
      logger.error(
        {
          at: "AnalyticsCardView.refresh"
        },
        error
      );
      errorMessage = ErrorMessage.DEFAULT;
      isRefreshing = false;
    }
  }
</script>

<div
  class={cn("flex flex-col grow border border-brs2 rounded-md bg-bgs1", {
    "w-full h-96 p-2": $view.isPortrait,
    "p-4": !$view.isPortrait,
    "h-[32rem]": $view.isPortrait && $isInEditMode,
    "w-4/5": position.total === 1 && !$view.isPortrait,
    "w-2/5 2k:w-3/10":
      !$view.isPortrait && isCanRenderInSmallerArea.includes(card.type),
    "w-3/5": !$view.isPortrait && !isCanRenderInSmallerArea.includes(card.type),
    "border border-brs2": $isInEditMode
  })}
  style={!$view.isPortrait
    ? position.total === 1
      ? "height: calc(100vh - 8rem);"
      : $view.height < 900
        ? `height: calc(70vh - ${heightAdjuster});`
        : $isInEditMode
          ? `height: calc(60vh - ${heightAdjuster});`
          : `height: calc(50vh - ${heightAdjuster});`
    : ""}
>
  <header
    class={cn("w-full", {
      "h-6": !$isInEditMode,
      "h-32": $isInEditMode
    })}
  >
    {#if $isInEditMode}
      <div
        class={cn(
          "w-full flex flex-col gap-3 border border-dashed border-brs3 rounded-md p-2 dp:p-3",
          {}
        )}
      >
        <span class="flex justify-between w-full">
          <TextInput
            bind:value={cardLabel}
            placeholder="chart title"
            style={InputStyle.PLAIN}
            onDebouncedChange={onCardLabelChange}
          />
          <span class="flex gap-2 items-center">
            <GroupingAndFilters
              {card}
              {onGroupByChange}
              parentBgIndex={cardBgIndex}
            />
            <Button
              icon="cross-circled"
              tooltip={$view.isPortrait ? "Remove" : ""}
              label={$view.isPortrait ? "" : "Remove"}
              parentBgIndex={cardBgIndex}
              isPreventMinWidth={true}
              type={ButtonVariant.DANGER}
              style={$view.isPortrait
                ? ButtonStyle.DEFAULT
                : ButtonStyle.OUTLINED}
              size={$view.isPortrait ? Size.lg : Size.xs}
              onclick={onRemoveClick}
            />
          </span>
        </span>
        <span class="flex w-full gap-2">
          {#if card.type != AnalyticsCardType.TARGETS}
            <span class="w-1/2">
              <TimePeriodPicker
                bind:period={cardPeriod}
                onChange={onTimePeriodChange}
              />
            </span>
          {/if}
          <span class="w-1/2">
            <CardSelector
              bind:selected={cardType}
              onSelect={onCardTypeChange}
              accessPoint={ResourceAccessPoint.ANALYTICS}
            />
          </span>
        </span>
      </div>
    {:else}
      <div class="flex w-full justify-between items-center">
        <span class="font-medium">
          {card.type === AnalyticsCardType.TARGETS
            ? "Targets"
            : (card.label ?? timePeriodTitle)}
        </span>
        {#if card.type != AnalyticsCardType.TARGETS && card.label}
          <span class="text-fgs2 text-b2">
            {timePeriodTitle}
          </span>
        {/if}
      </div>
    {/if}
  </header>
  {#if isRefreshing || !isPageLoaded}
    <div class="animate-pulse flex flex-col gap-3 py-1">
      <div class="h-8 w-full bg-bgs3 rounded-md"></div>
      <div class="h-4 w-1/2 bg-bgs3 rounded-md"></div>
    </div>
  {:else if errorMessage}
    <div class="flex w-full h-full justify-center items-center">
      <EmptyStatusView
        size={Size.sm}
        mainText={errorMessage}
        actionText="Remove card"
        parentBgIndex={cardBgIndex}
        onclick={onRemoveClick}
      />
    </div>
  {:else}
    <div
      class={cn("flex w-full items-center justify-center", {
        "h-[24rem]": $view.isPortrait && $isInEditMode,
        "h-[22.5rem]": $view.isPortrait && !$isInEditMode
      })}
      style={!$view.isPortrait && !$isInEditMode
        ? "height: calc(100% - 2rem)"
        : !$view.isPortrait
          ? "height: calc(100% - 6rem)"
          : ""}
    >
      {#key refreshId}
        {#if $isInEditMode}
          <div
            class={cn("w-full", {
              "h-full":
                !$view.isPortrait || ($view.isPortrait && !isCarbonChart),
              "h-4/5": $view.isPortrait && isCarbonChart
            })}
          >
            <CardResolver
              {card}
              {data}
              {objectiveColors}
              {previousTimePeriodData}
              parentBgIndex={cardBgIndex}
            />
          </div>
        {:else}
          <CardResolver
            {card}
            {data}
            {objectiveColors}
            {previousTimePeriodData}
            parentBgIndex={cardBgIndex}
          />
        {/if}
      {/key}
    </div>
  {/if}
</div>
