<script lang="ts">
  import AnalyticsChart from "@nucleum/features/focus/analytics/page/AnalyticsChart.svelte";
  import {
    type AnalyticsDataRecord,
    type IAnalyticsLabelColor,
    AnalyticsCardType
  } from "@nucleum/features/focus/analytics/analytics.types";
  import {
    TimePeriodType,
    TimeScale,
    type TimePeriod,
    type TimePeriodValue
  } from "@21n/utils/time.type";
  import CardSelector from "@nucleum/features/focus/analytics/page/CardSelector.svelte";
  import { resolveRelativeTimePeriodOptions } from "@21n/elements/datetime/datetime.utils";
  import type { ISessionLog } from "@nucleum/features/focus/logs/log.type";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import {
    removeDuplicatesFilter,
    resourceInList
  } from "@nucleum/datafn/resource.utils";
  import type { IObjectiveThumb } from "@nucleum/features/focus/goals/goal.type";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import { resolveObjectiveColor } from "@nucleum/features/focus/goals/goal.utils";
  import { cn } from "@21n/utils/ui.utils";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import Text from "@21n/elements/text/Text.svelte";
  import { TextStyle } from "@21n/elements/text/text.enum";
  import {
    determineTimePeriodv2,
    resolveUpperRelativeTimePeriodTitle
  } from "@21n/utils/time.utils";
  import OptionSelector from "@21n/elements/select/OptionSelector.svelte";
  import { Size } from "@21n/elements/size.enum";
  import { OptionSelectorStyle } from "@21n/elements/select/select.type";
  import DropDown from "@21n/elements/dropdown/DropDown.svelte";
  import { userPreferences } from "@nucleum/stores/preferences/user-preferences.store";
  import Toggle from "@21n/elements/toggle/Toggle.svelte";
  import { fly } from "svelte/transition";
  import SwitchInput from "@21n/elements/toggle/SwitchInput.svelte";
  import view from "@nucleum/stores/view.store";
  import { LoadingAnimationType } from "@21n/elements/feedback/feedback.type";
  import { uiState } from "@nucleum/stores/uiState/uiState.store";
  import { UIState, UIStateScope } from "@nucleum/stores/uiState/uiState.type";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { time } from "@datafn/client";
  import { toSvelteStore } from "@datafn/svelte";
  let {
    accessPoint = ResourceAccessPoint.CALENDAR,
    date,
    showLegend = true,
    scale,
    objectiveId
  }: {
    accessPoint?: ResourceAccessPoint;
    date?: Date;
    showLegend?: boolean;
    scale?: TimeScale;
    objectiveId?: IRecordId;
  } = $props();
  let periodValue = $state<TimePeriodValue>({
    type: TimePeriodType.RELATIVE,
    param: 0
  });

  let chartType = $state(AnalyticsCardType.DONUT);
  const scales = $userPreferences.timeScales ?? [
    TimeScale.DAYS,
    TimeScale.MONTHS,
    TimeScale.YEARS
  ];
  let isShowOptions = $state(resolveShowOptionsState());
  let isIncludeSubObjectives = $state(false);
  let timePeriodOptions = $derived(
    resolveRelativeTimePeriodOptions(scale ?? TimeScale.DAYS)
  );
  const objectiveStore = toSvelteStore<IObjectiveThumb[]>(
    datafn.objective.signal({
      select: ["*", "parent.*", "children.*", "tasks.*"],
      filters: {
        id: { $ne: "" }
      }
    }),
    { initialData: [] }
  );
  const queryContext = $derived.by(() =>
    resolveQueryContext($objectiveStore.data)
  );
  const sessionLogStore = $derived.by(() =>
    toSvelteStore<ISessionLog[]>(
      datafn.sessionLog.signal({
        select: ["id", "startUnix", "objectiveId", "focus", "breakTime"],
        filters: {
          ...(queryContext.startFilter
            ? { startUnix: queryContext.startFilter }
            : {}),
          ...(queryContext.objectiveIds.length > 0
            ? { objectiveId: { $in: queryContext.objectiveIds } }
            : {})
        },
        ...(queryContext.temporal ? { temporal: queryContext.temporal } : {})
      }),
      { initialData: [] }
    )
  );
  const data = $derived(
    resolveChartData($sessionLogStore.data, queryContext.objectives)
  );
  const objectiveColors = $derived(
    resolveObjectiveColors(data, queryContext)
  );
  const resolvedTimePeriod = $derived(queryContext.resolvedTimePeriod);
  const isRefreshing = $derived(
    $objectiveStore.loading ||
      $objectiveStore.refreshing ||
      $sessionLogStore.loading ||
      $sessionLogStore.refreshing
  );

  function resolveShowOptionsState() {
    return (
      uiState.getState(UIState.analyticsChartStandaloneShowOptions, {
        scope: UIStateScope.DAP
      }) ?? false
    );
  }

  function persistShowOptionsState() {
    uiState.setState(
      UIState.analyticsChartStandaloneShowOptions,
      isShowOptions,
      {
        scope: UIStateScope.DAP
      }
    );
  }

  function resolveDateInput(value: unknown) {
    if (value instanceof Date) return value;
    if (typeof value === "string" || typeof value === "number") {
      const resolved = new Date(value);
      if (!Number.isNaN(resolved.getTime())) return resolved;
    }
    return undefined;
  }

  function resolveScaleInput(value: unknown) {
    return Object.values(TimeScale).includes(value as TimeScale)
      ? (value as TimeScale)
      : TimeScale.DAYS;
  }

  function resolveObjectiveIdInput(value: unknown) {
    return typeof value === "string" && value.length > 0 ? value : undefined;
  }

  function resolveQueryContext(objectives: IObjectiveThumb[]) {
    if (
      accessPoint === ResourceAccessPoint.CALENDAR &&
      !resolveDateInput(date)
    ) {
      return {
        objectives,
        objectiveIds: [] as IRecordId[],
        resolvedObjectiveId: undefined,
        startFilter: { $gte: 1, $lte: 0 },
        temporal: undefined,
        resolvedTimePeriod: undefined
      };
    }
    const resolvedScale = resolveScaleInput(scale);
    const resolvedObjectiveId = resolveObjectiveIdInput(objectiveId);
    const resolvedDate = resolveDateInput(date);
    let startFilter;
    let temporal;
    let resolvedPeriod;
    if (resolvedDate) {
      temporal = time.day("startUnix", resolvedDate);
    } else {
      resolvedPeriod = determineTimePeriodv2({
        scale: resolvedScale,
        value: periodValue
      } as TimePeriod);
      temporal = time.between(
        "startUnix",
        datafn.temporal.resolveLocalTimeSync(resolvedPeriod.begin),
        datafn.temporal.resolveLocalTimeSync(resolvedPeriod.end)
      );
    }
    let objectiveIds: IRecordId[] = [];
    if (resolvedObjectiveId) {
      objectiveIds.push(resolvedObjectiveId);
      if (isIncludeSubObjectives) {
        const subObjectives = objectives.filter((objective) =>
          isObjectiveDescendantOf(objective, resolvedObjectiveId)
        );
        if (subObjectives) {
          objectiveIds.push(...subObjectives.map((x) => x.id));
        }
      }
    }
    return {
      objectives,
      objectiveIds,
      resolvedObjectiveId,
      startFilter,
      temporal,
      resolvedTimePeriod: resolvedPeriod
    };
  }

  function resolveChartData(logs: ISessionLog[], objectives: IObjectiveThumb[]) {
    return logs.flatMap((log: ISessionLog) => {
      const start = resolveTimestampIso(log.startUnix);
      if (!start) return [];
      const objective = log.objectiveId
        ? resolveObjectiveFromId(log.objectiveId, objectives)
        : undefined;
      return {
        brek: log.breakTime || 0,
        focus: log.focus || 0,
        objectiveLabel: objective
          ? objective.label || "Unknown Objective"
          : "No Objective",
        objectiveId: log.objectiveId || "",
        start,
        topLevelObjectiveLabel: objective?.parent?.[0]?.label ?? "Unknown"
      };
    });
  }

  function resolveTimestampIso(value: unknown) {
    let timestamp: number | undefined;
    if (value instanceof Date) {
      timestamp = value.getTime();
    } else if (typeof value === "number") {
      timestamp = value;
    } else if (typeof value === "string") {
      const trimmed = value.trim();
      timestamp = /^-?\d+(\.\d+)?$/.test(trimmed)
        ? Number(trimmed)
        : Date.parse(trimmed);
    }
    if (timestamp === undefined || !Number.isFinite(timestamp)) return undefined;
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return undefined;
    return date.toISOString();
  }

  function resolveObjectiveColors(
    processedLogs: AnalyticsDataRecord[],
    context: ReturnType<typeof resolveQueryContext>
  ) {
    if (context.resolvedObjectiveId && !isIncludeSubObjectives) {
      const currentObjective = resolveObjectiveFromId(
        context.resolvedObjectiveId,
        context.objectives
      );
      const color = resolveObjectiveColor(currentObjective);
      if (currentObjective && color) {
        return [
          {
            label: currentObjective.label ?? "Untitled objective",
            color
          }
        ];
      }
      return [];
    }
    if (objectiveId) return [];
    const colors: IAnalyticsLabelColor[] = [];
    const objectiveIdsInData = processedLogs.map((x) => x.objectiveId);
    objectiveIdsInData
      .filter(removeDuplicatesFilter)
      .forEach((objectiveId: IRecordId) => {
        const objective = resolveObjectiveFromId(objectiveId, context.objectives);
        if (!objective) return;
        let color = resolveObjectiveColor(objective);
        color = color ?? Math.floor(Math.random() * 360);
        const label = objective.label ?? "Untitled objective";
        if (!colors.some((x) => x.label === label)) {
          colors.push({
            label,
            color
          });
        }
      });
    return colors;
  }

  function resolveObjectiveFromId(
    id: IRecordId | undefined,
    objectives: IObjectiveThumb[]
  ) {
    if (!id) return;
    const objective = objectives.find(resourceInList(id));
    return objective;
  }

  function isObjectiveDescendantOf(
    objective: IObjectiveThumb,
    ancestorId: IRecordId
  ) {
    if (objective.parentId === ancestorId) return true;
    if (objective.parent?.some(resourceInList(ancestorId))) return true;
    return (objective.parentPath ?? "").split("-").includes(ancestorId);
  }
