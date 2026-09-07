<script lang="ts">
  import {
    PanelSwitcherActiveItemStrength,
    PanelSwitcherStyle,
    type PanelSwitcherEditModeOptions
  } from "@21n/types/switcher.enum";
  import Icon from "@21n/elements/Icon.svelte";
  import Button from "@21n/elements/button/Button.svelte";
  import { Size } from "@21n/types/size.enum";
  import type { ISelectItem } from "@21n/types/select.type";
  import Popover from "@21n/elements/popover/Popover.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import AddNewButton from "@21n/elements/button/AddNewButton.svelte";
  import { tooltip } from "@nucleum/actions/popover.action";
  import { isValidString } from "@21n/shared-utils/text.utils";
  import Badge from "@21n/elements/text/Badge.svelte";
  let {
    item,
    isInEditMode = false,
    isDisabled = false,
    size = Size.md,
    style = PanelSwitcherStyle.BAR,
    editModeOptions = undefined,
    isActive = false,
    triggerItemEdit = $bindable(null),
    parentBgIndex = 1,
    activeItemStrength = PanelSwitcherActiveItemStrength.DEFAULT,
    onChange = undefined,
    onDebouncedChange = undefined,
    onRemove = undefined
  }: {
    item: ISelectItem;
    isInEditMode?: boolean;
    isDisabled?: boolean;
    size?: Size.xs | Size.sm | Size.md | Size.lg;
    style?: PanelSwitcherStyle;
    editModeOptions?: PanelSwitcherEditModeOptions | undefined;
    isActive?: boolean;
    triggerItemEdit?: string | null;
    parentBgIndex?: number;
    activeItemStrength?: PanelSwitcherActiveItemStrength;
    onChange?: ((event: CustomEvent<any>) => void) | undefined;
    onDebouncedChange?: ((event: CustomEvent<any>) => void) | undefined;
    onRemove?: ((event: CustomEvent<any>) => void) | undefined;
  } = $props();
  const isAddNewItem = $derived(item.value === "$add");
  let labelEditPopoverRef = $state<any>();
  let inputRef = $state<any>();
  let editableLabel = $state("");

  function emitChange() {
    onChange?.(
      new CustomEvent<any>("change", {
        detail: { ...item, label: editableLabel }
      })
    );
  }

  function emitDebouncedChange() {
    onDebouncedChange?.(
      new CustomEvent<any>("debouncedChange", {
        detail: { ...item, label: editableLabel }
      })
    );
  }

  function emitRemove() {
    onRemove?.(new CustomEvent<any>("remove", { detail: item.value }));
  }

  $effect(() => {
    editableLabel = item.label ?? "";
  });

  $effect(() => {
    if (triggerItemEdit && triggerItemEdit === item.value.toString()) {
      setTimeout(() => {
        labelEditPopoverRef?.show();
        inputRef?.focus();
      }, 100);
    } else if (
      triggerItemEdit &&
      triggerItemEdit !== item.value.toString()
    ) {
      labelEditPopoverRef?.hide();
    }
  });
</script>

{#if isAddNewItem}
  <AddNewButton {size} text={item.label} />
{:else if isInEditMode}
  <span class="flex gap-2 items-center">
    <Icon icon="rearrange" class="text-fgs2" {size} />
    <Popover
      bind:this={labelEditPopoverRef}
      isPreventDefault={!isActive}
      onHide={() => {
        if (triggerItemEdit) triggerItemEdit = null;
      }}
    >
      <button
        class="flex items-center max-w-36 whitespace-nowrap"
        ondblclick={() => {
          labelEditPopoverRef.toggle();
        }}
      >
        <div
          class="truncate"
          use:tooltip={{
            text: item.label,
            isEnableOnlyOnTruncate: true
          }}
        >
          {isValidString(item.label) ? item.label : "Untitled"}
        </div>
      </button>
      {#snippet popover()}
        <button
          class="w-60 h-20 p-4"
          onclick={(event) => event.stopPropagation()}
        >
          <TextInput
            bind:this={inputRef}
            bind:value={editableLabel}
            placeholder="Label"
            onInput={() => emitChange()}
            onDebouncedChange={() => emitDebouncedChange()}
          />
        </button>
      {/snippet}
    </Popover>
    <span class="ml-4">
      <Button
        icon="cross"
        size={Size.sm}
        tooltip={editModeOptions?.removeTooltip ?? "Remove"}
        onclick={(event) => {
          emitRemove();
          event.stopPropagation();
        }}
      />
    </span>
  </span>
{:else}
  <span
    class={cn("flex gap-2 items-center min-w-fit whitespace-nowrap", {
      "text-bgs4": isDisabled
    })}
  >
    {#if item.icon && typeof item.icon === "string"}
      <Icon
        icon={item.icon}
        {size}
        isFilled={isActive}
        class={cn(
          "transition-colors",
          {
            "text-ccs1": isActive && style !== PanelSwitcherStyle.TRAIN
          },
          style === PanelSwitcherStyle.TRAIN &&
            !isActive && {
              "group-hover:text-fgs1":
                activeItemStrength !== PanelSwitcherActiveItemStrength.STRONG,
              "text-fgs2":
                activeItemStrength === PanelSwitcherActiveItemStrength.DEFAULT,
              "text-fgs3":
                activeItemStrength === PanelSwitcherActiveItemStrength.SUBTLE
            },
          style === PanelSwitcherStyle.TRAIN &&
            isActive && {
              "text-cbg":
                activeItemStrength === PanelSwitcherActiveItemStrength.STRONG,
              "text-ccs1":
                activeItemStrength === PanelSwitcherActiveItemStrength.DEFAULT
            }
        )}
      />
    {/if}
    <div
      class={cn(
        "flex items-center max-w-36",
        !isActive && {
          "group-hover:text-fgs2":
            style === PanelSwitcherStyle.BAR ||
            style === PanelSwitcherStyle.SNAKE
        },
        !isActive &&
          style === PanelSwitcherStyle.TRAIN && {
            "group-hover:text-fgs1":
              activeItemStrength !== PanelSwitcherActiveItemStrength.STRONG,
            "text-fgs2":
              activeItemStrength === PanelSwitcherActiveItemStrength.DEFAULT,
            "text-fgs3":
              activeItemStrength === PanelSwitcherActiveItemStrength.SUBTLE
          }
      )}
    >
      <span
        class="truncate"
        use:tooltip={{
          text: item.label,
          isEnableOnlyOnTruncate: true
        }}
      >
        {isValidString(item.label) ? item.label : "Untitled"}
      </span>
      {#if item.badge}
        <span class="ml-2">
          <Badge
            {size}
            text={item.badge}
            isApplyCustomColor={isActive}
            {parentBgIndex}
          />
        </span>
      {/if}
    </div>
  </span>
{/if}
