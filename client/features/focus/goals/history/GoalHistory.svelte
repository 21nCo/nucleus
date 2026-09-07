<script lang="ts">
  import type { IActiveObjectiveStore } from "@nucleum/features/focus/goals/goal.store";
  import ComingSoonView from "@21n/elements/ComingSoonView.svelte";
  import OptionSelector from "@21n/elements/select/OptionSelector.svelte";
  import SwitchInput from "@21n/elements/toggle/SwitchInput.svelte";
  import { Size } from "@21n/elements/size.enum";
  import ObjectiveAllActivityPanel from "@nucleum/features/focus/goals/history/GoalAllActivityPanel.svelte";
  import ObjectiveFocusSessions from "@nucleum/features/focus/goals/history/GoalFocusSessions.svelte";

  let { objective }: { objective: IActiveObjectiveStore } = $props();
  let selectedOption = $state("all");
  let isIncludeSubObjectives = $state(false);
</script>

<div class="flex flex-col w-full h-full gap-2 overflow-auto">
  <div class="flex w-full gap-4 justify-between px-4">
    <OptionSelector
      options={[
        {
          label: "All",
          icon: "asterisk",
          value: "all"
        },
        {
          label: "Focus sessions",
          icon: "circle",
          value: "focus"
        }
      ]}
      size={Size.sm}
      bind:selected={selectedOption}
    />
    {#if selectedOption === "focus"}
      <SwitchInput
        label={{ label: "Include sub objectives" }}
        size={Size.sm}
        bind:checked={isIncludeSubObjectives}
      />
    {/if}
  </div>
  {#if selectedOption === "focus"}
    {#key isIncludeSubObjectives}
      <ObjectiveFocusSessions id={$objective.id} {isIncludeSubObjectives} />
    {/key}
  {:else if selectedOption === "all"}
    <ObjectiveAllActivityPanel
      objectiveId={$objective.id}
      createdAt={new Date($objective.createdAt).toISOString()}
    />
  {/if}
</div>
