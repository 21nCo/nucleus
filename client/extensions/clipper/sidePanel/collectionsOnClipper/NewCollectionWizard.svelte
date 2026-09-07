<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import InlineErrorMessage from "@21n/elements/text/InlineErrorMessage.svelte";
  import { ButtonStyle } from "@21n/elements/button/button.type";
  import { Size } from "@21n/elements/size.enum";
  let {
    label = $bindable<string | undefined>(undefined),
    onSave = undefined
  }: {
    label?: string | undefined;
    onSave?: ((label: string) => void) | undefined;
  } = $props();
  let isSaving = false;
  let errorMessage: string | undefined = undefined;

  function handleSave() {
    if (!label) {
      errorMessage = "Collection name is required";
      return;
    }
    isSaving = true;
    onSave?.(label);
  }
</script>

<div class="p-4 flex flex-col gap-1">
  <div class="flex items-center gap-2">
    <TextInput
      bind:value={label}
      size={Size.sm}
      placeholder="New collection name"
      onEnter={handleSave}
    />
    <Button
      icon={isSaving ? "svg-spinners:3-dots-fade" : "save"}
      tooltip="Save collection"
      style={ButtonStyle.OUTLINED}
      onclick={handleSave}
    />
  </div>
  {#if errorMessage}
    <InlineErrorMessage bind:error={errorMessage} />
  {/if}
</div>
