<script lang="ts">
  import { cn } from "@21n/utils/ui.utils";
  import type { Snippet } from "svelte";
  import { quintOut } from "svelte/easing";
  import { fly } from "svelte/transition";
  let {
    index = 0,
    isActive = false,
    isSearchAction = false,
    children,
    onclick = void 0
  }: {
    index?: number;
    isActive?: boolean;
    isSearchAction?: boolean;
    children?: Snippet;
    onclick?: (event: MouseEvent) => void;
  } = $props();
  let ref = $state<HTMLElement | undefined>();
  $effect(() => {
    if (isActive && ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  });
</script>

<button
  bind:this={ref}
  onclick={(event) => onclick?.(event)}
  class={cn("w-full flex items-center px-3 py-2 truncate border-l-[3px]", {
    "bg-bgs2 border-fgs1": isActive,
    "hover:bg-bgs2-striped border-transparent text-fgs2": !isActive,
    "h-12": !isSearchAction
  })}
  in:fly={{
    duration: 500,
    delay: index * 1.2 * 50,
    easing: quintOut,
    x: 0,
    y: index * 0.2 * 50,
    opacity: 0
  }}
>
  {@render children?.()}
</button>
