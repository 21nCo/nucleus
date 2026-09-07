<script lang="ts">
  import { pointronPreferences } from "@nucleum/features/focus/preferences.store";
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/elements/size.enum";
  import { formatTime } from "@21n/utils/time.utils";
  import { onMount } from "svelte";
  import DurationSuggestions from "@nucleum/features/focus/logs/manualLog/DurationSuggestions.svelte";
  import FormControlLabel from "@21n/elements/text/formLabel/FormControlLabel.svelte";
  import Button from "@21n/elements/button/Button.svelte";
  import { ButtonStyle, ButtonVariant } from "@21n/elements/button/button.type";
  import { userPreferences } from "@nucleum/stores/preferences/user-preferences.store";
  import DatePicker from "@21n/elements/datetime/DatePicker.svelte";
  import DurationInput from "@21n/elements/input/durationInput/DurationInput.svelte";
  import { manualLogStore } from "@nucleum/features/focus/logs/log.store";
  import TimeInput from "@21n/elements/datetime/TimeInput.svelte";
  import {
    LastActionPerformed,
    type IManualSessionLogForm
  } from "@nucleum/features/focus/logs/log.type";
  import TextSearchInput from "@21n/elements/input/TextSearchInput.svelte";
  import { InputStyle } from "@21n/elements/input/input.type";
  import { Orientation } from "@21n/elements/direction.enum";
  import FocusNotes from "@nucleum/features/focus/notes/FocusNotes.svelte";
  import InlineErrorMessage from "@21n/elements/text/InlineErrorMessage.svelte";
  import { isPrimaryActionDisabled } from "@nucleum/application/modal/modal.store";
  import ObjectiveSearchResultItem from "@nucleum/features/focus/goals/GoalSearchResultItem.svelte";
  import { uiState } from "@nucleum/stores/uiState/uiState.store";
  import { UIState, UIStateScope } from "@nucleum/stores/uiState/uiState.type";
  import PanelSwitcher from "@21n/elements/switcher/PanelSwitcher.svelte";
  import { BarStyle, PanelSwitcherStyle } from "@21n/elements/switcher/switcher.enum";
  import Divider from "@21n/elements/Divider.svelte";
  import {
    ObjectiveStatus,
    type IObjective,
    type IObjectiveThumb
  } from "@nucleum/features/focus/goals/goal.type";
  import CustomColorPropagator from "@21n/elements/style/CustomColorPropagator.svelte";
  import { resolveObjectiveColor } from "@nucleum/features/focus/goals/goal.utils";
  import {
    removeDuplicatesFilter,
    resourceInList
  } from "@nucleum/datafn/resource.utils";
  import view from "@nucleum/stores/view.store";
  import { cn } from "@21n/utils/ui.utils";
  import { isValidArrayWithData } from "@21n/shared-utils/obj.utils";
  import { datafn } from "@nucleum/datafn/datafn.store";

  let { item }: { item: IManualSessionLogForm } = $props();

  let previousStartDate = $state<Date>(new Date());
  let previousEndDate = $state<Date>(new Date());
  let previousStartTime = $state<string>("");
  let previousEndTime = $state<string>("");
  let lastActionPerformed = $state<LastActionPerformed | null>(null);
  let label = $state<string>("");
  let selectedObjective = $state<any>(undefined);
  let inputRef = $state<any>(undefined);
  let selectedQuickAddItem = $state<number>(resolveQuickAddSelection());
  let error = $state<string>("");
  let defaultTime = Date.now();
  let notes = $state<any>({ blocks: [] });
  let selectedMethod = $state<"duration" | "startEnd">(
    uiState.getState(UIState.manualLogDurationMethod, {
      scope: UIStateScope.DEVICE
    }) ?? "duration"
  );
  let recentObjectives = $state<IObjective[]>([]);

  $effect(() => {
    item.notes = notes;
  });

  onMount(() => {
    previousStartDate = item.startDate;
    previousEndDate = item.endDate;
    previousStartTime = item.startTime;
    previousEndTime = item.endTime;
    notes = item.notes ?? { blocks: [] };
    resolveRecentObjectives();
    onQuickDurationSelectDelegate(selectedQuickAddItem, true);
    setTimeout(() => {
      if (inputRef) inputRef.focus();
    }, 100);
    return () => {
      $isPrimaryActionDisabled = false;
    };
  });

  async function resolveRecentObjectives() {
    const state = uiState.getState(UIState.manualLogRecentObjectives);
    if (state) {
      const result = await datafn.objective.query({
        select: ["*", "children.*", "tasks.*"],
        filters: {
          id: { $in: state }
        }
      });
      if (isValidArrayWithData(result.data)) {
        recentObjectives = state
          .map((x: string) => result.data.find(resourceInList(x)))
          .filter((objective: IObjective | undefined): objective is IObjective => Boolean(objective))
          .slice(0, $view.isConstrainedWidth ? 3 : 5);
      }
    }
  }

  function resolveObjectiveThumb(objective: IObjective) {
    return objective as unknown as IObjectiveThumb;
  }

  function resolveQuickAddSelection() {
    const state = uiState.getState(UIState.manualLogQuickDuration, {
      scope: UIStateScope.DEVICE
    });
    return state ?? $pointronPreferences?.manualEntryQuickDurations?.[0] ?? 10;
  }

  function onObjectiveSelect(objective: IObjective) {
    selectedObjective = objective;
    addToRecentObjectives(objective);
    item.objectiveId = objective.id;
    label = "";
    performValidationChecks();
  }

  function addToRecentObjectives(objective: IObjective) {
    uiState.setState(
      UIState.manualLogRecentObjectives,
      [objective.id, ...(uiState.getState(UIState.manualLogRecentObjectives) ?? [])]
        .filter(removeDuplicatesFilter)
        .slice(0, 5)
    );
  }

  function onQuickDurationSelected(event: any) {
    onQuickDurationSelectDelegate(event?.detail);
  }

  function onQuickDurationSelectDelegate(
    duration: number,
    isPreventValidation: boolean = false
  ) {
    item.duration = duration * 60;
    item.endDate = new Date(defaultTime);
    item.endTime = formatTime($userPreferences, item.endDate, {
      format: "24"
    })!;
    updateStartTimeWRTDuration();
    if (!isPreventValidation)
      performValidationChecks("onQuickDurationSelected");
  }

  function onObjectiveClicked() {
    selectedObjective = undefined;
    resolveRecentObjectives();
    setTimeout(() => {
      inputRef.focus();
    }, 100);
    performValidationChecks();
  }

  function setTimeToDate(
    date: Date,
    hours: number,
    minutes: number,
    seconds: number,
    milliseconds: number
  ) {
    const newDate = new Date(date);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    newDate.setSeconds(seconds);
    newDate.setMilliseconds(milliseconds);
    return newDate;
  }

  function syncStartAndEndRespectively() {
    item.startDate = setTimeToDate(
      item.startDate,
      Number(item.startTime.split(":")[0]),
      Number(item.startTime.split(":")[1]),
      0,
      0
    );
    item.endDate = setTimeToDate(
      item.endDate,
      Number(item.endTime.split(":")[0]),
      Number(item.endTime.split(":")[1]),
      0,
      0
    );
    previousEndDate = item.endDate;
    previousStartDate = item.startDate;
    previousEndTime = item.endTime;
    previousStartTime = item.startTime;
  }

  function onTimeChange(event: any) {
    let start: Date;
    let end: Date;
    selectedQuickAddItem = 0;
    if (item.startTime === "") {
      item.startDate = previousStartDate;
      item.startTime = previousStartTime;
    }
    if (item.endTime === "") {
      item.endDate = previousEndDate;
      item.endTime = previousEndTime;
    }
    if (
      lastActionPerformed === LastActionPerformed.DURATION_CHANGED &&
      (item.startDate !== previousStartDate ||
        item.startTime !== previousStartTime)
    ) {
      syncStartAndEndRespectively();
      updateEndTimeWRTDuration();
      lastActionPerformed = LastActionPerformed.START_TIME_CHANGED;
      return;
    } else if (
      item.startDate !== previousStartDate ||
      item.startTime !== previousStartTime
    ) {
      lastActionPerformed = LastActionPerformed.START_TIME_CHANGED;
    } else if (
      item.endDate !== previousEndDate ||
      item.endTime !== previousEndTime
    ) {
      lastActionPerformed = LastActionPerformed.END_TIME_CHANGED;
    }
    syncStartAndEndRespectively();
    const duration = (item.endDate.getTime() - item.startDate.getTime()) / 1000;
    if (duration <= 0) {
      item.duration = 0;
    } else
      item.duration =
        (item.endDate.getTime() - item.startDate.getTime()) / 1000;
    performValidationChecks("onTimeChange");
  }

  function updateEndTimeWRTDuration() {
    item.endDate = new Date(item.startDate.getTime() + item.duration * 1000);
    item.endTime = formatTime($userPreferences, item.endDate, {
      format: "24"
    })!;
    previousEndDate = item.endDate;
    previousEndTime = item.endTime;
  }

  function updateStartTimeWRTDuration() {
    item.startDate = new Date(item.endDate.getTime() - item.duration * 1000);
    item.startTime = formatTime($userPreferences, item.startDate, {
      format: "24"
    })!;
    previousStartDate = item.startDate;
    previousStartTime = item.startTime;
  }

  function onDurationChange(event: any) {
    item.duration = event?.detail?.value;
    selectedQuickAddItem = 0;
    if (lastActionPerformed === LastActionPerformed.START_TIME_CHANGED)
      updateEndTimeWRTDuration();
    else updateStartTimeWRTDuration();
    lastActionPerformed = LastActionPerformed.DURATION_CHANGED;
    performValidationChecks("ondurationchange");
  }

  function performValidationChecks(src?: string) {
    if (selectedMethod === "duration") {
      if (item.duration <= 0) {
        error = "Duration should be greater than 0.";
        $isPrimaryActionDisabled = true;
        return;
      }
    } else {
      if (item.startDate.getFullYear() < 1971) {
        error = "Please select a valid date. Year should be greater than 1971.";
        $isPrimaryActionDisabled = true;
        return;
      }
      if (item.startDate.getTime() >= item.endDate.getTime()) {
        error = "Start time should be less than end time.";
        $isPrimaryActionDisabled = true;
        return;
      }
    }

    if (selectedObjective === undefined) {
      error = "Please select an objective";
      $isPrimaryActionDisabled = true;
      return;
    }
    error = "";
    $isPrimaryActionDisabled = false;
  }

  async function searchCallback(searchQuery: string) {
    const result = await datafn.objective.query({
      select: ["*", "parent.*"],
      search: searchQuery ? { query: searchQuery, fields: ["label"] } : undefined,
      filters: {
        id: { $ne: "" },
        status: {
          $ne: ObjectiveStatus.COMPLETED
        }
      }
    });
    return result.data;
  }
