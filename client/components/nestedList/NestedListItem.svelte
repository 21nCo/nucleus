<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import view from "@nucleum/stores/view.store";
  import CustomColorPropagator from "@21n/elements/style/CustomColorPropagator.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import {
    NestedListStyle,
    type NestedItemContent
  } from "@nucleum/components/nestedList/nestedList.type";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import { InputStyle } from "@21n/types/input.type";
  import { isSameResource } from "@nucleum/datafn/resource.utils";
  import type { IRecordId } from "@21n/types/data.type";
  import { hoverable } from "@nucleum/actions/hover.action";
  import { tooltip } from "@nucleum/actions/popover.action";
  import NestedListItem from "@nucleum/components/nestedList/NestedListItem.svelte";
  let {
    id,
    index,
    totalLength,
    contentCallback,
    childrenCallback,
    nestingLevel = 0,
    style = NestedListStyle.DEFAULT,
    isExpandOnClickAnywhere = false,
    isShowAddTextInput = false,
    isActive = false,
    expandedItem = undefined,
    onAddSubAction = undefined,
    onClick = undefined,
    onExpand = undefined
  }: {
    id: string;
    index: number;
    totalLength: number;
    contentCallback: (id: string) => Promise<NestedItemContent>;
    childrenCallback: (id: string) => Promise<IRecordId[]>;
    nestingLevel?: number;
    style?: NestedListStyle;
    isExpandOnClickAnywhere?: boolean;
    isShowAddTextInput?: boolean;
    isActive?: boolean;
    expandedItem?: IRecordId | undefined;
    onAddSubAction?:
      | ((payload: {
          id: string;
          label: string;
          children: IRecordId[];
        }) => void)
      | undefined;
    onClick?:
      | ((payload: { id: string; event: MouseEvent }) => void)
      | undefined;
    onExpand?: ((id: IRecordId) => void) | undefined;
  } = $props();
  let addTextInputValue = $state("");
  let content = $state<NestedItemContent | undefined>(undefined);
  let children = $state<IRecordId[]>([]);
  let isCollapsed = $state(true);
  let isIconHovering = $state(false);

  $effect(() => {
    if (!id) return;
    contentCallback;
    childrenCallback;
    void refreshContentAndChildren(id);
  });

  async function refreshContentAndChildren(id: string) {
    content = await contentCallback(id);
    children = (await childrenCallback(id)) ?? [];
  }

  function onclick(e: MouseEvent) {
    if (isExpandOnClickAnywhere) {
      if (!$view.isPortrait) isCollapsed = !isCollapsed;
    }
    e.stopPropagation();
    onClick?.({
      id,
      event: e
    });
  }
  function onchevclick(e: MouseEvent) {
    isCollapsed = !isCollapsed;
    if (!isCollapsed) onExpand?.(id);
    e.stopPropagation();
  }
  function handleAddSub() {
    onAddSubAction?.({
      id,
      label: addTextInputValue,
      children
    });
    addTextInputValue = "";
    setTimeout(() => {
      refreshContentAndChildren(id);
    }, 500);
  }
</script>

{#if content}
  <button
    {onclick}
    class="relative flex flex-col w-full border border-transparent"
    data-id={id}
    data-index={index}
    draggable={true}
  >
    <CustomColorPropagator
      color={content.color}
      class={cn("flex gap-4 w-full p-3 justify-center mo:py-4", {
        "bg-ccs1": isActive,
        "notouch:hover:bg-bgs2 active:bg-bgs2": !isActive,
        "rounded-t-md": index === 0,
        "rounded-b-md": index === totalLength - 1
      })}
      style="padding-left: {nestingLevel ? nestingLevel * 2.5 : 0.8}rem"
    >
      <span
        class="flex items-center gap-2 text-left w-full min-w-0 flex-1"
        use:hoverable={{
          onHover: (val) => {
            isIconHovering = val;
          }
        }}
      >
        <span
          class={cn("flex items-center justify-center rounded-md p-1", {
            "hover:bg-bgs3": children?.length > 0
          })}
        >
          {#if content.icon && children?.length < 1}
            <Icon
              icon={content.icon}
              class={cn({
                "fill-ccs1": isActive,
                "stroke-fgs1": !isActive
              })}
              isFilled={content.isIconFilled ?? false}
            />
          {:else if children?.length > 0}
            <Icon
              icon={isCollapsed ? "chevron-right" : "chevron-down"}
              class={cn({
                "stroke-cbg": isActive,
                "stroke-fgs1": !isActive
              })}
              onclick={onchevclick}
            />
          {/if}
        </span>
        <span
          class="flex-1"
          use:tooltip={{
            isEnableOnlyOnTruncate: true
          }}
        >
          {content.label}
        </span>
      </span>
      <span class="shrink-0">
        {#if children.length > 0}
          <span class="text-b3 text-fgs2 bg-bgs2 rounded-md px-2 py-0.5">
            {children.length}
          </span>
        {/if}
      </span>
    </CustomColorPropagator>
    <div class="w-full">
      {#if children?.length > 0 && !isCollapsed && children}
        {#each children as child, childIndex}
          <NestedListItem
            id={child}
            index={childIndex}
            totalLength={children.length}
            {contentCallback}
            {childrenCallback}
            {style}
            {isExpandOnClickAnywhere}
            {isShowAddTextInput}
            {expandedItem}
            nestingLevel={nestingLevel + 1}
            {onClick}
            {onAddSubAction}
            {onExpand}
          />
        {/each}
      {/if}
    </div>
    {#if expandedItem && isSameResource(expandedItem, id) && !isCollapsed && isShowAddTextInput}
      <div
        class="flex w-full h-12"
        style="padding-left: {((nestingLevel ?? 0) + 1) * 2.5}rem"
      >
        <button
          class="px--4 py-3 w-full"
          onclick={(e) => {
            e.stopPropagation();
          }}
        >
          <TextInput
            bind:value={addTextInputValue}
            style={InputStyle.PLAIN}
            icon="plus"
            placeholder="Add new item"
            isShowSaveControl={addTextInputValue !== ""}
            onSave={handleAddSub}
            onEnter={handleAddSub}
          />
        </button>
      </div>
    {/if}
  </button>
{/if}
