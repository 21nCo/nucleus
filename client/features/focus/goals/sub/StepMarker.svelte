<script lang="ts">
  import { cn } from "@21n/utils/ui.utils";
  import { Size } from "@21n/types/size.enum";
  import { ObjectiveStatus, type IObjective } from "@nucleum/features/focus/goals/goal.type";
  import Icon from "@21n/elements/Icon.svelte";
  import { hoverable } from "@nucleum/actions/hover.action";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import { resolveObjectiveStatusIcon } from "@nucleum/features/focus/goals/goal.utils";

  let {
    item,
    index,
    totalLength,
    accessPoint = undefined
  }: {
    item: IObjective | { label?: string; type: string; status: ObjectiveStatus };
    index: number;
    totalLength: number;
    accessPoint?: ResourceAccessPoint | undefined;
  } = $props();

  let isHovering = $state(false);
  const statusIcon = $derived(resolveObjectiveStatusIcon(item.status));
</script>

<div class="flex flex-col items-center relative z-10">
  <div
    class={cn(
      "w-8 h-8 rounded-full text-fgs3 text-b2 flex items-center justify-center border",
      (!item.status || item.status === ObjectiveStatus.NOT_STARTED) && {
        "bg-bgs2 border-brs3": true,
        "group-hover:bg-ccs2 group-hover:border-ccs1 group-hover:text-ccs1":
          item.label
      },
      {
        "bg-ccs2 border-ccs1 text-b2":
          item.status === ObjectiveStatus.IN_PROGRESS ||
          item.status === ObjectiveStatus.COMPLETED,
        "border-dashed": item.status === ObjectiveStatus.IN_PROGRESS
      }
    )}
    use:hoverable={{
      onHover: (val) => {
        isHovering = val;
      }
    }}
  >
    {#if isHovering}
      <Icon
        icon="rearrange"
        class={cn({
          "text-ccs1": accessPoint !== ResourceAccessPoint.FORM,
          "text-fgs3": accessPoint === ResourceAccessPoint.FORM
        })}
        size={Size.sm}
      />
    {:else if item.status === ObjectiveStatus.COMPLETED}
      <Icon icon={statusIcon} class="text-ccs1" size={Size.sm} />
    {:else if item.status === ObjectiveStatus.IN_PROGRESS}
      <Icon icon={statusIcon} class="text-ccs1" size={Size.sm} />
    {:else if item.type === "add"}
      <Icon icon="plus" class="text-fgs3" size={Size.sm} />
    {:else}
      {index + 1}
    {/if}
  </div>
  {#if index !== totalLength - 1}
    <div
      class={cn("w-0.25 h-12 border-l absolute top-8 left-4 -translate-x-1/2", {
        "border-brs3": !item.status || item.status === ObjectiveStatus.NOT_STARTED,
        "border-dashed": item.status !== ObjectiveStatus.COMPLETED,
        "border-ccs1":
          item.status === ObjectiveStatus.IN_PROGRESS ||
          item.status === ObjectiveStatus.COMPLETED
      })}
    />
  {/if}
</div>
