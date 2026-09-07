<script lang="ts">
  import view from "@nucleum/stores/view.store";
  import { Size } from "@21n/types/size.enum";
  import {
    PanelSwitcherActiveItemStrength,
    PanelSwitcherStyle
  } from "@21n/types/switcher.enum";
  import { bg, cn } from "@21n/utils/ui.utils";
  import type { ISelectItem } from "@21n/types/select.type";
  import PanelSwitcherItemLabel from "@21n/elements/switcher/PanelSwitcherItemLabel.svelte";
  let {
    item,
    size = Size.md,
    isActive = false,
    isDisabled = false,
    parentBgIndex = 1,
    index = 0,
    activeItemStrength = PanelSwitcherActiveItemStrength.DEFAULT,
    onChange = undefined,
    onClick = undefined,
    onDebouncedChange = undefined,
    onRemove = undefined
  }: {
    item: ISelectItem;
    size?: Size.xs | Size.sm | Size.md | Size.lg;
    isActive?: boolean;
    isDisabled?: boolean;
    parentBgIndex?: number;
    index?: number;
    activeItemStrength?: PanelSwitcherActiveItemStrength;
    onChange?: ((event: CustomEvent<any>) => void) | undefined;
    onClick?: ((event: CustomEvent<any>) => void) | undefined;
    onDebouncedChange?: ((event: CustomEvent<any>) => void) | undefined;
    onRemove?: ((event: CustomEvent<any>) => void) | undefined;
  } = $props();

  const dev_isApplyBorderForDefaultActive = false;

  function emitClick() {
    const clickEvent = new CustomEvent<any>("click", { detail: item.value });
    onClick?.(clickEvent);
  }

  function emitRemove(detail: any) {
    const removeEvent = new CustomEvent<any>("remove", { detail });
    onRemove?.(removeEvent);
  }

  function emitChange(detail: any) {
    const changeEvent = new CustomEvent<any>("change", { detail });
    onChange?.(changeEvent);
  }

  function emitDebouncedChange(detail: any) {
    const debouncedChangeEvent = new CustomEvent<any>("debouncedChange", {
      detail
    });
    onDebouncedChange?.(debouncedChangeEvent);
  }
</script>

<button
  class={cn(
    "relative min-w-fit w-fit group",
    {
      "rounded-full px-6 py-2": size === Size.lg,
      "rounded-[5px] px-3 py-1 w-24": size === Size.md,
      "rounded-[5px] px-3 py-1 w-16": size === Size.sm,
      "bg-ccs3 text-ccs1":
        isActive &&
        activeItemStrength === PanelSwitcherActiveItemStrength.DEFAULT,
      "bg-bgs1 text-fgs1":
        isActive &&
        activeItemStrength === PanelSwitcherActiveItemStrength.SUBTLE,
      "bg-ccs1 text-abg":
        isActive &&
        activeItemStrength === PanelSwitcherActiveItemStrength.STRONG,
      [`hover:${bg(parentBgIndex + 1)}`]:
        !isActive &&
        activeItemStrength !== PanelSwitcherActiveItemStrength.SUBTLE
    },
    dev_isApplyBorderForDefaultActive &&
      activeItemStrength === PanelSwitcherActiveItemStrength.DEFAULT && {
        border: true,
        "border-transparent": !isActive,
        "border-ccs2": isActive
      }
  )}
  onclick={emitClick}
  disabled={isDisabled}
>
  <div
    class={cn("flex gap-1 justify-center items-center", {
      "text-base font-medium": size === Size.md && $view.isPortrait,
      "text-b3": size === Size.sm || size === Size.xs
    })}
  >
    <PanelSwitcherItemLabel
      {item}
      size={size === Size.lg ? Size.md : Size.sm}
      style={PanelSwitcherStyle.TRAIN}
      {isActive}
      {isDisabled}
      {parentBgIndex}
      {activeItemStrength}
      onRemove={(event) => emitRemove(event.detail)}
      onChange={(event) => emitChange(event.detail)}
      onDebouncedChange={(event) => emitDebouncedChange(event.detail)}
    />
  </div>
</button>
