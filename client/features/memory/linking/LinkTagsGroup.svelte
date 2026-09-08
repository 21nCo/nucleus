<script lang="ts">
  import { hoverable } from "@nucleum/actions/hover.action";
  import { logger } from "@nucleum/client/runtime/logging/logger";
  import Button from "@21n/elements/button/Button.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import Popover from "@21n/elements/popover/Popover.svelte";
  import InlineErrorMessage from "@21n/elements/text/InlineErrorMessage.svelte";
  import Tag from "@21n/elements/text/Tag.svelte";
  import Text from "@21n/elements/text/Text.svelte";
  import context from "@nucleum/stores/context.store";
  import { confirmationNotification } from "@nucleum/stores/notification.store";
  import view from "@nucleum/stores/view.store";
  import {
    ButtonStyle,
    ButtonVariant,
    type IButtonParams
  } from "@21n/elements/button/button.type";
  import { Size } from "@21n/elements/size.enum";
  import { TextStyle } from "@21n/elements/text/text.enum";
  import { cn } from "@21n/utils/ui.utils";
  import type { ILinkTagGroup } from "@nucleum/datafn/link.type";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";

  let {
    group,
    onBulkDelete = undefined,
    onRemove = undefined,
    onSave = undefined,
    onUpdate = undefined,
    onUpdateGroupName = undefined
  }: {
    group: ILinkTagGroup;
    onBulkDelete?: ((event: CustomEvent<string>) => void) | undefined;
    onRemove?: ((event: CustomEvent<IRecordId>) => void) | undefined;
    onSave?:
      | ((event: CustomEvent<{ group: string; label: string }>) => void)
      | undefined;
    onUpdate?:
      | ((event: CustomEvent<{ id: IRecordId; label: string }>) => void)
      | undefined;
    onUpdateGroupName?:
      | ((event: CustomEvent<{ group: string; newgroup: string }>) => void)
      | undefined;
  } = $props();
  const isWithoutGroup = $derived(group.group === "" || !group.group);
  let isHovered = $state(false);
  let inputValueWithinGroup = $state("");
  let addTagPopover: Popover;
  let editTagPopover: Popover;
  let isEditingGroupName = $state(false);
  let errorMessage = $state("");

  const buttonProps: IButtonParams = {
    size: Size.xs,
    isPreventMinWidth: true,
    style: ButtonStyle.OUTLINED
  };

  function emitSave(detail: { group: string; label: string }) {
    const saveEvent = new CustomEvent<{ group: string; label: string }>("save", {
      detail
    });
    onSave?.(saveEvent);
  }

  function emitUpdateGroupName(detail: { group: string; newgroup: string }) {
    const updateGroupNameEvent = new CustomEvent<{
      group: string;
      newgroup: string;
    }>("updateGroupName", {
      detail
    });
    onUpdateGroupName?.(updateGroupNameEvent);
  }

  function emitBulkDelete(groupName: string) {
    const bulkDeleteEvent = new CustomEvent<string>("bulkDelete", {
      detail: groupName
    });
    onBulkDelete?.(bulkDeleteEvent);
  }

  function emitRemove(id: IRecordId) {
    const removeEvent = new CustomEvent<IRecordId>("remove", {
      detail: id
    });
    onRemove?.(removeEvent);
  }

  function emitUpdate(detail: { id: IRecordId; label: string }) {
    const updateEvent = new CustomEvent<{ id: IRecordId; label: string }>(
      "update",
      {
        detail
      }
    );
    onUpdate?.(updateEvent);
  }

  function save(groupSelected?: string) {
    if (!inputValueWithinGroup) {
      errorMessage = "Tag cannot be empty";
      addTagPopover?.hide();
      return;
    }
    emitSave({
      group: groupSelected ?? "",
      label: inputValueWithinGroup
    });
    inputValueWithinGroup = "";
    addTagPopover?.hide();
  }

  function handleUpdateGroupName() {
    emitUpdateGroupName({
      group: group.group,
      newgroup: inputValueWithinGroup
    });
    onGroupNameCancel();
  }

  function onGroupNameCancel() {
    isEditingGroupName = false;
    inputValueWithinGroup = "";
  }
</script>

