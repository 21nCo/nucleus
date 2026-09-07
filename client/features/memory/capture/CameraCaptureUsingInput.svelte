<script lang="ts">
  import { onMount } from "svelte";
  import Button from "@21n/elements/button/Button.svelte";
  import { Size } from "@21n/elements/size.enum";
  import { ButtonVariant } from "@21n/elements/button/button.type";
  import type { IActiveCaptureStore } from "@nucleum/features/memory/capture/capture.store";

  let {
    captureStore,
    onClose = undefined
  }: {
    captureStore: IActiveCaptureStore;
    onClose?: (() => void) | undefined;
  } = $props();
  let photoTaken = $state(false);
  let imagePreview = $state<string | null>(null);
  let fileInputRef: HTMLInputElement;

  function handleCapture(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview = e.target?.result as string;
        savePhoto();
      };
      reader.readAsDataURL(file);
    }
  }

  function savePhoto() {
    if (imagePreview) {
      fetch(imagePreview)
        .then((res) => res.blob())
        .then((blob) => {
          captureStore.saveCameraCapture(blob);
        });
    }
  }

  function retakePhoto() {
    photoTaken = false;
    imagePreview = null;
  }

  onMount(() => {
    fileInputRef?.click();
  });
</script>

<div
  class="relative flex flex-col items-center justify-between w-full h-full overflow-hidden"
>
  <div
    class="relative w-full h-full overflow-hidden flex items-center justify-center"
  >
    {#if photoTaken && imagePreview}
      <img
        src={imagePreview}
        alt="Captured photo"
        class="max-w-full max-h-full object-contain"
      />
    {:else}
      <div class="text-center">
        <label for="cameraInput" class="cursor-pointer">
          <input
            bind:this={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onchange={handleCapture}
            id="cameraInput"
            class="hidden"
          />
          Capturing...
        </label>
      </div>
    {/if}
  </div>

  <div
    class="absolute bottom-20 left-0 right-0 h-24 grid grid-cols-3 gap-4 items-center bg-bgs1 px-4"
  >
    {#if photoTaken}
      <Button
        icon="reset"
        label="Retake"
        type={ButtonVariant.DANGER}
        size={Size.sm}
        isPreventMinWidth={true}
        onclick={retakePhoto}
      />
      <Button
        icon="save"
        label="Save"
        type={ButtonVariant.PRIMARY}
        size={Size.sm}
        isPreventMinWidth={true}
        onclick={savePhoto}
      />
      <Button
        icon="cross"
        label="Cancel"
        size={Size.sm}
        isPreventMinWidth={true}
        onclick={() => {
          captureStore.reset();
          onClose?.();
        }}
      />
    {:else}
      <div class="col-span-2"></div>
      <Button
        icon="cross"
        label="Cancel"
        size={Size.sm}
        isPreventMinWidth={true}
        onclick={() => {
          captureStore.reset();
          onClose?.();
        }}
      />
    {/if}
  </div>
</div>
