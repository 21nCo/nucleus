<script lang="ts" module>
  let panelSwitcherCounter = 0;

  export const resolvePanelSwitcherId = () => {
    panelSwitcherCounter += 1;
    return `panel-switcher-${panelSwitcherCounter}`;
  };
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import {
    BarStyle,
    PanelSwitcherActiveItemStrength,
    PanelSwitcherStyle
  } from "@21n/types/switcher.enum";
  import { onMount } from "svelte";
  import PanelSwitcherItem from "@21n/elements/switcher/PanelSwitcherItem.svelte";
  import { Size } from "@21n/types/size.enum";
  import { bg, cn, emptyTranstition } from "@21n/utils/ui.utils";
  import type {
    ISelectItem,
    ISelectValue
  } from "@21n/types/select.type";
  import { fly } from "svelte/transition";
  import { moveItemInArray } from "@21n/shared-utils/obj.utils";
  import view from "@nucleum/stores/view.store";
  import DropDown from "@21n/elements/dropdown/DropDown.svelte";
  import { InputStyle } from "@21n/types/input.type";
  import { isTextElement } from "@21n/utils/browser.utils";
  import Icon from "@21n/elements/Icon.svelte";
  import TrainPanelSwitcher from "@21n/elements/switcher/train/TrainPanelSwitcher.svelte";
  import { KeyboardKey } from "@21n/types/keyboard.type";
  import { logger } from "@nucleum/client/runtime/logging/logger";

  const PANEL_SWITCHER_ATTR = "data-panel-switcher-id";
  let {
    items,
    value = $bindable(),
    isDisableEnabled = false,
    parentBgIndex = 1,
    isInEditMode = false,
    size = Size.md,
    style,
    isExpandToFullWidth = false,
    isEnableAnimationForTitle = false,
    title = "",
    barStyle = BarStyle.EXACT,
    activeItemStrength = PanelSwitcherActiveItemStrength.DEFAULT,
    isInversePlacement = false,
    triggerItemEdit = $bindable(null),
    addText = undefined,
    isRenderDropdownForCW = false,
    isBgBar = false,
    isRearrangeableByDefault = false,
    isEnableTitleAction = false,
    isPreventTabShortcut = false,
    tempTitleWithActionDisabled = false,
    left = undefined,
    right = undefined,
    onAdd = undefined,
    onChange = undefined,
    onDebouncedChange = undefined,
    onRearrange = undefined,
    onRemove = undefined,
    onSwitch = undefined
  }: {
    items: ISelectItem[] | string[];
    value?: ISelectValue | undefined;
    isDisableEnabled?: boolean;
    parentBgIndex?: number;
    isInEditMode?: boolean;
    size?: Size.xs | Size.sm | Size.md | Size.lg;
    style: PanelSwitcherStyle;
    isExpandToFullWidth?: boolean;
    isEnableAnimationForTitle?: boolean;
    title?: string;
    barStyle?: BarStyle;
    activeItemStrength?: PanelSwitcherActiveItemStrength;
    isInversePlacement?: boolean;
    triggerItemEdit?: string | null;
    addText?: string | undefined;
    isRenderDropdownForCW?: boolean;
    isBgBar?: boolean;
    isRearrangeableByDefault?: boolean;
    isEnableTitleAction?: boolean;
    isPreventTabShortcut?: boolean;
    tempTitleWithActionDisabled?: boolean;
    left?: Snippet | undefined;
    right?: Snippet | undefined;
    onAdd?: ((event: CustomEvent<void>) => void) | undefined;
    onChange?: ((event: CustomEvent<any>) => void) | undefined;
    onDebouncedChange?: ((event: CustomEvent<any>) => void) | undefined;
    onRearrange?: ((event: CustomEvent<any>) => void) | undefined;
    onRemove?: ((event: CustomEvent<any>) => void) | undefined;
    onSwitch?: ((event: CustomEvent<any>) => void) | undefined;
  } = $props();

  let _items = $state<ISelectItem[]>([]);
  const titleValue = "$title";
  const switcherId = resolvePanelSwitcherId();
  function emitSwitch(nextValue: ISelectValue) {
    const switchEvent = new CustomEvent<ISelectValue>("switch", {
      detail: nextValue
    });
    onSwitch?.(switchEvent);
  }

  function emitAdd() {
    const addEvent = new CustomEvent<void>("add");
    onAdd?.(addEvent);
  }

  function emitChange(detail: any) {
    if (detail?.value !== undefined && typeof detail?.label === "string") {
      _items = _items.map((item) =>
        item.value === detail.value ? { ...item, label: detail.label } : item
      );
    }
    const changeEvent = new CustomEvent<any>("change", { detail });
    onChange?.(changeEvent);
  }

  function emitDebouncedChange(detail: any) {
    if (detail?.value !== undefined && typeof detail?.label === "string") {
      _items = _items.map((item) =>
        item.value === detail.value ? { ...item, label: detail.label } : item
      );
    }
    const debouncedChangeEvent = new CustomEvent<any>("debouncedChange", {
      detail
    });
    onDebouncedChange?.(debouncedChangeEvent);
  }

  function emitRemove(detail: any) {
    const removeEvent = new CustomEvent<any>("remove", { detail });
    onRemove?.(removeEvent);
  }

  function emitRearrange(detail: any) {
    const rearrangeEvent = new CustomEvent<any>("rearrange", { detail });
    onRearrange?.(rearrangeEvent);
  }

  function dispatchSwitch(nextValue: ISelectValue) {
    value = nextValue;
    emitSwitch(nextValue);
  }
  $effect(() => {
    _items = items.every((item) => typeof item === "string")
      ? items.map((item) => ({ label: item, value: item }))
      : [...items];
  });
  const isRenderAsDropdown = $derived(
    $view.isConstrainedWidth && isRenderDropdownForCW
  );
  onMount(() => {
    parent?.setAttribute(PANEL_SWITCHER_ATTR, switcherId);
    if (
      value === undefined ||
      items.find((x) =>
        typeof x === "string" ? x === value : x.value === value
      ) === undefined
    )
      value = _items[0]?.value;
  });

  let parent = $state<any>();
  let child = $state<any>();
  function conditionalTransition(node: any) {
    if (isEnableAnimationForTitle) {
      return fly(node, { y: -100, duration: 300 });
    }
    return emptyTranstition();
  }

  const isTopmostPanelSwitcher = () => {
    if (typeof document === "undefined") return false;
    if (!parent || !parent.isConnected) return false;
    const switchers = Array.from(
      document.querySelectorAll(`[${PANEL_SWITCHER_ATTR}]`)
    ).filter(
      (element): element is HTMLElement => element instanceof HTMLElement
    );
    const visibleSwitchers = switchers.filter((element) => {
      if (!element.isConnected) return false;
      const style = getComputedStyle(element);
      if (style.display === "none" || style.visibility === "hidden")
        return false;
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    if (!visibleSwitchers.length) return false;
    return visibleSwitchers[visibleSwitchers.length - 1] === parent;
  };
</script>

{#if style === PanelSwitcherStyle.TRAIN && !isRenderAsDropdown}
  <TrainPanelSwitcher
    items={_items}
    bind:value
    {size}
    {isDisableEnabled}
    {parentBgIndex}
    {activeItemStrength}
    onSwitch={(event) => emitSwitch(event.detail)}
  />
{:else if isRenderAsDropdown}
  <div class="flex">
    <DropDown
      items={_items}
      bind:value
      style={InputStyle.PLAIN}
      width="min-w-32"
      popoverWidth="min-w-fit"
      isDisableSearch={true}
      isEnforceWidth={true}
      onSelect={(e) => emitSwitch(e.detail)}
    />
  </div>
{:else}
  {#key isInEditMode}
    <div
      bind:this={parent}
      class={cn(
        "relative panel-switcher flex items-center shrink-0",
        style === PanelSwitcherStyle.SNAKE && {
          "border-b border-brs3": isExpandToFullWidth && !isBgBar,
          "inline-block": !isExpandToFullWidth
        },
        style === PanelSwitcherStyle.BAR && {
          "overflow-x-auto": !isRenderAsDropdown,
          "h-12": !isExpandToFullWidth,
          "border-b border-brs3":
            barStyle !== BarStyle.UNDER &&
            barStyle !== BarStyle.DOT &&
            isExpandToFullWidth &&
            !isBgBar
        },
        isExpandToFullWidth && {
          "w-full justify-between": true,
          "h-12 px-1": !isEnableTitleAction,
          "h-[3.2rem] 2k:h-14": isEnableTitleAction
        }
      )}
    >
      {#if title || left}
        {@const isEnableTitleActionResolved =
          isEnableTitleAction && !tempTitleWithActionDisabled}
        <div class="flex mo:mr-3 h-full" transition:conditionalTransition>
          {#if left}
            {@render left?.()}
          {:else}
            <button
              class={cn(
                "flex items-center gap-2",
                {
                  "cursor-default text-h4 text-fgs2 px-3 py-0.5":
                    !isEnableTitleActionResolved,
                  "text-h5 px-8 border-r border-brs3":
                    isEnableTitleActionResolved
                },
                isEnableTitleActionResolved && {
                  "text-aps1 bg-aps3": value === titleValue,
                  [`text-fgs2 hover:${bg(parentBgIndex)}`]:
                    value !== titleValue
                }
              )}
              onclick={() => {
                if (isEnableTitleActionResolved) {
                  dispatchSwitch(titleValue);
                }
              }}
            >
              {#if isEnableTitleActionResolved}
                <Icon
                  icon="home"
                  class={cn({
                    "text-aps1": value === titleValue
                  })}
                  size={Size.sm}
                />
              {/if}
              {title}
            </button>
          {/if}
        </div>
      {/if}
      <div
        bind:this={child}
        role="tablist"
        class={cn("flex items-center", bg(parentBgIndex - 1), {
          "h-full": style === PanelSwitcherStyle.BAR,
          "overflow-x-auto mr-auto": isExpandToFullWidth,
          "min-w-fit": !isExpandToFullWidth,
          "border-b border-brs3":
            ((style === PanelSwitcherStyle.BAR &&
              barStyle !== BarStyle.UNDER &&
              barStyle !== BarStyle.DOT) ||
              style === PanelSwitcherStyle.SNAKE) &&
            !isExpandToFullWidth &&
            !isInversePlacement
        })}
      >
        {#each _items as item, index (item.value)}
          <PanelSwitcherItem
            {item}
            {size}
            {style}
            isInEditMode={_items.length > 1 && isInEditMode}
            {barStyle}
            {isInversePlacement}
            {parentBgIndex}
            {isRearrangeableByDefault}
            bind:triggerItemEdit
            isActive={value === item.value}
            isDisabled={isDisableEnabled && value !== item.value}
            onClick={() => {
              dispatchSwitch(item.value);
            }}
            onRearrange={(e) => {
              _items = moveItemInArray(_items, index, e.detail > 0 ? 1 : -1);
            }}
            onRearranged={() => {
              emitRearrange(_items.map((x) => x.value));
            }}
            onChange={(e) => emitChange(e.detail)}
            onDebouncedChange={(e) => emitDebouncedChange(e.detail)}
            onRemove={(e) => emitRemove(e.detail)}
          />
        {/each}
        {#if isInEditMode && !$view.isConstrainedWidth}
          <PanelSwitcherItem
            item={{ label: addText ?? "Add", value: "$add" }}
            {size}
            {style}
            isInEditMode={true}
            {barStyle}
            {isInversePlacement}
            {parentBgIndex}
            bind:triggerItemEdit
            onAdd={() => emitAdd()}
          />
        {/if}
      </div>
      {#if right}
        <span class="ml-4">
          {@render right?.()}
        </span>
      {/if}
    </div>
  {/key}
{/if}

<svelte:document
  onkeydown={(event) => {
    try {
      const isBackwardKey = event.key === KeyboardKey.ARROW_LEFT;
      const isForwardKey = event.key === KeyboardKey.ARROW_RIGHT;
      if (isPreventTabShortcut || (!isBackwardKey && !isForwardKey)) return;
      if (!isTopmostPanelSwitcher() || isTextElement(event.target)) return;
      const isBackward = isBackwardKey;
      event.preventDefault();
      event.stopPropagation();

      const isTitleActive = isEnableTitleAction && value === titleValue;
      if (isBackward) {
        if (isTitleActive) {
          const previous = _items[_items.length - 1]?.value;
          if (previous) dispatchSwitch(previous);
          return;
        }
        const currentIndex = _items.findIndex((item) => item.value === value);
        if (currentIndex === -1) {
          const fallback = _items[_items.length - 1]?.value;
          if (fallback) dispatchSwitch(fallback);
          return;
        }
        if (currentIndex === 0) {
          if (isEnableTitleAction) {
            dispatchSwitch(titleValue);
            return;
          }
          const previous = _items[_items.length - 1]?.value;
          if (previous) dispatchSwitch(previous);
          return;
        }
        const previous = _items[currentIndex - 1]?.value;
        if (previous) dispatchSwitch(previous);
        return;
      }

      if (isTitleActive) {
        const next = _items[0]?.value;
        if (next) dispatchSwitch(next);
        return;
      }

      const currentIndex = _items.findIndex((item) => item.value === value);
      if (currentIndex === -1 || currentIndex + 1 >= _items.length) {
        if (isEnableTitleAction) {
          dispatchSwitch(titleValue);
          return;
        }
        const next = _items[0]?.value;
        if (next) dispatchSwitch(next);
        return;
      }

      const next = _items[currentIndex + 1]?.value;
      if (next) dispatchSwitch(next);
    } catch (error) {
      logger.error({ at: "PanelSwitcher - number shortcut listener", error });
    }
  }}
/>
