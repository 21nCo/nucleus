<script lang="ts">
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { ResourceActionType } from "@nucleum/schema/legacy/resource-action.enum";
  import { resourceAction } from "@nucleum/datafn/resource.utils";
  import ModalFooter from "@21n/elements/modal/ModalFooter.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import OptionSelector from "@21n/elements/select/OptionSelector.svelte";
  import { toasts } from "@nucleum/stores/notification.store";
  import { Orientation } from "@21n/elements/direction.enum";
  import {
    OptionSelectorStyle,
    type ISelectItem
  } from "@21n/elements/select/select.type";
  import ModalContentPadded from "@21n/elements/modal/ModalContentPadded.svelte";
  import { CombinationType } from "@nucleum/features/spaces/combination/combination.type";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { generateResourceId } from "@nucleum/datafn/id.utils";

  let label = "";
  let type: CombinationType = CombinationType.NOTEBOOK;
  let error: string | undefined = undefined;
  const typeOptions: ISelectItem[] = [
    {
      label: "Notebook",
      icon: "sidebar",
      value: CombinationType.NOTEBOOK
    },
    // {
    //   label: "Wall",
    //   icon: "widget",
    //   value: CombinationType.WALL,
    //   isDisabled: true,
    //   badge: "planned"
    // },
    {
      label: "Canvas",
      icon: "canvas",
      value: CombinationType.CANVAS,
      isDisabled: true,
      badge: "planned"
    }
    // {
    //   label: "Mind map",
    //   icon: "tree-view",
    //   value: CombinationType.MINDMAP,
    //   isDisabled: true,
    //   badge: "planned"
    // }
  ];

  async function onSave() {
    error = undefined;
    if (label.length === 0) {
      error = "Name is required";
      return;
    }
    if (type !== CombinationType.NOTEBOOK) {
      toasts.error("Only side nav spaces are supported currently");
      return;
    }
    const id = generateResourceId(Resource.space);
    const result = await datafn.space.mutate({
      operation: "insert",
      id,
      record: {
        id,
        label,
        type,
        items: []
      }
    });
    if (result) {
      toasts.success("Space created");
      return true;
    } else {
      toasts.error("Failed to create space");
    }
  }
</script>

<div class="flex flex-col gap-6 justify-between w-full h-full">
  <ModalContentPadded>
    <div class="flex flex-col gap-6 w-full h-full">
      <TextInput
        label={{
          label: "Name of the space",
          orientation: Orientation.Vertical
        }}
        placeholder="School, Project X, Work, etc."
        bind:value={label}
      />
      <OptionSelector
        labelProps={{
          label: "Layout of the space",
          orientation: Orientation.Vertical
        }}
        style={OptionSelectorStyle.TRAIN}
        options={typeOptions}
        bind:selected={type}
      />
    </div>
  </ModalContentPadded>
  <ModalFooter
    action={resourceAction(Resource.space, ResourceActionType.CREATE)}
    bind:error
    primaryAction={{
      label: "Save",
      callback: onSave
    }}
    secondaryAction={{ label: "Cancel" }}
  />
</div>
