<script lang="ts">
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { determineResourceType } from "@nucleum/datafn/resource.utils";
  import type { IObjectiveThumb } from "@nucleum/features/focus/goals/goal.type";
  import ObjectiveSearchResultItem from "@nucleum/features/focus/goals/GoalSearchResultItem.svelte";
  import type { ITaskThumb } from "@nucleum/features/focus/tasks/task.type";

  let { item }: { item: IObjectiveThumb | ITaskThumb } = $props();
  let objectiveItem: IObjectiveThumb | undefined = undefined;

  function resolveObjectiveItem(item: IObjectiveThumb | ITaskThumb) {
    if (determineResourceType(item.id) !== Resource.objective) return undefined;
    return item as IObjectiveThumb;
  }

  let objectiveItemDerived = $derived(resolveObjectiveItem(item));
</script>

{#if objectiveItemDerived}
  <ObjectiveSearchResultItem item={objectiveItemDerived} />
{:else}
  <div class="flex w-full justify-between text-start">
    <span>{item.label}</span>
    <span class="text-b3 text-fgs3 rounded-md bg-bgs2 px-2 py-0.5 h-fit"
      >Task</span
    >
  </div>
{/if}
