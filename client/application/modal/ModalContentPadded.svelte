<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "@21n/utils/ui.utils";
  let {
    isExtraSmall = false,
    isDynamicSize = false,
    class: classList = "",
    children = undefined
  }: {
    isExtraSmall?: boolean;
    isDynamicSize?: boolean;
    class?: string;
    children?: Snippet | undefined;
  } = $props();
</script>

<div
  class={cn(classList, {
    "p-2 lg:p-4": isExtraSmall,
    "px-3 tp:px-8 lg:px-12": !isExtraSmall,
    "w-full h-full": !isDynamicSize
  })}
>
  {@render children?.()}
</div>
