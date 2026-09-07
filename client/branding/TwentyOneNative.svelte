<script lang="ts">
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  let {
    size = Size.md,
    isColored = true
  }: {
    size?: Size;
    isColored?: boolean;
  } = $props();
</script>

<span
  class={cn("climate-crisis", {
    "text-b2": size === Size.sm,
    "text-base": size === Size.md,
    "text-h3": size === Size.lg,
    "text-h1": size === Size.xl,
    "text-[#FE6D73]": isColored
  })}>21N</span
>

<style>
  .climate-crisis {
    font-family: "Climate Crisis", sans-serif;
    font-optical-sizing: auto;
    font-weight: 400;
    font-style: normal;
    font-variation-settings: "YEAR" 2025;
  }
</style>
