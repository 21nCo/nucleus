<script lang="ts">
  import { Size } from "@21n/elements/size.enum";
  import { bg, cn } from "@21n/utils/ui.utils";
  import type {
    ISelectItem,
    ISelectValue
  } from "@21n/elements/select/select.type";
  import TrainPanelSwitcherItem from "@21n/elements/switcher/train/TrainPanelSwitcherItem.svelte";
  import { PanelSwitcherActiveItemStrength } from "@21n/elements/switcher/switcher.enum";
  let {
    items,
    value = $bindable(),
    size = Size.md,
    isDisableEnabled = false,
    parentBgIndex = 1,
    activeItemStrength = PanelSwitcherActiveItemStrength.DEFAULT,
    onSwitch = undefined
  }: {
    items: ISelectItem[];
    value?: ISelectValue | undefined;
    size?: Size.xs | Size.sm | Size.md | Size.lg;
    isDisableEnabled?: boolean;
    parentBgIndex?: number;
    activeItemStrength?: PanelSwitcherActiveItemStrength;
    onSwitch?: ((event: CustomEvent<ISelectValue>) => void) | undefined;
  } = $props();
  const effectiveParentBgIndex = $derived(
    activeItemStrength === PanelSwitcherActiveItemStrength.STRONG
      ? parentBgIndex
      : activeItemStrength === PanelSwitcherActiveItemStrength.SUBTLE
        ? parentBgIndex + 1
        : parentBgIndex - 1
  );

  function emitSwitch(nextValue: ISelectValue) {
    const switchEvent = new CustomEvent<ISelectValue>("switch", {
      detail: nextValue
    });
    onSwitch?.(switchEvent);
  }
</script>

<div
  class={cn(
    "relative panel-switcher flex items-center shrink-0 overflow-x-auto"
  )}
>
  <div
    class={cn("flex items-center min-w-fit", bg(effectiveParentBgIndex), {
      "border border-brs3 p-0.5":
        activeItemStrength !== PanelSwitcherActiveItemStrength.SUBTLE,
      "p-1": activeItemStrength === PanelSwitcherActiveItemStrength.SUBTLE,
      "rounded-full": size === Size.lg,
      "rounded-md": size !== Size.lg
    })}
  >
    {#each items as item, index (item.value)}
      <TrainPanelSwitcherItem
        {item}
        {size}
        parentBgIndex={effectiveParentBgIndex}
        {index}
        {activeItemStrength}
        isActive={value === item.value}
        isDisabled={isDisableEnabled && value !== item.value}
        onClick={() => {
          value = item.value;
          emitSwitch(item.value);
        }}
      />
    {/each}
  </div>
</div>
