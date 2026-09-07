<script lang="ts">
  import { Orientation, Placement } from "@21n/elements/direction.enum";
  import type { ISelectItem, ISelectValue } from "@21n/elements/select/select.type";
  import { Size } from "@21n/elements/size.enum";
  import { VerticalSwitcherStyle } from "@21n/elements/switcher/switcher.enum";
  import { cn } from "@21n/utils/ui.utils";
  import VerticalSwitcherItem from "@21n/elements/switcher/VerticalSwitcherItem.svelte";
  let {
    style = VerticalSwitcherStyle.BAR,
    labelOrientation = Orientation.Vertical,
    items,
    selected = $bindable(),
    isHideBar = false,
    parentBgIndex = 1,
    onSwitch,
    itemProps = {
      size: Size.md,
      activeStatusPlacement: Placement.Right
    }
  }: {
    style?: VerticalSwitcherStyle;
    labelOrientation?: Orientation;
    items: ISelectItem[];
    selected?: ISelectValue;
    isHideBar?: boolean;
    parentBgIndex?: number;
    onSwitch?: (selected: ISelectValue) => void;
    itemProps?: {
      size?: Size.sm | Size.md | Size.lg;
      activeStatusPlacement?: Placement;
      isHideLabel?: boolean;
    };
  } = $props();

  function switchToItem(value: ISelectValue) {
    selected = value;
    onSwitch?.(value);
  }
</script>

<aside
  class={cn("flex flex-col h-full w-full", {
    "items-start": itemProps.activeStatusPlacement === Placement.Left,
    "items-end": itemProps.activeStatusPlacement === Placement.Right,
    "gap-3":
      style === VerticalSwitcherStyle.DOT ||
      (labelOrientation === Orientation.Vertical &&
        style === VerticalSwitcherStyle.GRADIENT),
    "justify-center": labelOrientation === Orientation.Vertical
  })}
>
  {#each items as item (item.value)}
    <VerticalSwitcherItem
      {item}
      {parentBgIndex}
      {labelOrientation}
      {...itemProps}
      {style}
      {isHideBar}
      isActive={selected === item.value}
      onSelect={() => switchToItem(item.value)}
    />
  {/each}
</aside>
