<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import { InputStyle } from "@21n/elements/input/input.type";
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import {
    SubObjectivesLayout,
    type SubObjectivesLayoutValue,
    ObjectiveStatus,
    type IObjective
  } from "@nucleum/features/focus/goals/goal.type";
  import StepMarker from "@nucleum/features/focus/goals/sub/StepMarker.svelte";
  import { parseAndFormatDate } from "@21n/utils/time.utils";

  type IAddSubObjectiveItem = { label?: string; type: "add" };

  let {
    subObjective,
    index,
    totalLength,
    method = SubObjectivesLayout.DEFAULT,
    onAdd = undefined,
    onClick = undefined
  }: {
    subObjective: IObjective | IAddSubObjectiveItem;
    index: number;
    totalLength: number;
    method?: SubObjectivesLayoutValue;
    onAdd?: ((event: CustomEvent<{ label: string }>) => void) | undefined;
    onClick?: ((event: MouseEvent) => void) | undefined;
  } = $props();

  let newSubObjectiveLabel = $state("");

  function isSavedSubObjective(
    subObjective: IObjective | IAddSubObjectiveItem
  ): subObjective is IObjective {
    return "id" in subObjective;
  }

  const stepMarkerItem = $derived(
    isSavedSubObjective(subObjective)
      ? subObjective
      : { ...subObjective, status: ObjectiveStatus.NOT_STARTED }
  );

  function onSave() {
    onAdd?.(
      new CustomEvent("add", {
        detail: { label: newSubObjectiveLabel }
      })
    );
    newSubObjectiveLabel = "";
  }
</script>

{#if method === SubObjectivesLayout.STEPS}
  <button
    class={cn(
      "flex group items-center gap-4 relative border border-transparent rounded-md p-1",
      {
        "hover:border-ccs2 hover:bg-ccs3": subObjective.label
      }
    )}
    onclick={onClick}
    data-id={isSavedSubObjective(subObjective) ? subObjective.id : undefined}
    data-index={index}
    data-type={subObjective.type}
    draggable={true}
  >
    <StepMarker item={stepMarkerItem} {index} {totalLength} />
    {#if subObjective.label}
      <div
        class={cn("text-left flex-1 py-1.5 group-hover:text-ccs1", {
          "line-through":
            isSavedSubObjective(subObjective) &&
            subObjective.status === ObjectiveStatus.COMPLETED
        })}
      >
        {subObjective.label ? subObjective.label : "Untitled"}
      </div>
      {#if isSavedSubObjective(subObjective) && subObjective.startDate && subObjective.endDate}
        <div class="text-b3 text-fgs3">
          {parseAndFormatDate(new Date(subObjective.startDate))} -
          {parseAndFormatDate(new Date(subObjective.endDate))}
        </div>
      {/if}
    {:else}
      <TextInput
        bind:value={newSubObjectiveLabel}
        placeholder="Add a sub-objective"
        style={InputStyle.PLAIN}
        isShowSaveControl={newSubObjectiveLabel !== ""}
        onEnter={onSave}
        onCancel={() => (newSubObjectiveLabel = "")}
        onSave={onSave}
      />
    {/if}
  </button>
{:else}
  <button
    class="flex items-center group gap-4 p-2 border border-transparent hover:border-aps2 rounded-md"
    onclick={onClick}
  >
    {#if subObjective.label}
      <div class="text-left flex-1 group-hover:text-aps1">
        {subObjective.label}
      </div>
    {:else}
      <TextInput
        bind:value={newSubObjectiveLabel}
        placeholder="Add a sub-objective"
        style={InputStyle.PLAIN}
        isShowSaveControl={newSubObjectiveLabel !== ""}
        onEnter={onSave}
        onSave={onSave}
        onCancel={() => (newSubObjectiveLabel = "")}
      />
    {/if}
  </button>
{/if}
