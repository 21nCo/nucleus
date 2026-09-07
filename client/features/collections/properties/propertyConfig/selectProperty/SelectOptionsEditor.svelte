<script lang="ts">
  import {
    reorderList,
    type DragDropEvent
  } from "@nucleum/actions/rearrange.action";
  import { logger } from "@nucleum/components/debug/logger.client";
  import Icon from "@21n/elements/Icon.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import Badge from "@21n/elements/text/Badge.svelte";
  import InlineErrorMessage from "@21n/elements/text/InlineErrorMessage.svelte";
  import Text from "@21n/elements/text/Text.svelte";
  import SwitchInput from "@21n/elements/toggle/SwitchInput.svelte";
  import { Size } from "@21n/types/size.enum";
  import { TextStyle } from "@21n/types/text.enum";
  import { isTextElement } from "@21n/utils/browser.utils";
  import { cn } from "@21n/utils/ui.utils";
  import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";
  import { isValidArrayWithData } from "@21n/shared-utils/obj.utils";
  import { isValidString } from "@21n/shared-utils/text.utils";
  import type {
    ISelectPropertyConfig,
    IPropertyConfigOption,
    IPropertyConfigOptionGroup
  } from "@nucleum/features/collections/properties/property.type";
  import SelectOptionEditListView from "@nucleum/features/collections/properties/propertyConfig/selectProperty/SelectOptionEditListView.svelte";
  import { onMount } from "svelte";
  const resolveEmptyConfig = (): ISelectPropertyConfig => ({
    options: [],
    groups: []
  });
  let {
    config = $bindable(resolveEmptyConfig()),
    defaultOptionId = $bindable(null),
    parentBgIndex = 1,
    onChange = undefined,
    onDefault = undefined,
    isPopoverContext = false
  }: {
    config?: ISelectPropertyConfig;
    defaultOptionId?: string | null;
    parentBgIndex?: number;
    onChange?: ((config: ISelectPropertyConfig) => void) | undefined;
    onDefault?: ((defaultOptionId: string | null) => void) | undefined;
    isPopoverContext?: boolean;
  } = $props();
  let isGrouping = $state(false);
  let focusedOptionId = $state<string | null>(null);
  let dev_isEnableGrouping = false;
  let error = $state<string | null>(null);
  let isCreatedUsingGlobalEnterKey = false;
  let newLabel = $state("");
  let refreshGroupsId = $state(new Date().getTime());
  function onremove(e: CustomEvent<string>) {
    const id = e.detail;
    config.options = config.options?.filter((option) => option.id !== id);
    focusedOptionId = null;
    propagateChange();
  }
  function ondefault(e: CustomEvent<string | null>) {
    defaultOptionId = e.detail;
    onDefault?.(e.detail);
  }
  function onenter(e: CustomEvent<string>) {
    if (!e.detail) return;
    const option = config.options?.find((option) => option.id === e.detail);
    const index = config.options?.findIndex((option) => option.id === e.detail);
    if (!option) return;
    addGroupOption(option.groupId, index);
  }
  function propagateChange() {
    onChange?.(config);
  }
  function onOptionChange(
    e: CustomEvent<Partial<IPropertyConfigOption> & { id: string }>
  ) {
    config.options = (config.options ?? []).map((option) =>
      option.id === e.detail.id ? { ...option, ...e.detail } : option
    );
    config = config;
    propagateChange();
  }
  function onReorderOptions(e: DragDropEvent) {
    const { listId, toGroupId, fromId, toId } = e;
    if (!listId || listId !== "options") return;
    const fromIndex = config.options?.findIndex((o) => o.id === fromId) ?? -1;
    const toIndex = config.options?.findIndex((o) => o.id === toId) ?? -1;
    if (fromIndex !== -1 && toIndex !== -1) {
      const [movedItem] = config.options?.splice(fromIndex, 1) ?? [];
      if (
        toGroupId &&
        toGroupId !== "ungrouped" &&
        movedItem.groupId !== toGroupId
      ) {
        movedItem.groupId = toGroupId;
      } else if (toGroupId === "ungrouped") {
        movedItem.groupId = undefined;
      }
      config.options?.splice(toIndex, 0, movedItem);
    }
    config = config;
    propagateChange();
  }

  onMount(() => {
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  });

  function handleKeyDown(e: KeyboardEvent) {
    const isTextInputSource = isTextElement(e.target);
    if (e.key === "Enter" && !isTextInputSource) {
      e.stopPropagation();
      addOption();
      isCreatedUsingGlobalEnterKey = true;
      setTimeout(() => {
        isCreatedUsingGlobalEnterKey = false;
      }, 1000);
    }
  }

  function addOption() {
    if (!config.options || !newLabel) return;
    let label: string = newLabel;
    let groupId: string | undefined = undefined;
    if (newLabel.includes(":")) {
      const group = newLabel.split(":")[0];
      label = newLabel.split(":")[1];
      if (isValidString(group)) {
        const existingGroup = config.groups?.find(
          (g) => g.label.toLowerCase() === group.toLowerCase()
        );
        if (!existingGroup) {
          const newGroupId = generateSimpleRandomId();
          config.groups = [
            ...(config.groups ?? []),
            { id: newGroupId, label: group }
          ];
          groupId = newGroupId;
        } else {
          groupId = existingGroup.id;
        }
      }
    }
    const newOption: IPropertyConfigOption = {
      label: label,
      id: generateSimpleRandomId(),
      groupId,
      color: Math.random() * 360
    };
    config.options = [newOption, ...config.options];
    propagateChange();
    newLabel = "";
  }

  function handleAddOptionFromGroup(e: CustomEvent<string | undefined>) {
    let group: IPropertyConfigOptionGroup | undefined = undefined;
    if (e.detail) {
      group = config.groups?.find((g) => g.id === e.detail);
    }
    addGroupOption(group?.id);
  }

  function addGroupOption(groupId: string | undefined, atIndex?: number) {
    logger.debug({ at: "addGroupOption", groupId, atIndex });
    const newOption: IPropertyConfigOption = {
      label: "",
      id: generateSimpleRandomId(),
      groupId,
      color: Math.random() * 360
    };
    if (atIndex !== undefined) {
      config.options?.splice(atIndex + 1, 0, newOption);
    } else {
      config.options = [...(config.options ?? []), newOption];
    }
    config = config;
    focusedOptionId = newOption.id;
    propagateChange();
  }

  function onGroupAction(e: CustomEvent<{ action: string; groupId: string }>) {
    const { action, groupId } = e.detail;
    if (action === "delete") {
      config.groups = config.groups?.filter((g) => g.id !== groupId);
      config.options = config.options?.filter((o) => o.groupId !== groupId);
    } else if (action === "up") {
      const groupIndex = config.groups?.findIndex((g) => g.id === groupId);
      if (groupIndex !== undefined && groupIndex > 0) {
        const [movedItem] = config.groups?.splice(groupIndex, 1) ?? [];
        config.groups?.splice(groupIndex - 1, 0, movedItem);
      }
      refreshGroupsId = new Date().getTime();
    } else if (action === "down") {
      const groupIndex = config.groups?.findIndex((g) => g.id === groupId);
      if (
        groupIndex !== undefined &&
        groupIndex < (config.groups?.length ?? 0) - 1
      ) {
        const [movedItem] = config.groups?.splice(groupIndex, 1) ?? [];
        config.groups?.splice(groupIndex + 1, 0, movedItem);
      }
      refreshGroupsId = new Date().getTime();
    }
    propagateChange();
  }
