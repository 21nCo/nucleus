<script lang="ts">
  import TextArea from "@21n/elements/input/TextArea.svelte";
  import InlineFeedbackText from "@nucleum/extensions/clipper/InlineFeedbackText.svelte";
  import { Orientation } from "@21n/elements/direction.enum";
  import { InputStyle } from "@21n/elements/input/input.type";
  import { AlertType } from "@nucleum/stores/notifications/notification.type";
  import type { IActiveCollectionStore } from "./collection.store";
  let {
    collection
  }: {
    collection: IActiveCollectionStore;
  } = $props();

  let status = $state<
    | {
        type: AlertType;
        message: string;
      }
    | undefined
  >(undefined);

  async function onDescriptionChange(value: string) {
    status = {
      type: AlertType.PROGRESS,
      message: "Updating description..."
    };
    try {
      await collection.modify({ description: value });
    } catch {
      status = {
        type: AlertType.ERROR,
        message: "Failed to update description"
      };
      return;
    }
    status = {
      type: AlertType.SUCCESS,
      message: "Description updated"
    };
  }
</script>

<div
  class="flex flex-col gap-3 p-3 w-96 cw:w-full max-w-full bg-bgs1 cw:border-transparent border border-brs2 rounded-md"
>
  <TextArea
    placeholder="Add a description"
    width="w-full"
    label={{
      label: "Edit collection description",
      orientation: Orientation.Vertical
    }}
    style={InputStyle.FILLED}
    bind:value={$collection.description}
    rows={4}
    debouncedChangeCallback={onDescriptionChange}
  />
  <InlineFeedbackText bind:feedback={status} isRenderEmptyHeight={true} />
</div>
