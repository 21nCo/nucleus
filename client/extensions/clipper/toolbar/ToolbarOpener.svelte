<script lang="ts">
  import { hoverable } from "@nucleum/actions/hover.action";
  import SubAtomLogo from "@21n/branding/SubAtomLogo.svelte";
  import { Placement } from "@21n/types/direction.enum";
  import { Size } from "@21n/types/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import { fly } from "svelte/transition";
  import { toolbarState } from "@nucleum/extensions/clipper/contentScripts/store";
  let {
    onclick = undefined
  }: {
    onclick?: ((event: MouseEvent) => void) | undefined;
  } = $props();
  let isHovering = false;
  if ($toolbarState.position === undefined) {
    toolbarState.changePosition(Placement.Right);
  }
</script>

<div
  class={cn("fixed flex h-fit", {
    "inset-y-0 my-auto w-fit":
      $toolbarState.position === Placement.Right ||
      $toolbarState.position === Placement.Left,
    "right-0": $toolbarState.position === Placement.Right,
    "left-0": $toolbarState.position === Placement.Left,
    "inset-x-0 mx-auto bottom-0 w-52":
      $toolbarState.position === Placement.Bottom
  })}
>
  <button
    class={cn(
      "flex items-center gap-1 h-fit bg-bgs2 text-fgs1 border-y border-brs3 shadow-md px-1",
      {
        "w-fit":
          $toolbarState.position === Placement.Right ||
          $toolbarState.position === Placement.Left,
        "rounded-l-full border-l": $toolbarState.position === Placement.Right,
        "rounded-r-full border-r": $toolbarState.position === Placement.Left,
        "rounded-t-lg border-x w-full justify-center":
          $toolbarState.position === Placement.Bottom,
        "bg-bgs3": $toolbarState.position === Placement.Bottom && isHovering
      }
    )}
    {onclick}
    use:hoverable={{
      onHover: (isHoveringParam) => {
        isHovering = isHoveringParam;
      }
    }}
  >
    {#if $toolbarState.position === Placement.Right || $toolbarState.position === Placement.Bottom}
      <SubAtomLogo subatom="memotron" size={Size.sm} />
    {/if}
    {#if isHovering || $toolbarState.position === Placement.Bottom}
      <span
        in:fly={$toolbarState.position === Placement.Bottom
          ? { y: 50 }
          : $toolbarState.position === Placement.Right
            ? { x: 50 }
            : { x: -50 }}
        class="whitespace-nowrap"
      >
        {#if $toolbarState.position === Placement.Bottom && isHovering}
          Open toolbar
        {:else}
          Memotron clipper
        {/if}
      </span>
    {/if}
    {#if $toolbarState.position === Placement.Left}
      <SubAtomLogo subatom="memotron" size={Size.sm} />
    {/if}
  </button>
</div>
