<script lang="ts">
  import DatePicker from "@21n/elements/datetime/DatePicker.svelte";
  import TextArea from "@21n/elements/input/TextArea.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import ModalContentPadded from "@nucleum/application/modal/ModalContentPadded.svelte";
  import ModalFooter from "@nucleum/application/modal/ModalFooter.svelte";
  import modalEvent from "@nucleum/application/modal/modal.store";
  import { generateResourceId } from "@nucleum/datafn/id.utils";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { ResourceActionType } from "@nucleum/datafn/resource.type";
  import { resourceAction } from "@nucleum/datafn/resource.utils";
  import { InputStyle } from "@21n/types/input.type";
  import { Orientation } from "@21n/types/direction.enum";
  import { Size } from "@21n/types/size.enum";
  import { toasts } from "@nucleum/stores/notification.store";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { assertDatafnMutationSucceeded } from "@nucleum/datafn/mutation.utils";

  let {
    date: initialDate = undefined
  }: {
    date?: Date | undefined;
  } = $props();

  const action = resourceAction(Resource.event, ResourceActionType.CREATE);
  let label = $state("");
  let notes = $state("");
  let date = $state<Date | undefined>(initialDate ?? new Date());
  let inputRef = $state<TextInput | undefined>(undefined);
  let error = $state<string | undefined>(undefined);

  async function onSave() {
    error = undefined;
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      error = "Name is required";
      return;
    }
    const startUnix = (date ?? new Date()).getTime();
    const endUnix = startUnix + 60 * 60 * 1000;
    const id = generateResourceId(Resource.event);
    const record = {
      id,
      label: trimmedLabel,
      event: trimmedLabel,
      startUnix,
      endUnix,
      value: {
        notes,
        startUnix,
        endUnix
      }
    };
    try {
      const result = await datafn.event.mutate({
        operation: "insert",
        id,
        record,
        context: action
      });
      assertDatafnMutationSucceeded(result);
    } catch {
      toasts.error("Failed to create event");
      return;
    }
    toasts.success("Event created");
    modalEvent.hide(action);
    return true;
  }
</script>

<div class="flex flex-col gap-6 justify-between w-full h-full">
  <ModalContentPadded class="flex flex-col gap-4">
    <TextInput
      bind:value={label}
      bind:this={inputRef}
      label={{ label: "Event name", orientation: Orientation.Vertical }}
      placeholder="Team sync, Review, Planning"
      style={InputStyle.PLAIN}
      size={Size.lg}
      onMount={() => {
        inputRef?.focus();
      }}
      onEnter={onSave}
    />
    <DatePicker bind:date variant="inline-with-icon" />
    <TextArea
      bind:value={notes}
      label={{ label: "Notes", orientation: Orientation.Vertical }}
      placeholder="Add notes"
    />
  </ModalContentPadded>
  <ModalFooter
    {action}
    bind:error
    primaryAction={{
      label: "Save",
      callback: onSave
    }}
    secondaryAction={{ label: "Cancel" }}
  />
</div>