</script>

<div
  class={cn("flex flex-col w-full rounded-md p-3", {
    "h-80 border border-brs3": accessPoint === ResourceAccessPoint.CALENDAR,
    "h-full": accessPoint === ResourceAccessPoint.OBJECTIVE
  })}
>
  {#if accessPoint === ResourceAccessPoint.OBJECTIVE}
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between gap-4 w-full">
        {#if !$view.isConstrainedWidth}
          <Text content={"Focus analytics"} style={TextStyle.PANEL_HEADING} />
        {/if}
        {#if periodValue.type === TimePeriodType.UPPER_RELATIVE && resolvedTimePeriod}
          <span class="text-b2 text-fgs2">
            {resolveUpperRelativeTimePeriodTitle(
              scale ?? TimeScale.DAYS,
              periodValue.param
            )}
          </span>
        {/if}
        <div class="flex items-center gap-2 justify-between cw:flex-1">
          <!-- TODO - add absolute date range picker -->
          <div>
            <DropDown
              items={scales.map((x) => ({
                value: x
              }))}
              size={Size.sm}
              bind:value={scale}
              popoverWidth={"w-36"}
              isDisableSearch={true}
            />
          </div>
          <div class="flex items-center gap-2">
            <CardSelector {accessPoint} bind:selected={chartType} />
            <Toggle
              icon="sliders"
              bgSize={Size.sm}
              bind:on={isShowOptions}
              onChange={() => persistShowOptionsState()}
            />
          </div>
        </div>
      </div>
      {#if isShowOptions}
        <div
          class="flex flex-col gap-4 p-3 bg-bgs2 rounded-md"
          in:fly={{ y: -20, duration: 300 }}
        >
          <SwitchInput
            bind:checked={isIncludeSubObjectives}
            label={{ label: "Include sub-objectives" }}
            isExpanded={true}
          />
        </div>
      {/if}
      <div class="flex items-center gap-2">
        <div class="min-w-0 flex-1 pr-2">
          <OptionSelector
            options={timePeriodOptions}
            size={Size.sm}
            isPreventWrap={true}
            style={OptionSelectorStyle.OUTLINE}
            onSelect={(event) => {
              const val = event.detail;
              const segments = val.split("#");
              if (!val) return;
              periodValue = {
                type: segments[0],
                param: parseInt(segments[1])
              };
            }}
          />
        </div>
      </div>
    </div>
  {/if}
  <div
    class={cn("relative w-full flex-1", {
      "cw:p-3 p-6": accessPoint === ResourceAccessPoint.OBJECTIVE
    })}
  >
    {#if isRefreshing}
      <EmptyStatusView
        isLoadingState={isRefreshing}
        loadingAnimation={LoadingAnimationType.ANALYTICS_CHART_PULSE}
      />
    {:else}
      {#key chartType}
        <AnalyticsChart
          chart={{
            period: {
              scale: scale ?? TimeScale.DAYS,
              value: periodValue
            },
            type: chartType,
            id: "analytics-chart-standalone"
          }}
          rawData={data}
          {objectiveColors}
          {showLegend}
        />
      {/key}
    {/if}
  </div>
</div>
