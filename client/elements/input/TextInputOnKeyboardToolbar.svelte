<script lang="ts">
  import { tick } from "svelte";
  import KeyboardToolbar from "@21n/elements/keyboardToolbar/KeyboardToolbar.svelte";
  import Button from "@21n/elements/button/Button.svelte";
  import { ButtonStyle, ButtonVariant } from "@21n/elements/button/button.type";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import { InputStyle } from "@21n/elements/input/input.type";

  let {
    value = $bindable(""),
    onCancel = undefined,
    onDebouncedChange = undefined,
    onMount = undefined,
    onSave = undefined
  }: {
    value?: string;
    onCancel?: ((event: CustomEvent<void>) => void) | undefined;
    onDebouncedChange?: ((event: CustomEvent<any>) => void) | undefined;
    onMount?: ((event: CustomEvent<void>) => void) | undefined;
    onSave?: ((event: CustomEvent<void>) => void) | undefined;
  } = $props();

  let inputRef: TextInput;

  export async function focus() {
    await tick();
    inputRef?.focus();
  }

  function onCancelClick() {
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }
    const cancelEvent = new CustomEvent<void>("cancel");
    onCancel?.(cancelEvent);
  }
</script>

<KeyboardToolbar
  class="bg-bgs2 h-14 px-4 flex items-center justify-between"
  zIndex={80}
>
  <div class="flex items-center justify-center gap-2 flex-1 pr-3">
    <TextInput
      bind:this={inputRef}
      bind:value
      isPreventKeyboardToolbar={true}
      style={InputStyle.PLAIN}
      onDebouncedChange={(event) => {
        onDebouncedChange?.(event);
      }}
      onMount={() => {
        const mountEvent = new CustomEvent<void>("mount");
        onMount?.(mountEvent);
      }}
    />
  </div>
  <div class="flex items-center justify-center gap-2">
    <Button
      icon="save"
      parentBgIndex={2}
      style={ButtonStyle.OUTLINED}
      type={ButtonVariant.PRIMARY}
      isPreventMinWidth={true}
      onclick={() => {
        const saveEvent = new CustomEvent<void>("save");
        onSave?.(saveEvent);
      }}
      onmousedown={(event) => event.preventDefault()}
    />
    <Button
      icon="cross"
      parentBgIndex={2}
      style={ButtonStyle.OUTLINED}
      isPreventMinWidth={true}
      onclick={onCancelClick}
    />
  </div>
</KeyboardToolbar>
