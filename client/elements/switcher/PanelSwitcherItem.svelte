<script lang="ts">
  import view from "@nucleum/stores/view.store";
  import { Size } from "@21n/types/size.enum";
  import {
    BarStyle,
    PanelSwitcherStyle,
    type PanelSwitcherEditModeOptions
  } from "@21n/types/switcher.enum";
  import { bg, cn } from "@21n/utils/ui.utils";
  import type { ISelectItem } from "@21n/types/select.type";
  import PanelSwitcherItemLabel from "@21n/elements/switcher/PanelSwitcherItemLabel.svelte";
  import { rearrangeOnAxis } from "@nucleum/actions/rearrange.action";
  import { scrollIntoViewOnFocus } from "@nucleum/actions/scroll.action";
  let {
    item,
    size = Size.md,
    isActive = false,
    isDisabled = false,
    style,
    isInEditMode = false,
    barStyle = BarStyle.EXACT,
    editModeOptions = undefined,
    triggerItemEdit = $bindable(null),
    isInversePlacement = false,
    parentBgIndex = 1,
    isRearrangeableByDefault = false,
    onAdd = undefined,
    onChange = undefined,
    onClick = undefined,
    onDebouncedChange = undefined,
    onRearrange = undefined,
    onRearranged = undefined,
    onRemove = undefined
  }: {
    item: ISelectItem;
    size?: Size.xs | Size.sm | Size.md | Size.lg;
    isActive?: boolean;
    isDisabled?: boolean;
    style: PanelSwitcherStyle;
    isInEditMode?: boolean;
    barStyle?: BarStyle;
    editModeOptions?: PanelSwitcherEditModeOptions | undefined;
    triggerItemEdit?: string | null;
    isInversePlacement?: boolean;
    parentBgIndex?: number;
    isRearrangeableByDefault?: boolean;
    onAdd?: ((event: CustomEvent<void>) => void) | undefined;
    onChange?: ((event: CustomEvent<any>) => void) | undefined;
    onClick?: ((event: CustomEvent<any>) => void) | undefined;
    onDebouncedChange?: ((event: CustomEvent<any>) => void) | undefined;
    onRearrange?: ((event: CustomEvent<number>) => void) | undefined;
    onRearranged?: ((event: CustomEvent<number>) => void) | undefined;
    onRemove?: ((event: CustomEvent<any>) => void) | undefined;
  } = $props();

  function emitAdd() {
    const addEvent = new CustomEvent<void>("add");
    onAdd?.(addEvent);
  }

  function emitClick() {
    const clickEvent = new CustomEvent<any>("click", { detail: item.value });
    onClick?.(clickEvent);
  }

  function emitRearrange(displacement: number) {
    const rearrangeEvent = new CustomEvent<number>("rearrange", {
      detail: displacement
    });
    onRearrange?.(rearrangeEvent);
  }

  function emitRearranged(displacement: number) {
    const rearrangedEvent = new CustomEvent<number>("rearranged", {
      detail: displacement
    });
    onRearranged?.(rearrangedEvent);
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

  function handleClick() {
    if (item.value === "$add") {
      emitAdd();
    } else {
      emitClick();
    }
  }

  function handleRearrange(displacement: number) {
    emitRearrange(displacement);
  }

  function handleRearranged(displacement: number) {
    emitRearranged(displacement);
  }
</script>
{#if style === PanelSwitcherStyle.BAR}
  <button
    role="tab"
    aria-selected={isActive}
    class={cn("relative group flex bg-transparent h-full", {
      "px-4":
        (size === Size.md || size === Size.lg) &&
        barStyle === BarStyle.OVERFLOW &&
        !item.icon,
      "px-4 ":
        size === Size.sm || (barStyle !== BarStyle.OVERFLOW && !item.icon),
      "px-5": size !== Size.sm && item.icon,
      "px-3": size === Size.xs,
      "py-2": barStyle != BarStyle.EXACT,
      "border-b-2": barStyle === BarStyle.OVERFLOW,
      "border-ccs1": isActive && barStyle === BarStyle.OVERFLOW,
      "border-transparent": !isActive && barStyle === BarStyle.OVERFLOW
    })}
    onclick={handleClick}
    disabled={isDisabled}
    use:scrollIntoViewOnFocus
    use:rearrangeOnAxis={{
      enabled: isInEditMode || isRearrangeableByDefault,
      onRearrange: handleRearrange,
      onRearranged: handleRearranged,
      threshold: 30
    }}
  >
    <div
      class={cn("flex items-center min-w-fit", {
        "text-base":
          (size === Size.md && $view.isPortrait) ||
          (size === Size.md && !$view.isPortrait),
        "text-b2": (size === Size.sm && $view.isPortrait) || size === Size.xs,
        "text-h4": size === Size.lg,
        "text-fgs3": !isActive,
        "text-ccs1": isActive && !isInEditMode,
        "h-full": barStyle === BarStyle.EXACT,
        "border-b-2 pt-1": barStyle === BarStyle.EXACT && !isInversePlacement,
        "border-t-2": barStyle === BarStyle.EXACT && isInversePlacement,
        "border-ccs1": isActive && barStyle === BarStyle.EXACT,
        "border-transparent": !isActive && barStyle === BarStyle.EXACT
      })}
    >
      <PanelSwitcherItemLabel
        {item}
        {isInEditMode}
        {editModeOptions}
        {size}
        {style}
        {isActive}
        {isDisabled}
        {parentBgIndex}
        bind:triggerItemEdit
        onRemove={(event) => emitRemove(event.detail)}
        onChange={(event) => emitChange(event.detail)}
        onDebouncedChange={(event) => emitDebouncedChange(event.detail)}
      />
    </div>
    {#if isActive && (barStyle === BarStyle.UNDER || barStyle === BarStyle.DOT)}
      <div
        class={cn("absolute", {
          "bottom-1 bg-ccs1 left-1/2 w-1 h-1 rounded-full":
            barStyle === BarStyle.DOT,
          "bottom-0 border-b-2 border-ccs1 left-1/3 w-1/3":
            barStyle === BarStyle.UNDER
        })}
      ></div>
    {/if}
  </button>
{:else if style === PanelSwitcherStyle.SNAKE}
  <button
    role="tab"
    aria-selected={isActive}
    class={cn("relative group flex items-center gap-1 py-2", {
      "px-6": item.icon,
      "px-4": !item.icon,
      "border border-brs3 rounded-t-md text-fgs1": isActive,
      "border-ccs1- text-ccs1": isActive && !isInEditMode,
      "border border-transparent text-fgs3": !isActive
    })}
    disabled={isDisabled}
    onclick={handleClick}
    use:rearrangeOnAxis={{
      enabled: isInEditMode,
      onRearrange: handleRearrange,
      onRearranged: handleRearranged,
      threshold: 30
    }}
  >
    <PanelSwitcherItemLabel
      {item}
      {isInEditMode}
      {editModeOptions}
      {size}
      {style}
      {isActive}
      {isDisabled}
      {parentBgIndex}
      bind:triggerItemEdit
      onRemove={(event) => emitRemove(event.detail)}
      onChange={(event) => emitChange(event.detail)}
      onDebouncedChange={(event) => emitDebouncedChange(event.detail)}
    />
    {#if isActive}
      <div
        class={cn(
          "absolute h-2 w-full -bottom-1 left-0",
          bg(parentBgIndex - 1)
        )}
      ></div>
    {/if}
  </button>
{/if}
