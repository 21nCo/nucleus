<script lang="ts">
  import type { ISelectValue } from "@21n/elements/select/select.type";
  import type {
    DropdownGroup,
    DropdownItem
  } from "@21n/elements/dropdown/dropdownItem.type";
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/elements/size.enum";
  import FormLabelTooltip from "@21n/elements/text/formLabel/FormLabelTooltip.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import { isValidArrayWithData } from "@21n/shared-utils/obj.utils";
  import type { IPopoverOptions } from "@nucleum/actions/popover.type";
  import { InputStyle, type InputLabel } from "@21n/elements/input/input.type";
  import DropDownItemView from "@21n/elements/dropdown/DropDownItemView.svelte";
  import InputBaseElement from "@21n/elements/InputBaseElement.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import { Orientation, Placement } from "@21n/elements/direction.enum";
  import { properCase } from "@21n/shared-utils/text.utils";
  import AvatarRenderer from "@21n/elements/avatarPicker/AvatarRenderer.svelte";
  let {
    items,
    groups = [],
    value = $bindable<ISelectValue | undefined>(),
    parentBackgroundIndex = 1,
    label = undefined,
    style = InputStyle.BORDERED,
    isDisableSearch = false,
    size = Size.md,
    width = "w-80",
    popoverWidth = undefined,
    isEnforceWidth = false,
    isShowDividerForGroup = false,
    onSelect = undefined
  }: {
    items: DropdownItem[];
    groups?: DropdownGroup[];
    value?: string | number | boolean | undefined;
    parentBackgroundIndex?: number;
    label?: InputLabel | undefined;
    style?: InputStyle;
    isDisableSearch?: boolean;
    size?: Size.md | Size.sm;
    width?: string;
    popoverWidth?: string | undefined;
    isEnforceWidth?: boolean;
    isShowDividerForGroup?: boolean;
    onSelect?: ((event: CustomEvent<any>) => void) | undefined;
  } = $props();
  const isGrouped = $derived(groups.length > 0);
  let baseRef = $state<any>();
  let search = $state("");
  let searchInputRef = $state<any>();
  let isActive = $state(false);
  const popoverOptions = $derived<IPopoverOptions>({
    element: "div",
    class: "max-h-80 overflow-y-auto py-4",
    parentBgIndex: parentBackgroundIndex,
    isSpanToTriggerWidth: popoverWidth ? false : true,
    placement: Placement.BottomCenter
  });
  const normalizedItems = $derived.by(() => {
    if (!isGrouped) return items;
    return items.map((item) => ({
      ...item,
      groupId: item.groupId ?? "Nongroup"
    }));
  });
  const sortedGroups = $derived.by(() => {
    const nextGroups = [
      ...groups,
      ...(groups.find((group) => group.id === "Nongroup")
        ? []
        : [{ id: "Nongroup", label: "Nongroup", order: -1 }])
    ];
    return nextGroups.sort((a, b) => a.order - b.order);
  });
  const selected = $derived(
    normalizedItems.find((item) => item.value === value) ?? normalizedItems[0]
  );
  $effect(() => {
    if (value === undefined && normalizedItems[0]) {
      value = normalizedItems[0].value;
    }
  });
  function resolveItems(groupId: string, search: string) {
    return normalizedItems.filter(
      (x) =>
        ((isGrouped && x.groupId === groupId) || !isGrouped) &&
        ((!isDisableSearch &&
          search &&
          x.label?.toLowerCase().includes(search.toLowerCase())) ||
          !search ||
          isDisableSearch)
    );
  }

  function emitSelect(nextValue: ISelectValue) {
    const selectEvent = new CustomEvent<any>("select", {
      detail: nextValue
    });
    onSelect?.(selectEvent);
  }

  function onitemclick(item: DropdownItem) {
    if (item.isDisabled) return;
    value = item.value;
    emitSelect(item.value);
    setTimeout(() => {
      if (baseRef) baseRef.hidePopover();
    }, 100);
  }
</script>

<InputBaseElement
  {style}
  {label}
  {size}
  bind:isActive
  bind:this={baseRef}
  {popoverOptions}
  class={cn("flex justify-between gap-4 items-center", {
    "w-full": !label?.label && style !== InputStyle.PLAIN && !isEnforceWidth,
    [width]:
      isEnforceWidth ||
      (label?.label &&
        (label?.orientation === Orientation.Horizontal ||
          !label?.orientation ||
          (label?.orientation === Orientation.Vertical && label?.isShrink)))
  })}
>
  <div class="flex items-center gap-2">
    {#if selected?.icon && typeof selected?.icon === "string"}
      <Icon icon={selected.icon} size={Size.sm} />
    {:else if selected?.icon && typeof selected?.icon === "object"}
      <AvatarRenderer avatar={selected.icon} size={Size.sm} />
    {/if}
    <span class="min-w-fit">
      {selected?.label ?? properCase(selected?.value.toString())}
    </span>
  </div>
  <Icon icon={isActive ? "chevron-up" : "chevron-down"} size={Size.sm} />
  {#snippet popover()}
    <div class={cn("flex flex-col gap-2", popoverWidth)}>
      {#if !isDisableSearch}
        <div class="px-3 w-full">
          <TextInput
            bind:this={searchInputRef}
            bind:value={search}
            size={Size.sm}
            icon="search"
            placeholder="search"
          />
        </div>
      {/if}
      {#each sortedGroups as group, index}
        {#if isShowDividerForGroup && index > 0}
          <div class="w-full h-px bg-brs3"></div>
        {/if}
        <div class="flex flex-col w-full">
          {#if isGrouped && isValidArrayWithData(resolveItems(group.id, search))}
            <div class="flex gap-1 text-b3 text-fgs3 px-3 mb-1">
              {group.label === "Nongroup" ? "" : group.label}
              {#if group.info && group.info.body}
                <FormLabelTooltip info={group.info} />
              {/if}
            </div>
          {/if}
          {#each resolveItems(group.id, search) as item}
            <DropDownItemView {item} onclick={() => onitemclick(item)} />
          {/each}
        </div>
      {/each}
    </div>
  {/snippet}
</InputBaseElement>