<div
  class={cn(
    "flex flex-col items-start gap-3 border rounded-md p-4 w-full userdata",
    {
      "border-brs2": !isHovered || isWithoutGroup,
      "border-brs3": isHovered && !isWithoutGroup
    }
  )}
  use:hoverable={{
    onHover: (e) => (isHovered = e)
  }}
>
  <div class="flex gap-6 w-full h-8 justify-between items-center">
    {#if isEditingGroupName}
      <TextInput
        bind:value={inputValueWithinGroup}
        placeholder="Edit group name"
        onEnter={handleUpdateGroupName}
        isShowSaveControl={true}
        onSave={handleUpdateGroupName}
        onCancel={onGroupNameCancel}
      />
    {:else}
      <Text
        content={group.group ? group.group + ":" : "No group"}
        style={TextStyle.SECTION_HEADING}
      />
    {/if}
    {#if (isHovered || $context.isTouchDevice) && !isWithoutGroup}
      <div class="flex gap-2 items-center">
        {#if !isEditingGroupName}
          <Button
            icon="edit"
            label={$view.isConstrainedWidth ? undefined : "Edit group name"}
            {...buttonProps}
            onclick={() => {
              isEditingGroupName = true;
              inputValueWithinGroup = group.group;
            }}
          />
        {/if}
        <Popover bind:this={addTagPopover}>
          <Button
            icon="plus"
            label={$view.isConstrainedWidth ? undefined : "Add tag"}
            {...buttonProps}
            onclick={() => {}}
          />
          {#snippet popover()}
            <div class="flex flex-col items-center gap-6 p-3 w-80">
              <TextInput
                bind:value={inputValueWithinGroup}
                placeholder={`Add tag ${group.group ? `to ${group.group}` : ""}`}
              />
              <span>
                <Button
                  label="Save"
                  onclick={() => save(group.group)}
                  size={Size.sm}
                />
              </span>
            </div>
          {/snippet}
        </Popover>
        <Button
          icon="trash"
          label={$view.isConstrainedWidth ? undefined : "Delete all"}
          {...buttonProps}
          type={ButtonVariant.DANGER}
          onclick={() => {
            confirmationNotification.notify({
              title: "Delete all tags",
              message: `Are you sure you want to delete all tags ${group.group ? `in **${group.group}**` : "without prefix"}?`,
              confirmAction: {
                label: "Proceed",
                variant: ButtonVariant.DANGER,
                callback: async () => {
                  emitBulkDelete(group.group);
                  return true;
                }
              }
            });
          }}
        />
      </div>
    {/if}
  </div>
  <div class="flex gap-2 flex-wrap">
    {#each group.items as item (item.id)}
      <!-- <button
        class="text-b2 px-3 py-1 border border-brs2 rounded-md hover:bg-bgs2 cursor-pointer"
        >{item.label}</button
      > -->
      {#if item.label}
        <Popover
          bind:this={editTagPopover}
          onHide={() => {
            inputValueWithinGroup = "";
          }}
        >
          <Tag
            label={item.label}
            icon="relation"
            onclick={() => {
              inputValueWithinGroup = item.label ?? "";
            }}
            onRemove={() => {
              emitRemove(item.id);
            }}
          />
          {#snippet popover()}
            <div class="flex flex-col items-center gap-6 p-3 w-80">
              <TextInput
                bind:value={inputValueWithinGroup}
                placeholder="Editing tag"
              />
              <span class="flex gap-2">
                <Button
                  label="Update"
                  icon="check"
                  isPreventMinWidth={true}
                  onclick={() => {
                    emitUpdate({
                      id: item.id,
                      label: inputValueWithinGroup
                    });
                    editTagPopover?.hide();
                    inputValueWithinGroup = "";
                  }}
                  size={Size.sm}
                />
                <Button
                  label="Delete"
                  icon="trash"
                  isPreventMinWidth={true}
                  type={ButtonVariant.DANGER}
                  onclick={() => {
                    emitRemove(item.id);
                    editTagPopover?.hide();
                  }}
                  size={Size.sm}
                />
              </span>
            </div>
          {/snippet}
        </Popover>
      {/if}
    {/each}
  </div>
  {#if errorMessage}
    <InlineErrorMessage bind:error={errorMessage} />
  {/if}
</div>
