<script lang="ts">
  import type { Snippet } from "svelte";
  import { Orientation } from "@21n/elements/direction.enum";
  import {
    InputStyle,
    type InputLabel,
    type PopoverInputOptions
  } from "@21n/elements/input/input.type";
  import { bg, cn } from "@21n/utils/ui.utils";
  import Popover from "@21n/elements/popover/Popover.svelte";
  import FormControlLabelWrapper from "@21n/elements/text/formLabel/FormControlLabelWrapper.svelte";
  import { Size } from "@21n/elements/size.enum";
  let {
    class: classList = "",
    style = InputStyle.BORDERED,
    size = Size.md,
    label = undefined,
    parentBgIndex = 1,
    isFocused = false,
    popoverOptions = undefined,
    isActive = $bindable(false),
    children = undefined,
    popover = undefined,
    onShow = undefined
  }: {
    class?: string;
    style?: InputStyle;
    size?: Size.md | Size.sm;
    label?: InputLabel | undefined;
    parentBgIndex?: number;
    isFocused?: boolean;
    popoverOptions?: PopoverInputOptions | undefined;
    isActive?: boolean;
    children?: Snippet | undefined;
    popover?: Snippet | undefined;
    onShow?: ((event: CustomEvent<void>) => void) | undefined;
  } = $props();
  let popoverRef: any;
  let isOptionsVisible = $state(false);

  $effect(() => {
    isActive = isFocused || isOptionsVisible;
  });

  export function showPopover() {
    if (popoverRef) popoverRef.show();
  }
  export function hidePopover() {
    if (popoverRef) popoverRef.hide();
  }

  function onPopoverShow() {
    const showEvent = new CustomEvent<void>("show");
    onShow?.(showEvent);
  }
</script>

<FormControlLabelWrapper props={label} {size}>
  <Popover
    bind:this={popoverRef}
    onShow={onPopoverShow}
    isPreventDefault={!popoverOptions || popoverOptions.isPreventDefault}
    options={popoverOptions}
    isPreventDefaultStyling={popoverOptions?.isPreventDefaultStyling}
    bind:isPopoverVisible={isOptionsVisible}
    {popover}
    triggerClass={cn("flex items-center gap-1 rounded-md", classList, {
      "w-full":
        (label?.orientation === Orientation.Vertical && !label?.isShrink) ||
        !label?.label,
      "p-2": style != InputStyle.PLAIN && size === Size.md,
      "px-1.5 py-1 text-b2": style != InputStyle.PLAIN && size === Size.sm,
      "border border-brs3": style === InputStyle.BORDERED && !isActive,
      "border border-aps1":
        isActive &&
        (style === InputStyle.BORDERED || style === InputStyle.FILLED),
      [bg(parentBgIndex)]: style === InputStyle.FILLED,
      "border border-bgs2 ": style === InputStyle.FILLED && !isActive
    })}
  >
    {@render children?.()}
  </Popover>
</FormControlLabelWrapper>
