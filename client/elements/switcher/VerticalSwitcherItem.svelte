<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import { Orientation, Placement } from "@21n/types/direction.enum";
  import { Size } from "@21n/types/size.enum";
  import { VerticalSwitcherStyle } from "@21n/types/switcher.enum";
  import { properCase } from "@21n/shared-utils/text.utils";
  import { bg, cn } from "@21n/utils/ui.utils";
  import type { ISelectItem } from "@21n/types/select.type";
  import Badge from "@21n/elements/text/Badge.svelte";
  import { hoverable } from "@nucleum/actions/hover.action";
  import { tooltip } from "@nucleum/actions/popover.action";
  let {
    item,
    style = VerticalSwitcherStyle.BAR,
    labelOrientation = Orientation.Vertical,
    activeStatusPlacement = Placement.Left,
    isHideLabel = false,
    size = Size.md,
    isActive = false,
    isHideBar = false,
    parentBgIndex = 1,
    onSelect
  }: {
    item: ISelectItem;
    style?: VerticalSwitcherStyle;
    labelOrientation?: Orientation;
    activeStatusPlacement?: Placement;
    isHideLabel?: boolean;
    size?: Size.xs | Size.sm | Size.md | Size.lg;
    isActive?: boolean;
    isHideBar?: boolean;
    parentBgIndex?: number;
    onSelect?: () => void;
  } = $props();
  let isHovered = $state(false);
  const commonVerticalLabelOptions = $derived({
    tooltip: isHideLabel
      ? properCase(item.label ?? item.value?.toString())
      : undefined,
    tooltipOptions: {
      placement: Placement.Left
    }
  });
  const activeClasses = $derived.by(() => {
    if (
      style === VerticalSwitcherStyle.GRADIENT &&
      activeStatusPlacement === Placement.Left
    ) {
      return "border-l--2 border-l-bgs2 bg-gradient-to-l from-transparent to-aps3";
    }
    if (
      style === VerticalSwitcherStyle.GRADIENT &&
      activeStatusPlacement === Placement.Right
    ) {
      return "border-r--2 border-r-bgs2 bg-gradient-to-r from-transparent to-aps3";
    }
    if (
      style === VerticalSwitcherStyle.BAR_V2 &&
      activeStatusPlacement === Placement.Right
    ) {
      return "border-r-4 border-rounded-md";
    }
    if (
      style === VerticalSwitcherStyle.BAR_V2 &&
      activeStatusPlacement === Placement.Left
    ) {
      return "border-l-4 border-rounded-md";
    }
    return undefined;
  });
  const inactiveClasses = $derived.by(() => {
    if (
      style === VerticalSwitcherStyle.GRADIENT &&
      activeStatusPlacement === Placement.Left
    ) {
      return "border-l--2 border-l-bgs2 text-fgs3 hover:bg-gradient-to-l from-transparent to-bgs3";
    }
    if (
      style === VerticalSwitcherStyle.GRADIENT &&
      activeStatusPlacement === Placement.Right
    ) {
      return "border-r--2 border-r-bgs2 text-fgs3 hover:bg-gradient-to-r from-transparent to-bgs3";
    }
    if (
      style === VerticalSwitcherStyle.BAR_V2 &&
      activeStatusPlacement === Placement.Right
    ) {
      return "border-r-4 border-r-bgs1 text-fgs3";
    }
    if (
      style === VerticalSwitcherStyle.BAR_V2 &&
      activeStatusPlacement === Placement.Left
    ) {
      return "border-l-4 border-l-bgs1 text-fgs3";
    }
    return undefined;
  });
  const sizeClasses = $derived.by(() => {
    if (size === Size.xs) {
      return "text-b5 w-12 gap-1 py-3";
    }
    if (size === Size.sm) {
      return `text-b4 gap-1 py-4 ${isHideLabel ? "px-2" : "w-14"}`;
    }
    if (size === Size.md) {
      return `text-b2 gap-2 py-4 ${isHideLabel ? "px-3" : "w-24"}`;
    }
    if (size === Size.lg) {
      return "text-base w-24 gap-2 px-4 py-6";
    }
    return "";
  });
  const tooltipOptions = $derived({
    text: commonVerticalLabelOptions.tooltip,
    direction:
      commonVerticalLabelOptions.tooltipOptions?.placement ?? Placement.Left
  });
  const hoverOptions = {
    onHover: (isHoveredParam: boolean) => {
      isHovered = isHoveredParam;
    }
  };
</script>