</script>

<div
  class={cn("flex flex-col", {
    "min-w-80 w-80 min-h-80 max-h-[60vh] bg-bgs1 border border-brs2 rounded-md":
      isPopoverContext,
    "w-full h-full": !isPopoverContext
  })}
>
  <span class="flex items-center gap-1 px-3 py-2">
    <Text content="Edit options" style={TextStyle.SECTION_HEADING} />
    <Badge text={config.options?.length ?? 0} />
  </span>
  {#if dev_isEnableGrouping}
    <span class="flex justify-between w-full p-3 border-b border-b-brs2">
      <Text content="Options" style={TextStyle.SECTION_HEADING} />
      <SwitchInput
        bind:checked={isGrouping}
        label={{ label: "Grouping" }}
        size={Size.sm}
      />
    </span>
  {/if}
  <div class="flex px-3 py-2">
    <TextInput
      bind:value={newLabel}
      hasControls={true}
      onEnter={addOption}
      onSave={addOption}
      onCancel={() => {
        newLabel = "";
      }}
      placeholder="Add option or group:option"
      isShowSaveControl={newLabel !== ""}
    />
  </div>
  <div
    class="flex flex-col gap-6 flex-grow p-3"
    use:reorderList={{
      listId: "options",
      dragImage: "dragimage",
      draggedOverClass: "outline outline-aps1",
      onDrop: onReorderOptions
    }}
  >
    {#key refreshGroupsId}
      {#if config.groups && isValidArrayWithData(config.groups)}
        {#each config.groups as group}
          <SelectOptionEditListView
            options={config.options ?? []}
            {group}
            {focusedOptionId}
            {defaultOptionId}
            {parentBgIndex}
            onEnter={onenter}
            onDefault={ondefault}
            onRemove={onremove}
            onAdd={handleAddOptionFromGroup}
            onGroup={onGroupAction}
            onOptionChange={onOptionChange}
            onChange={() => {
              propagateChange();
            }}
          />
        {/each}
      {/if}
    {/key}
    <SelectOptionEditListView
      options={config.options ?? []}
      {focusedOptionId}
      {defaultOptionId}
      {parentBgIndex}
      isPreventDefaultGroupLabel={!config.groups || config.groups.length === 0}
      onEnter={onenter}
      onDefault={ondefault}
      onRemove={onremove}
      onAdd={handleAddOptionFromGroup}
      onOptionChange={onOptionChange}
      onChange={() => {
        propagateChange();
      }}
    />
  </div>
  <div
    class={cn({
      "py-2": error
    })}
  >
    <InlineErrorMessage bind:error />
  </div>
</div>
