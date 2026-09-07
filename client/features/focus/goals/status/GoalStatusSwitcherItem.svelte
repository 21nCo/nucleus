<script lang="ts">
  import { tooltip } from "@nucleum/actions/popover.action";
  import Icon from "@21n/elements/Icon.svelte";
  import { Placement } from "@21n/elements/direction.enum";
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import { enumToString } from "@21n/shared-utils/text.utils";
  import { fly } from "svelte/transition";
  import {
    ObjectiveStatus,
    type ObjectiveStatusValue
  } from "@nucleum/features/focus/goals/goal.type";
  import { resolveObjectiveStatusIcon } from "@nucleum/features/focus/goals/goal.utils";

  let {
    status,
    isActive = false,
    isAccent = false,
    onClick = undefined
  }: {
    status: ObjectiveStatusValue;
    isActive?: boolean;
    isAccent?: boolean;
    onClick?: ((event: MouseEvent) => void) | undefined;
  } = $props();
</script>

<button
  class={cn("flex relative z-20 items-center gap-2 p-1.5 px-3 rounded-md", {
    "bg-ccs4 text-ccs1": isActive || isAccent,
    "bg-bgs3 notouch:hover:bg-bgs4 active:bg-bgs4": !isActive && !isAccent
  })}
  use:tooltip={{
    disabled: isActive,
    text: `Change to **${enumToString(status)}**`
  }}
  onclick={onClick}
>
  <Icon
    icon={status === ObjectiveStatus.COMPLETED
      ? "check-circle"
      : resolveObjectiveStatusIcon(status)}
    size={Size.sm}
    class={cn({
      "text-ccs1": isActive || isAccent,
      "text-fgs3": !isActive && !isAccent
    })}
  />
  {#if isActive}
    <span
      class="text-b2 whitespace-nowrap"
      in:fly={{
        duration: 100,
        x: 10
      }}>{enumToString(status)}</span
    >
  {/if}
</button>
