<script lang="ts">
  import { Size } from "@21n/elements/size.enum";
  import { tweened } from "svelte/motion";
  import { linear } from "svelte/easing";
  /**
   * @param duration - The duration of the progress bar animation in seconds
   * @param percentage - Static percentage value (0-1 range, e.g., 0.5 = 50%)
   */
  let {
    duration = 0,
    percentage = undefined,
    size = Size.md,
    label = "",
    showPercentage = false,
  }: {
    duration?: number;
    percentage?: number | undefined;
    size?: Size;
    label?: string;
    showPercentage?: boolean;
  } = $props();

  
  
  
  
  const progress = tweened(0, {
    duration: duration * 1000,
    easing: linear
  });
  const sizeClasses = $derived.by(() => {
    switch (size) {
      case Size.xxs:
      case Size.xs:
      case Size.sm:
        return "h-1";
      case Size.md:
        return "h-2";
      case Size.lg:
      case Size.xl:
      case Size.xxl:
        return "h-3";
    }
  });

  $effect(() => {
    if (percentage !== undefined) {
      progress.set(percentage * 100, {
        duration: duration * 1000,
        easing: linear
      });
    } else if (duration > 0) {
      progress.set(100, {
        duration: duration * 1000,
        easing: linear
      });
    }
  });
</script>

{#if label}
  <p class="text-b3 fgs2 mb-1">{label}</p>
{/if}
<div class="relative w-full rounded-full overflow-hidden {sizeClasses} bg-bgs2">
  <!-- <Element isAction={false} classList="absolute w-full h-full bg-bgs4" /> -->
  <!-- <div class="absolute bg-bgs3 w-full h-full" /> -->
  {#if showPercentage}
    <p
      class="absolute inset-0 flex items-center justify-center text-b3 text-abg z-10"
    >
      {Math.round($progress)}%
    </p>
  {/if}
  <div
    class="absolute left-0 top-0 h-full bg-aps1 rounded-full"
    style="width: {$progress}%"
  ></div>
</div>
