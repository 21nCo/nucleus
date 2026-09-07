<script lang="ts">
  import type { ISessionThumb } from "@nucleum/features/focus/logs/log.type";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { determineResourceType } from "@nucleum/datafn/resource.utils";
  import { resolveObjectiveColor } from "@nucleum/features/focus/goals/goal.utils";
  import type { IObjectiveThumb } from "@nucleum/features/focus/goals/goal.type";
  import CustomColorPropagator from "@21n/elements/style/CustomColorPropagator.svelte";

  let { session }: { session: ISessionThumb } = $props();

  function resolveExpandedObjective(
    item: NonNullable<ISessionThumb["expandedItems"]>[number]
  ) {
    if (determineResourceType(item.id) !== Resource.objective) return undefined;
    return item as unknown as IObjectiveThumb;
  }
</script>

<div class="flex flex-col w-full">
  {#if session.expandedItems && session.expandedItems.length > 0}
    {#each session.expandedItems as item}
      {@const resourceType = determineResourceType(item.id)}
      {#if resourceType === Resource.objective}
        <CustomColorPropagator
          color={resolveObjectiveColor(resolveExpandedObjective(item))}
          class="flex w-full gap-2 text-base items-center"
        >
          <div class="w-2 h-2 rounded-sm bg-ccs1" />
          <div class="text-left text-b2 text-ccs1 truncate w-4/5">
            {item.label}
          </div>
        </CustomColorPropagator>
      {/if}
    {/each}
  {:else}
    <div class="text-b4 text-fgs2 font-medium">NO OBJECTIVES</div>
  {/if}
</div>
