<script lang="ts">
  import type { Snippet } from "svelte";
  import RefreshingOverlayFeedback from "@21n/elements/feedback/RefreshingOverlayFeedback.svelte";
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import { spring } from "svelte/motion";
  import ScrollViewBottomSpacer from "@21n/layout/scrollView/ScrollViewBottomSpacer.svelte";
  let {
    children,
    isRefreshOnPull = false,
    bottomSpacerSize = Size.md,
    isEnableScrollbar = false,
    isRefreshing = false,
    class: classList = "",
    onRefresh = undefined
  }: {
    children?: Snippet;
    isRefreshOnPull?: boolean;
    bottomSpacerSize?: Size.sm | Size.md | Size.lg;
    isEnableScrollbar?: boolean;
    isRefreshing?: boolean;
    class?: string | object;
    onRefresh?: () => void | Promise<void>;
  } = $props();

  let container: HTMLDivElement;
  let innerContainer: HTMLDivElement;
  let initialY: any;
  let currentY: any;
  const threshold = 50;

  const pullDistance = spring(0, {
    stiffness: 0.1,
    damping: 0.2
  });

  function onTouchStart(event: TouchEvent) {
    if (!isRefreshOnPull) return;
    initialY = event.touches[0].clientY;
  }

  function onTouchMove(event: TouchEvent) {
    if (!isRefreshOnPull) return;
    currentY = event.touches[0].clientY;
    let diff = currentY - initialY;
    if (innerContainer.scrollTop === 0 && diff > 0 && !isRefreshing) {
      // event.preventDefault();
      pullDistance.set(Math.min(diff * 0.5, threshold));
    } else {
      pullDistance.set(0);
    }
  }

  function onTouchEnd() {
    if (!isRefreshOnPull) return;
    if ($pullDistance >= threshold) {
      refresh();
    } else {
      pullDistance.set(0);
    }
  }

  async function refresh() {
    pullDistance.set(threshold);
    await onRefresh?.();
    // await new Promise((resolve) => setTimeout(resolve, 2000));
    // pullDistance.set(0);
  }
</script>

<!-- TODO - add pull refresh Gesture and refactor existing scroll views in Pointron: Analytics, Quick focus, Logs pane, goals layout - Memotron: Nodes list -->
<div
  class="relative flex flex-col flex-grow w-full"
  bind:this={container}
  ontouchstart={onTouchStart}
  ontouchmove={onTouchMove}
  ontouchend={onTouchEnd}
>
  {#if isRefreshing}
    <RefreshingOverlayFeedback />
  {/if}
  <!-- <div
    class="absolute top-0 left-0 right-0 bg-bgs2 flex items-center justify-center text-gray-500 pointer-events-none z-50"
    style="transform: translateY({$pullDistance}px)"
  >
    {#if isRefreshing}
      Refreshing...
    {:else if $pullDistance > 0}
      Pull to refresh {Math.round(($pullDistance / threshold) * 100)}%
    {/if}
  </div> -->
  <!-- <div
    class="w-full flex justify-center bg-bgs2"
    style="height: {$pullDistance}px;"
  >
    ↺
  </div> -->
  <div
    bind:this={innerContainer}
    class={cn(classList, {
      "styledscroll pr-1.5": isEnableScrollbar,
      "no-scrollbar": !isEnableScrollbar
    })}
  >
    {@render children?.()}
    <ScrollViewBottomSpacer size={bottomSpacerSize} />
  </div>
</div>
