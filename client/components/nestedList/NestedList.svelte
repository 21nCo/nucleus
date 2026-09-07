<script lang="ts">
  import Divider from "@21n/elements/Divider.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import type { IRecordId } from "@21n/types/data.type";
  import { InputStyle } from "@21n/types/input.type";
  import { cn } from "@21n/utils/ui.utils";
  import { isValidArrayWithData } from "@21n/shared-utils/obj.utils";
  import { NestedListStyle, type NestedItemContent } from "@nucleum/components/nestedList/nestedList.type";
  import NestedListItem from "@nucleum/components/nestedList/NestedListItem.svelte";
  let {
    items = [],
    contentCallback,
    childrenCallback,
    style = NestedListStyle.DEFAULT,
    isExpandOnClickAnywhere = false,
    isShowAddTextInput = false,
    addPlaceholder = "Add new item",
    onAddAction = undefined,
    onAddSub = undefined,
    onClick = undefined
  }: {
    items?: string[];
    contentCallback: (id: string) => Promise<NestedItemContent>;
    childrenCallback: (id: string) => Promise<IRecordId[]>;
    style?: NestedListStyle;
    isExpandOnClickAnywhere?: boolean;
    isShowAddTextInput?: boolean;
    addPlaceholder?: string;
    onAddAction?: ((payload: { label: string }) => void) | undefined;
    onAddSub?:
      | ((payload: {
          id: string;
          label: string;
          children: IRecordId[];
        }) => void)
      | undefined;
    onClick?:
      | ((payload: {
          id: string;
          event: MouseEvent;
        }) => void)
      | undefined;
  } = $props();
  let addTextInputValue = $state("");
  let expandedItem = $state<IRecordId | undefined>(undefined);

  function handleAdd() {
    onAddAction?.({
      label: addTextInputValue
    });
    addTextInputValue = "";
  }
</script>

{#if isValidArrayWithData(items) || isShowAddTextInput}
  <div
    class={cn("flex flex-col w-full h-full", {
      "border border-brs3 rounded-md": style === NestedListStyle.OUTLINED
    })}
  >
    {#if isValidArrayWithData(items)}
      {#each items as item, index (item)}
        <NestedListItem
          id={item}
          {index}
          totalLength={items.length}
          {style}
          {contentCallback}
          {childrenCallback}
          {isExpandOnClickAnywhere}
          {isShowAddTextInput}
          {expandedItem}
          {onClick}
          onAddSubAction={onAddSub}
          onExpand={(id) => {
            if (id) expandedItem = id;
          }}
        />
        {#if style === NestedListStyle.OUTLINED && index !== items.length - 1}
          <Divider />
        {/if}
      {/each}
    {/if}
    {#if isShowAddTextInput}
      <div class="flex p-3">
        <TextInput
          bind:value={addTextInputValue}
          style={InputStyle.PLAIN}
          icon="plus"
          placeholder={addPlaceholder}
          isShowSaveControl={addTextInputValue !== ""}
          onSave={handleAdd}
          onCancel={() => (addTextInputValue = "")}
          onEnter={handleAdd}
        />
      </div>
    {/if}
  </div>
{/if}
