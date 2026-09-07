<script lang="ts">
  import type { IActiveObjectiveStore } from "./goal.store";
  import ObjectiveInfoPanel from "./info/GoalInfoPanel.svelte";
  import SubObjectivesPanel from "./sub/SubGoalsPanel.svelte";
  import ObjectiveHistory from "./history/GoalHistory.svelte";
  import ObjectiveTasks from "./tasks/GoalTasks.svelte";
  import ObjectiveAnalytics from "./GoalAnalytics.svelte";
  import PropertiesPane from "@nucleum/features/collections/properties/PropertiesPane.svelte";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { ResourcePanelType } from "@nucleum/stores/resources/resource-panel.type";
  import type { IInlineStatus } from "@nucleum/stores/notifications/notification.type";

  let {
    objective,
    isConstrainedWidth = false,
    isThreeColumned = false,
    status = $bindable()
  }: {
    objective: IActiveObjectiveStore;
    isConstrainedWidth?: boolean;
    isThreeColumned?: boolean;
    status?: IInlineStatus | undefined;
  } = $props();

  const objectivePanel = $derived($objective?.panel);
  const objectiveId = $derived($objective?.id);
  const isActiveResource = $derived(
    !$objective?.isArchived &&
      $objective?.trashedAt == null &&
      !$objective?.isAncestorInactive
  );
</script>

<div class="cw:w-full h-full transition-all flex">
  {#if objectivePanel === ResourcePanelType.OVERVIEW}
    <div class="flex flex-col min-w-96 grow gap-4 p-2 h-full">
      {#if objectiveId}
        <ObjectiveTasks id={objectiveId} {isActiveResource} />
      {/if}
    </div>
  {:else}
    <div class="cw:p-0 p-4 grow cw:w-full">
      {#if objectivePanel === ResourcePanelType.DEFAULT}
        <ObjectiveInfoPanel {objective} {isConstrainedWidth} bind:status />
      {:else if objectivePanel === ResourcePanelType.SUB}
        <SubObjectivesPanel {objective} {isActiveResource} />
      {:else if objectivePanel === ResourcePanelType.ACTIVITY}
        <ObjectiveHistory {objective} />
      {:else if objectivePanel === ResourcePanelType.TASKS}
        {#if objectiveId}
          <ObjectiveTasks id={objectiveId} {isActiveResource} />
        {/if}
      {:else if objectivePanel === ResourcePanelType.ANALYTICS}
        {#if objectiveId}
          <ObjectiveAnalytics id={objectiveId} />
        {/if}
      {:else if objectivePanel === ResourcePanelType.PROPERTIES}
        <div class="flex w-full justify-center">
          <div class="w-96">
            <PropertiesPane item={objective} resource={Resource.objective} />
          </div>
        </div>
      {/if}
    </div>
  {/if}
  {#if isThreeColumned && objectivePanel === ResourcePanelType.OVERVIEW}
    <div class="flex flex-col bg-bgs2 border-l border-brs2 min-w-96 w-96 p-4">
      <ObjectiveInfoPanel {objective} />
    </div>
  {/if}
</div>
