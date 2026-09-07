<script lang="ts">
  import Avatar from "@21n/elements/avatarPicker/Avatar.svelte";
  import ColorPickerMini from "@21n/elements/colorPicker/ColorPickerMini.svelte";
  import CustomColorPropagator from "@21n/elements/style/CustomColorPropagator.svelte";
  import Table2 from "@21n/elements/table/Table2.svelte";
  import Text from "@21n/elements/text/Text.svelte";
  import { MemotronAction } from "@nucleum/features/memory/memory-action.enum";
  import {
    AvatarPickerContext,
    AvatarType,
    type IAvatar
  } from "@21n/elements/avatarPicker/avatar.type";
  import {
    TableCellDefaultAction,
    TableCellType,
    type TableColumn
  } from "@21n/elements/table/table.type";
  import { TextStyle } from "@21n/elements/text/text.enum";
  import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";
  import ModalFooter from "@nucleum/application/modal/ModalFooter.svelte";
  import { markdownSettings } from "@nucleum/features/memory/markdown/markdown.settings";
  import ModalContentPadded from "@nucleum/application/modal/ModalContentPadded.svelte";
  let callouts = $state([...$markdownSettings.callout]);
  let previewId: string | undefined = callouts[0]?.id;
  let error: string | undefined = undefined;
  const columns: TableColumn[] = [
    {
      key: "play",
      type: TableCellType.ACTION,
      actionTooltip: {
        body: "Preview"
      },
      action: (row: any) => {
        previewId = row.id;
      }
    },
    {
      label: "Icon",
      key: "avatar",
      width: 0.5,
      type: TableCellType.CUSTOM,
      component: Avatar as unknown as ConstructorOfATypedSvelteComponent,
      componentProps: (row: any) => ({
        avatar: row.avatar,
        isInEditMode: true,
        context: AvatarPickerContext.CALLOUT_AVATAR,
        changeCallback: (avatar: IAvatar) => {
          row.avatar = {
            ...avatar,
            color: undefined
          };
          previewId = undefined;
          previewId = row.id;
        }
      })
    },
    {
      label: "Label",
      key: "label",
      width: 2,
      type: TableCellType.TEXT_INPUT,
      placeholder: "Enter label"
    },
    {
      label: "Color",
      key: "color",
      width: 1,
      type: TableCellType.CUSTOM,
      component: ColorPickerMini as unknown as ConstructorOfATypedSvelteComponent,
      componentProps: (row: any) => ({
        hue: row.color,
        changeCallback: (value: number | string) => {
          row.color = +value;
          previewId = undefined;
          previewId = row.id;
        }
      })
    }
  ];

  function addCallout() {
    callouts = [
      ...callouts,
      {
        id: generateSimpleRandomId(),
        avatar: {
          type: AvatarType.ICON,
          isFilled: true,
          code: "&#XE88E"
        },
        color: Math.random() * 360,
        label: ""
      }
    ];
  }
  async function onSave() {
    error = undefined;
    if (callouts.some((x) => !x.label)) {
      error = "Please enter a label for each callout";
      return;
    }
    return markdownSettings.modify({ callout: callouts });
  }
</script>

<div class="flex flex-col gap-4 w-full h-full">
  <ModalContentPadded class="w-full flex flex-1 overflow-y-auto">
    <Table2
      {columns}
      bind:data={callouts}
      actions={[{ action: TableCellDefaultAction.REMOVE, index: 0 }]}
      addAction="Add"
      onAdd={addCallout}
    />
  </ModalContentPadded>
  <!-- Callout Preview -->
{#if previewId}
    {@const preview = callouts.find(
      (item) => item.id === previewId
    )}
    <CustomColorPropagator
      color={preview?.color}
      class="flex flex-col gap-3 w-full text-left border-t border-brs2 p-4"
    >
      <Text
        content={`Preview for **${preview?.label ?? "Untitled Callout"}** callout - Click on the play button to preview it here.`}
        style={TextStyle.SECTION_HEADING_SMALL}
      />
      <div
        class="flex items-center gap-2 border border-ccs2 bg-ccs4 p-2 rounded-md"
      >
        <div class="flex items-center gap-2 text-ccs1 h-full">
          <div class="flex flex-col justify-start h-full pt-2">
            <Avatar avatar={preview?.avatar} />
          </div>
          <div>
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Assumenda
            necessitatibus veniam provident beatae a hic voluptates repellendus
            odit eius eligendi excepturi possimus iusto, vero nulla nemo, amet
            labore! Repudiandae, quae.
          </div>
        </div>
      </div>
    </CustomColorPropagator>
  {/if}

  <ModalFooter
    action={MemotronAction.CALLOUT_SETTINGS}
    bind:error
    primaryAction={{
      label: "Save",
      callback: onSave
    }}
    secondaryAction={{
      label: "Cancel"
    }}
  />
</div>
