<script lang="ts">
  import type { EventHandler } from "svelte/elements";
  import { ButtonVariant } from "@21n/elements/button/button.type";
  import { Size } from "@21n/elements/size.enum";
  import Button from "@21n/elements/button/Button.svelte";

  let {
    size = Size.md,
    type = ButtonVariant.PRIMARY,
    parentBackgroundIndex = 1,
    accept = "image/*",
    oninput = undefined,
  }: {
    size?: Size.sm | Size.md | Size.lg;
    type?: ButtonVariant;
    parentBackgroundIndex?: number;
    accept?: string;
    oninput?: EventHandler<Event, HTMLInputElement> | undefined;
  } = $props();

  
  
  
  let inputElement: HTMLInputElement;
  function triggerFileInput() {
    // const inputElement = document.getElementById("myFile");
    inputElement?.click();
  }
</script>

<input
  style="display:none;"
  type="file"
  bind:this={inputElement}
  name="filename"
  {accept}
  oninput={(event) => {
    oninput?.(event);
  }}
/>
<Button
  icon="upload"
  label="Upload"
  {size}
  {type}
  parentBgIndex={parentBackgroundIndex}
  onclick={triggerFileInput}
/>
