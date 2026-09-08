<script lang="ts">
  import { type IActiveObjectiveStore } from "@nucleum/features/focus/goals/goal.store";
  import ObjectiveCollectionsRow from "@nucleum/features/focus/goals/GoalCollectionsRow.svelte";
  import ObjectiveTitleRow from "@nucleum/features/focus/goals/info/GoalTitleRow.svelte";
  import { SubObjectivesLayout } from "@nucleum/features/focus/goals/goal.type";
  import { cn } from "@21n/utils/ui.utils";
  import { type IInlineStatus } from "@nucleum/stores/notifications/notification.type";
  import SubObjectivesPanel from "@nucleum/features/focus/goals/sub/SubGoalsPanel.svelte";
  import RecordStatusBanner from "@nucleum/components/records/RecordStatusBanner.svelte";

  let {
    objective,
    isConstrainedWidth = false,
    status = $bindable()
  }: {
    objective: IActiveObjectiveStore;
    isConstrainedWidth?: boolean;
    status?: IInlineStatus | undefined;
  } = $props();
</script>

<div
  class={cn("relative flex flex-col gap-6 h-full", {
    "rounded-md p-3": isConstrainedWidth
  })}
>
  <div class="flex flex-col gap-2 px-3 pt-3 w-full h-fit">
    {#if !isConstrainedWidth}
      <ObjectiveTitleRow {objective} bind:status />
    {/if}
    <div class="flex flex-col gap-1">
      {#if isConstrainedWidth}
        <span class="text-b2 text-fgs3">Collections</span>
      {/if}
      {#if !$objective.isInEditMode}
        <ObjectiveCollectionsRow {objective} />
      {/if}
    </div>
    <RecordStatusBanner resource={objective} />
  </div>
  <div
    class={cn({
      "px-3": $objective.subObjectivesLayout === SubObjectivesLayout.STEPS
    })}
  >
    <SubObjectivesPanel {objective} />
  </div>
</div>
