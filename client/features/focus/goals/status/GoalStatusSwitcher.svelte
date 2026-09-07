<script lang="ts">
  import { cn } from "@21n/utils/ui.utils";
  import {
    ObjectiveStatus,
    type ObjectiveStatusValue
  } from "@nucleum/features/focus/goals/goal.type";
  import ObjectiveStatusSwitcherItem from "@nucleum/features/focus/goals/status/GoalStatusSwitcherItem.svelte";

  let {
    status = $bindable(ObjectiveStatus.NOT_STARTED),
    variant = "spread",
    onChange = undefined
  }: {
    status?: ObjectiveStatusValue;
    variant?: "spread" | "dropdown";
    onChange?: ((event: CustomEvent<ObjectiveStatusValue>) => void) | undefined;
  } = $props();
  function emitChange(nextStatus: ObjectiveStatusValue) {
    const changeEvent = new CustomEvent<ObjectiveStatusValue>("change", {
      detail: nextStatus
    });
    onChange?.(changeEvent);
  }
</script>

{#if variant === "spread"}
  <div class="flex justify-between relative">
    <div
      class={cn("absolute top-1/2 left-0 right-0 border-t z-10", {
        "border-fgs4 border-dashed": status !== ObjectiveStatus.COMPLETED,
        "border-ccs1 border-2": status === ObjectiveStatus.COMPLETED
      })}
    />
    {#if status === ObjectiveStatus.IN_PROGRESS}
      <div
        class={cn(
          "absolute top-1/2 left-0 w-1/2 border-2 border-t border-ccs1 z-10"
        )}
      />
    {/if}
    {#each Object.values(ObjectiveStatus) as item}
      <ObjectiveStatusSwitcherItem
        status={item}
        isActive={status === item}
        isAccent={status === ObjectiveStatus.COMPLETED ||
          (status === ObjectiveStatus.IN_PROGRESS &&
            item === ObjectiveStatus.NOT_STARTED)}
        onClick={() => {
          status = item;
          emitChange(status);
        }}
      />
    {/each}
  </div>
{/if}
