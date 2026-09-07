<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import RecordStarStatusFeedback from "@nucleum/components/records/RecordStarStatusFeedback.svelte";
  import { ObjectiveStatus, ObjectiveType, type IObjectiveThumb } from "@nucleum/features/focus/goals/goal.type";
  import { resolveObjectiveTypeIcon } from "@nucleum/features/focus/goals/goal.utils";

  let {
    item,
    isCurrentlyFocusing = false,
    color = undefined
  }: {
    item: IObjectiveThumb;
    isCurrentlyFocusing?: boolean;
    color?: number | undefined;
  } = $props();
</script>

<div class="flex items-center gap-1.5 userdata">
  {#if item.status === ObjectiveStatus.COMPLETED}
    <Icon icon="check-circle" class="text-ccs1" isFilled={true} />
  {:else}
    <Icon
      icon={resolveObjectiveTypeIcon(item.type ?? ObjectiveType.INDEFINITE)}
      class={cn({
        "text-ccs1": color
      })}
    />
  {/if}
  <div class="flex flex-col gap-1 flex-grow">
    <div class="flex items-center gap-2">
      <span
        class={cn("text-b2 truncate", {
          "text-ccs1": isCurrentlyFocusing
        })}>{item.label ? item.label : "Untitled"}</span
      >
      <RecordStarStatusFeedback isStarred={item.isStarred} />
    </div>
  </div>
</div>
