<script lang="ts">
  import type { IPropertyConfigOption } from "@nucleum/features/collections/properties/property.type";
  import SelectOptionEditItemView from "@nucleum/features/collections/properties/propertyConfig/selectProperty/SelectOptionEditItemView.svelte";
  import type { IPropertyConfigOptionGroup } from "@nucleum/features/collections/properties/property.type";
  import Button from "@21n/elements/button/Button.svelte";
  import { Size } from "@21n/types/size.enum";
  import { ButtonStyle, ButtonVariant } from "@21n/types/button.type";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  let {
    options,
    group = undefined,
    focusedOptionId = null,
    defaultOptionId = null,
    isPreventDefaultGroupLabel = false,
    parentBgIndex = 1,
    onAdd = undefined,
    onGroup = undefined,
    onRemove = undefined,
    onDefault = undefined,
    onEnter = undefined,
    onOptionChange = undefined,
    onChange = undefined
  }: {
    options: IPropertyConfigOption[];
    group?: IPropertyConfigOptionGroup | undefined;
    focusedOptionId?: string | null;
    defaultOptionId?: string | null;
    isPreventDefaultGroupLabel?: boolean;
    parentBgIndex?: number;
    onAdd?: ((event: CustomEvent<string | undefined>) => void) | undefined;
    onGroup?:
      | ((event: CustomEvent<{ action: string; groupId: string }>) => void)
      | undefined;
    onRemove?: ((event: CustomEvent<string>) => void) | undefined;
    onDefault?: ((event: CustomEvent<string | null>) => void) | undefined;
    onEnter?: ((event: CustomEvent<string>) => void) | undefined;
    onOptionChange?:
      | ((event: CustomEvent<Partial<IPropertyConfigOption> & { id: string }>) => void)
      | undefined;
    onChange?: ((event?: CustomEvent<void>) => void) | undefined;
  } = $props();
  let isEditingGroupLabel = $state(false);
  let groupLabelInput = $state("");
  let _options = $derived(filterOptions(options, group));

  function filterOptions(
    options: IPropertyConfigOption[],
    group: IPropertyConfigOptionGroup | undefined
  ) {
    if (group) {
      return options?.filter((x) => x.groupId === group.id) ?? [];
    } else {
      return options?.filter((x) => !x.groupId) ?? [];
    }
  }

  function addOption() {
    const event = new CustomEvent<string | undefined>("add", {
      detail: group?.id
    });
    onAdd?.(event);
  }
</script>

<div class="flex flex-col gap-2">
  <div class="flex justify-between items-center pl-2">
    {#if isEditingGroupLabel}
      <TextInput
        bind:value={groupLabelInput}
        isShowSaveControl={true}
        placeholder="Group name"
        onSave={() => {
          if (!groupLabelInput) return;
          if (group) group.label = groupLabelInput;
          isEditingGroupLabel = false;
          onChange?.();
        }}
        onCancel={() => {
          isEditingGroupLabel = false;
        }}
      />
    {:else if !isPreventDefaultGroupLabel}
      <button
        class="text-b2 text-fgs3 text-left"
        data-popover-id="select-options-popover"
        onclick={() => {
          if (!group) return;
          isEditingGroupLabel = true;
          groupLabelInput = group.label;
        }}
      >
        {group?.label ?? "Ungrouped"}
      </button>
    {/if}
    {#if group}
      <span class="flex items-center">
        {#if !isEditingGroupLabel}
          <Button
            icon="edit"
            tooltip="Edit group label"
            size={Size.sm}
            onclick={() => {
              isEditingGroupLabel = true;
              groupLabelInput = group.label;
            }}
          />
        {/if}
          <Button
            icon="ph:arrow-up"
            style={ButtonStyle.PLAIN}
            tooltip="Move this group up"
            size={Size.sm}
            onclick={() => {
              onGroup?.(
                new CustomEvent("group", {
                  detail: {
                    action: "up",
                    groupId: group.id
                  }
                })
              );
            }}
          />
        <Button
          icon="arrow-down"
          style={ButtonStyle.PLAIN}
          tooltip="Move this group down"
          size={Size.sm}
          onclick={() => {
            onGroup?.(
              new CustomEvent("group", {
                detail: {
                  action: "down",
                  groupId: group.id
                }
              })
            );
          }}
        />
        <Button
          icon="trash"
          style={ButtonStyle.PLAIN}
          type={ButtonVariant.DANGER}
          tooltip="Delete this group"
          size={Size.sm}
          onclick={() => {
            onGroup?.(
              new CustomEvent("group", {
                detail: {
                  action: "delete",
                  groupId: group.id
                }
              })
            );
          }}
        />
      </span>
    {/if}
  </div>
  {#each _options as option, index (option.id)}
    <SelectOptionEditItemView
      {option}
      {index}
      {parentBgIndex}
      groupId={group?.id ?? "ungrouped"}
      isFocusing={option.id === focusedOptionId}
      isDefault={option.id === defaultOptionId}
      onRemove={onRemove}
      onDefault={onDefault}
      onEnter={onEnter}
      onChange={(event) => {
        onOptionChange?.(
          event as CustomEvent<Partial<IPropertyConfigOption> & { id: string }>
        );
      }}
    />
  {/each}
  <div class="flex justify-center mt-1">
    <Button
      label="+ Add new option"
      style={ButtonStyle.PLAIN}
      size={Size.sm}
      isUnderlined={true}
      onclick={() => addOption()}
    />
  </div>
</div>
