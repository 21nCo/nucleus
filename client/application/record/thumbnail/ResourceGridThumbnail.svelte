<script lang="ts">
  import type { Snippet } from "svelte";
  import { Size } from "@21n/types/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  let {
    item,
    size = Size.md,
    isApplyCustomColor = false,
    isMasonry = false,
    isHidePreview = false,
    children,
    bottom,
    onclick = undefined
  }: {
    item: any;
    size?: Size.sm | Size.md;
    isApplyCustomColor?: boolean;
    isMasonry?: boolean;
    isHidePreview?: boolean;
    children?: Snippet;
    bottom?: Snippet;
    onclick?: ((event: MouseEvent) => void) | undefined;
  } = $props();
</script>

<button
  class={cn("relative flex flex-col w-full rounded-md", {
    "h-full": isMasonry,
    border: !isMasonry && !isHidePreview,
    "h-44": size === Size.sm,
    "h-[15.2rem] w--[17.5rem]": size === Size.md && !isHidePreview,
    "border-ccs4 notouch:hover:border-ccs1 active:border-ccs1":
      isApplyCustomColor,
    "border-brs2 notouch:hover:border-brs4 active:border-brs4":
      !isApplyCustomColor && !isHidePreview
  })}
  {onclick}
>
  {@render children?.()}
  {#if !isMasonry}
    <div
      class={cn(
        "flex flex-col h-fit gap-1.5 w-full items-start px-3 py-2 truncate",
        {
          "border-t rounded-b-md": !isHidePreview,
          "border rounded-md": isHidePreview,
          "bg-ccs4 border-ccs2": isApplyCustomColor,
          "bg-bgs2 border-brs2": !isApplyCustomColor
        }
      )}
    >
      {@render bottom?.()}
    </div>
  {/if}
</button>