{#if style === VerticalSwitcherStyle.BAR && labelOrientation === Orientation.Vertical}
  <button
    type="button"
    class={cn("relative flex flex-col items-center", sizeClasses, {
      "border-ccs1 border-rounded-md": isActive,
      "text-fgs3": !isActive,
      "border-l-bgs2": !isActive && activeStatusPlacement === Placement.Left,
      "border-r-bgs2": !isActive && activeStatusPlacement === Placement.Right,
      "border-l-4": !isHideBar && activeStatusPlacement === Placement.Left,
      "border-r-4": !isHideBar && activeStatusPlacement === Placement.Right
    })}
    use:tooltip={tooltipOptions}
    use:hoverable={hoverOptions}
    onclick={onSelect}
  >
    {#if item.icon && typeof item.icon === "string"}
      <Icon
        icon={item.icon}
        {size}
        isFilled={isActive}
        class={cn({
          "fill-fgs1": isActive,
          "stroke-fgs3": !isActive
        })}
      />
    {/if}
    {#if !isHideLabel}
      <span class="w-min whitespace-nowrap {isActive ? 'font-medium' : ''}"
        >{properCase(item?.label ?? item?.value?.toString())}</span
      >
    {/if}
  </button>
{:else if style === VerticalSwitcherStyle.DOT && labelOrientation === Orientation.Vertical}
  <button
    type="button"
    class={cn("relative flex flex-col items-center", sizeClasses)}
    use:tooltip={tooltipOptions}
    use:hoverable={hoverOptions}
    onclick={onSelect}
  >
    {#if item.icon && typeof item.icon === "string"}
      <Icon
        icon={item.icon}
        {size}
        isFilled={isActive || isHovered}
        class={cn({
          "fill-aps1": isActive,
          "stroke-fgs3": !isActive
        })}
      />
    {/if}
    {#if !isHideLabel}
      <span
        class={cn("w-min whitespace-nowrap", {
          "text-aps1 font-medium": isActive
        })}>{properCase(item?.label ?? item?.value?.toString())}</span
      >
    {/if}
    {#if isActive}
      <div class="absolute bottom-1 left-0 flex justify-center w-full">
        <span class="h-1 w-1 bg-aps1 rounded-full" />
      </div>
    {/if}
    {#if item.badge}
      <div class="absolute bottom-2 right-1">
        <Badge text={item.badge} size={Size.sm} />
      </div>
    {/if}
  </button>
{:else if labelOrientation === Orientation.Vertical}
  <div
    class={cn({
      "border-l-2 border-l-bgs3":
        style === VerticalSwitcherStyle.BAR_V2 &&
        activeStatusPlacement === Placement.Left,
      "border-r-2 border-r-bgs3":
        style === VerticalSwitcherStyle.BAR_V2 &&
        activeStatusPlacement === Placement.Right
    })}
  >
    <button
      type="button"
      class={cn(
        "relative flex items-center",
        sizeClasses,
        activeClasses && isActive && activeClasses,
        inactiveClasses && !isActive && inactiveClasses,
        {
          "flex-col": labelOrientation === Orientation.Vertical,
          "border-ccs1 text-ccs1": isActive,
          "bg-aps1": style === VerticalSwitcherStyle.BG && isActive
        }
      )}
      use:tooltip={tooltipOptions}
      use:hoverable={hoverOptions}
      onclick={onSelect}
    >
      {#if item.icon && typeof item.icon === "string"}
        <Icon
          icon={item.icon}
          {size}
          isFilled={isActive || isHovered}
          class={cn({
            "fill-aps1": isActive,
            "stroke-fgs3": !isActive
          })}
        />
      {/if}
      {#if !isHideLabel}
        <span class="w-min whitespace-nowrap {isActive ? 'font-medium' : ''}"
          >{properCase(item?.label ?? item?.value?.toString())}</span
        >
      {/if}
      {#if item.badge}
        <div class="absolute bottom-2 right-1">
          <Badge text={item.badge} size={Size.sm} />
        </div>
      {/if}
    </button>
  </div>
{:else if style === VerticalSwitcherStyle.BG && labelOrientation === Orientation.Horizontal}
  <button
    type="button"
    class={cn("relative flex gap-2 items-center rounded-md p-2 px-2 w-full", {
      [bg(parentBgIndex)]: isActive || isHovered,
      "text-fgs3": !isActive
    })}
    use:tooltip={tooltipOptions}
    use:hoverable={hoverOptions}
    onclick={onSelect}
  >
    {#if item.icon && typeof item.icon === "string"}
      <Icon
        icon={item.icon}
        {size}
        isFilled={isActive}
        class={cn({
          "fill-fgs1": isActive,
          "stroke-fgs3": !isActive
        })}
      />
    {/if}
    <span class="w-min whitespace-nowrap {isActive ? 'font-medium' : ''}"
      >{properCase(item?.label ?? item?.value?.toString())}</span
    >
  </button>
{/if}
