<script lang="ts">
  import { Size } from "@21n/elements/size.enum";
  import { abg, bg, cn } from "@21n/utils/ui.utils";
  let {
    size = Size.md,
    text,
    parentBgIndex = 1,
    isApplyCustomColor = false,
    isAccentColor = false
  }: {
    size?: Size;
    text: string | number;
    parentBgIndex?: number;
    isApplyCustomColor?: boolean;
    isAccentColor?: boolean;
  } = $props();

  const isGeneric = $derived(
    typeof text === "string" &&
    !["new", "soon", "planned", "beta", "trial"].includes(text.toLowerCase())
  );
</script>

{#if typeof text === "number"}
  <div
    class={cn("flex justify-center items-center rounded-full w-fit border", {
      "px-1": text > 9,
      "bg-css2 border-ccs2": isApplyCustomColor,
      [abg()]: isAccentColor,
      "border-transparent": isAccentColor,
      [bg(parentBgIndex)]: !isApplyCustomColor && !isAccentColor,
      "border-brs3": !isApplyCustomColor && !isAccentColor,
      "min-w-5 min-h-5 w-5 h-5 text-b3": size === Size.md,
      "min-w-4 min-h-4 w-4 h-4 text-b4": size === Size.sm,
      "min-w-3.5 min-h-3.5 w-3.5 h-3.5 text-b4": size === Size.xs
    })}
  >
    {text}
  </div>
{:else}
  <div
    class={cn("flex justify-center items-center min-w-fit rounded-md", {
      "bg-aps3 text-aps1 border border-aps2": ["new", "trial"].includes(
        text.toLowerCase()
      ),
      "bg-ass3 text-ass1 border border-ass1": ["beta"].includes(
        text.toLowerCase()
      ),
      "bg-ags3 text-ags1 border border-ags1": ["soon", "planned"].includes(
        text.toLowerCase()
      ),
      "border border-brs3": isGeneric,
      "text-fgs2": isGeneric && !isAccentColor && !isApplyCustomColor,
      "text-cbg border-cbg": isGeneric && (isAccentColor || isApplyCustomColor),
      "px-1.5 py-0.25 text-b4": size === Size.md,
      "px-1 py-0.25 text-b5": size === Size.sm
    })}
  >
    {text}
  </div>
{/if}
