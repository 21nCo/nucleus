<script lang="ts">
  import type { Snippet } from "svelte";
  import { Orientation } from "@21n/elements/direction.enum";
  import { InputStyle, type InputLabel } from "@21n/elements/input/input.type";
  import { bg, cn } from "@21n/utils/ui.utils";
  import FormControlLabelWrapper from "@21n/elements/text/formLabel/FormControlLabelWrapper.svelte";
  import { Size } from "@21n/elements/size.enum";
  let {
    style = InputStyle.BORDERED,
    size = Size.md,
    label = undefined,
    isFocused = false,
    parentBgIndex = 1,
    class: classList = "",
    children = undefined
  }: {
    style?: InputStyle;
    size?: Size.md | Size.sm;
    label?: InputLabel | undefined;
    isFocused?: boolean;
    parentBgIndex?: number;
    class?: string;
    children?: Snippet | undefined;
  } = $props();
</script>

<FormControlLabelWrapper props={label} {size}>
  <div
    class={cn("flex items-center gap-1 rounded-md", classList, {
      "w-full":
        (label?.orientation === Orientation.Vertical && !label?.isShrink) ||
        !label?.label,
      "text-b2": style != InputStyle.PLAIN && size === Size.sm,
      "border border-brs3": style === InputStyle.BORDERED && !isFocused,
      "border border-aps1":
        isFocused &&
        (style === InputStyle.BORDERED || style === InputStyle.FILLED),
      [bg(parentBgIndex)]: style === InputStyle.FILLED,
      "border border-bgs2 ": style === InputStyle.FILLED && !isFocused
    })}
  >
    {@render children?.()}
  </div>
</FormControlLabelWrapper>
