<script lang="ts">
  import TextSearchInput from "@21n/elements/input/TextSearchInput.svelte";
  import { InputStyle } from "@21n/elements/input/input.type";
  import ObjectiveSearchResultItem from "@nucleum/features/focus/goals/GoalSearchResultItem.svelte";
  import {
    ObjectiveStatus,
    type IObjectiveThumb
  } from "@nucleum/features/focus/goals/goal.type";
  import {
    isSameResource,
    resourceInList
  } from "@nucleum/datafn/resource.utils";
  import CustomColorPropagator from "@21n/elements/style/CustomColorPropagator.svelte";
  import { resolveObjectiveColor } from "@nucleum/features/focus/goals/goal.utils";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import Icon from "@21n/elements/Icon.svelte";
  import { datafn } from "@nucleum/datafn/datafn.store";

  let {
    selectedObjectives = $bindable([])
  }: {
    selectedObjectives?: IObjectiveThumb[];
  } = $props();
  let label = $state("");
  let inputRef = $state<any>();

  async function searchCallback(searchQuery: string) {
    const result = await datafn.objective.query({
      select: ["*", "parent.*"],
      search: searchQuery
        ? { query: searchQuery, fields: ["label"] }
        : undefined,
      filters: {
        id: { $ne: "" },
        status: {
          $ne: ObjectiveStatus.COMPLETED
        }
      }
    });
    return result.data;
  }

  function onObjectiveSelect(objective: IObjectiveThumb) {
    if (!selectedObjectives.some(resourceInList(objective))) {
      selectedObjectives = [...selectedObjectives, objective];
    }
    label = "";
  }

  function removeObjective(objectiveId: IRecordId) {
    selectedObjectives = selectedObjectives.filter(
      (objective) => !isSameResource(objective, objectiveId)
    );
  }
</script>

<div class="flex flex-col gap-2">
  <TextSearchInput
    onSelect={(e) => onObjectiveSelect(e?.detail?.item)}
    label={{
      label: "Preset objectives (Optional)",
      tooltip: {
        body: "Objectives added in a preset will be automatically added to the focus session when the preset is selected."
      }
    }}
    bind:value={label}
    bind:this={inputRef}
    searchResultComponent={ObjectiveSearchResultItem}
    {searchCallback}
    style={InputStyle.BORDERED}
    placeholder="Start typing to search for objectives"
  />
  {#if selectedObjectives.length > 0}
    <div class="flex items-center flex-wrap gap-3 userdata">
      {#each selectedObjectives as objective}
        <CustomColorPropagator
          color={resolveObjectiveColor(objective)}
          class="flex items-center gap-2 border border-ccs1 rounded-md px-2 py-1 text-ccs1 bg-ccs5 hover:bg-ccs4"
        >
          <span>{objective.label || "Untitled"}</span>
          <Icon
            icon="cross"
            class="text-ccs1 hover:text-ccs2"
            data-testid={`remove-objective-${objective.id}`}
            onclick={() => removeObjective(objective.id)}
          />
        </CustomColorPropagator>
      {/each}
    </div>
  {/if}
</div>
