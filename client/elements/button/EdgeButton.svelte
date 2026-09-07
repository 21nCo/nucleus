<script lang="ts">
  import type { MouseEventHandler } from "svelte/elements";
  import { Size } from "@21n/types/size.enum";
  import Icon from "../Icon.svelte";
  import { Placement } from "@21n/types/direction.enum";
  import { cn } from "@21n/utils/ui.utils";
  import { hoverable } from "@nucleum/actions/hover.action";

  let {
    edge = Placement.Bottom,
    label = undefined,
    icon = undefined,
    tooltip = undefined,
    onclick = undefined,
  }: {
    edge?: Placement;
    label?: string | undefined;
    icon?: string | undefined;
    tooltip?: string | undefined;
    onclick?: MouseEventHandler<HTMLButtonElement> | undefined;
  } = $props();
  void tooltip;
  let isHovering: boolean = false;
</script>

<button
  class={cn(
    "flex justify-center items-center text-fgs3 hover:text-fgs1 text-b2 gap-1",
    {
      "w-full": edge === Placement.Bottom || edge === Placement.Top,
      "h-full": edge === Placement.Left || edge === Placement.Right,
      "hover:bg-gradient-to-t from-bgs2 via-bgs2/50 to-bgs1 pb-4 2k:pb-6 pt-8":
        edge === Placement.Bottom,
      "hover:bg-gradient-to-b from-bgs2 via-bgs1 to-bgs1":
        edge === Placement.Top,
      "hover:bg-gradient-to-l from-bgs2 via-bgs1 to-bgs1":
        edge === Placement.Left,
      "hover:bg-gradient-to-r from-bgs2 via-bgs1 to-bgs1":
        edge === Placement.Right
    }
  )}
  use:hoverable={{
    onHover: (val) => {
      isHovering = val;
    }
  }}
  onclick={(event) => {
    onclick?.(event);
  }}
>
  {#if icon}
    <Icon
      {icon}
      size={label ? Size.sm : Size.lg}
      isFilled={isHovering}
      class="text-fgs3 hover:text-fgs1"
    />
  {/if}
  {#if label}
    {label}
  {/if}
</button>
