<script>
  import ModalFooter from "@nucleum/application/modal/ModalFooter.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import { Orientation } from "@21n/types/direction.enum";
  import { GatheryEvent } from "@21n/types/gathery/gatheryEvent.enum";
  import { spaceStore } from "@nucleum/features/spaces/space.store";
  let spaceName = "";
</script>

<div class="flex flex-col gap-4">
  <TextInput
    label={{ label: "Space Name", orientation: Orientation.Vertical }}
    bind:value={spaceName}
  />
  <ModalFooter
    action={GatheryEvent.CREATE_SPACE}
    primaryAction={{
      label: "Create Space",
      callback: async () => {
        return spaceStore.createSpace(spaceName);
      }
    }}
  />
</div>
