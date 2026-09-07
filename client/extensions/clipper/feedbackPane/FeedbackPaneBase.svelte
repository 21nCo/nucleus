<script lang="ts">
  import type { Snippet } from "svelte";
  import { toolbarState } from "@nucleum/extensions/clipper/contentScripts/store";
  import { Placement } from "@21n/elements/direction.enum";
  import { cn } from "@21n/utils/ui.utils";
  import { hoverable } from "@nucleum/actions/hover.action";
  import { fly, scale } from "svelte/transition";
  let {
    isHovering = $bindable(false),
    isWithoutToolbarContext = false,
    onHover = undefined,
    children
  }: {
    isHovering?: boolean;
    isWithoutToolbarContext?: boolean;
    onHover?: ((event: CustomEvent<boolean>) => void) | undefined;
    children?: Snippet;
  } = $props();

  /**
   * To prevent default shortcuts interfering with the feedback pane linking or notes.
   *
   * Ex: Pressing I on Youtube minimizes the player and closes the feedback pane.
   * @param e
   */
  function onKey(e: KeyboardEvent) {
    e.stopPropagation();
  }

  function resolveFlyParams(position: Placement) {
    if (position === Placement.Right) {
      return {
        x: 10,
        duration: 300
      };
    } else if (position === Placement.Left) {
      return {
        x: -10,
        duration: 300
      };
    } else if (position === Placement.Bottom) {
      return {
        y: 10,
        duration: 300
      };
    }
  }
</script>

<button
  use:hoverable={{
    onHover: (e) => {
      isHovering = e;
      onHover?.(new CustomEvent<boolean>("hover", { detail: e }));
    }
  }}
  onkeydown={onKey}
  onkeyup={onKey}
  class={cn(
    "fixed w-96 min-h-80 h-fit max-h-[40rem] mo:max-h-full flex flex-col items-center justify-center gap-4 p-4 bg-bgs1 shadow-md rounded-md border border-brs2",
    {
      "inset-y-0 my-auto":
        $toolbarState.position === Placement.Right ||
        $toolbarState.position === Placement.Left,
      "inset-x-0 mx-auto": $toolbarState.position === Placement.Bottom,
      "bottom-4":
        $toolbarState.position === Placement.Bottom && isWithoutToolbarContext,
      "bottom-20 2k:bottom-24":
        $toolbarState.position === Placement.Bottom && !isWithoutToolbarContext,
      "right-4":
        $toolbarState.position === Placement.Right && isWithoutToolbarContext,
      "right-16 2k:right-20":
        $toolbarState.position === Placement.Right && !isWithoutToolbarContext,
      "left-4":
        $toolbarState.position === Placement.Left && isWithoutToolbarContext,
      "left-16 2k:left-20":
        $toolbarState.position === Placement.Left && !isWithoutToolbarContext
    }
  )}
  in:fly={resolveFlyParams($toolbarState.position)}
  out:scale
>
  {@render children?.()}
</button>