</script>

<div
  class={cn(
    "relative flex flex-col border border-brs2 py-8 xl:py-6 rounded-md w-full",
    {
      "gap-12": !error,
      "gap-4": error
    }
  )}
>
  {#if $manualLogStore.manualLogs.length > 1}
    <div class="absolute bg-bgs1 right-1 -top-3">
      <Button
        icon="minus-circle"
        size={Size.xs}
        type={ButtonVariant.DANGER}
        style={ButtonStyle.OUTLINED}
        isPreventMinWidth={true}
        label="Remove"
        onclick={() => manualLogStore.remove(item.id)}
      />
    </div>
  {/if}

  <div class="flex flex-col gap-4 px-4 xl:px-4">
    {#if selectedObjective}
      <div
        class="flex justify-start w-full py-2 border border-bgs4 px-2 rounded-md userdata"
      >
        <CustomColorPropagator
          color={resolveObjectiveColor(selectedObjective)}
          class="flex justify-between items-center w-full text-ccs1"
          onclick={onObjectiveClicked}
        >
          {selectedObjective.label || "Untitled"}
          <Button icon="cross" />
        </CustomColorPropagator>
      </div>
    {:else}
      <TextSearchInput
        onSelect={(e) => onObjectiveSelect(e?.detail?.item)}
        bind:value={label}
        bind:this={inputRef}
        searchResultComponent={ObjectiveSearchResultItem}
        {searchCallback}
        style={InputStyle.BORDERED}
        placeholder="Start typing to select objective"
      />
      {#if recentObjectives && recentObjectives.length > 0}
        <div class="flex items-center flex-wrap gap-3">
          <span class="text-b2 text-fgs3"> Recently used: </span>
          {#each recentObjectives as objective}
            <CustomColorPropagator
              color={resolveObjectiveColor(resolveObjectiveThumb(objective))}
              class="flex items-center gap-2 border border-ccs1 rounded-md px-2 py-1 text-ccs1 bg-ccs5 hover:bg-ccs4 userdata"
              onclick={() => {
                onObjectiveSelect(objective);
              }}
            >
              {objective.label || "Untitled"}
            </CustomColorPropagator>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
  {#if error}
    <InlineErrorMessage isDissappear={false} bind:error />
  {/if}
  <div class="flex flex-col gap-6">
    <div class="flex justify-start">
      <PanelSwitcher
        items={[
          { label: "Duration", value: "duration" },
          { label: "Start and End", value: "startEnd" }
        ]}
        style={PanelSwitcherStyle.BAR}
        barStyle={BarStyle.EXACT}
        isExpandToFullWidth={true}
        size={Size.sm}
        bind:value={selectedMethod}
        onSwitch={() => {
          uiState.setState(UIState.manualLogDurationMethod, selectedMethod, {
            scope: UIStateScope.DEVICE
          });
        }}
      />
    </div>

    <div class="flex flex-col gap-6 px-4 xl:px-4">
      {#if selectedMethod === "duration"}
        <div class="w-full max-w-full">
          <DurationSuggestions
            onSelect={onQuickDurationSelected}
            bind:selectedItem={selectedQuickAddItem}
          />
        </div>
        <div class="flex flex-col items-start w-full gap-2">
          <DurationInput
            label={{
              label: "Or enter manually",
              orientation: Orientation.Vertical
            }}
            value={item.duration}
            onChange={onDurationChange}
          />
        </div>
      {:else}
        <div class="flex flex-col gap-2">
          <FormControlLabel props={{ label: "Start" }} />
          <div class="flex items-center w-full gap-4">
            <DatePicker bind:date={item.startDate} onChange={onTimeChange} />
            <TimeInput bind:value={item.startTime} onChange={onTimeChange} />
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <FormControlLabel props={{ label: "End" }} />
          <div class="flex items-center w-full gap-4">
            <DatePicker bind:date={item.endDate} onChange={onTimeChange} />
            <TimeInput bind:value={item.endTime} onChange={onTimeChange} />
          </div>
        </div>
      {/if}
    </div>
  </div>

  <div class="flex flex-col">
    <Divider />
    <div class="px-4 xl:px-4 py-3">
      <FocusNotes bind:md={notes} isHideTitle={true} placeholder="Add notes" />
    </div>
  </div>
</div>
