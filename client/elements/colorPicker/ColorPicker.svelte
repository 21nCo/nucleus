<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import ColorSlider from "@21n/elements/colorPicker/ColorSlider.svelte";
  import { appStore } from "@nucleum/stores/app.store";
  import appearance from "@nucleum/stores/appearance.store";
  import FormControlLabelWrapper from "@21n/elements/text/formLabel/FormControlLabelWrapper.svelte";
  import type { InputLabel } from "@21n/types/input.type";
  import ColorPickerElement from "@21n/elements/colorPicker/ColorPickerElement.svelte";
  let {
    hue = $bindable(0),
    label = undefined,
    isShowPreview = true,
    isHueMode = true,
    hex = $bindable("#000000"),
    onChangeCallback = () => {},
    onDebouncedChangeCallback = () => {}
  }: {
    hue?: number;
    label?: InputLabel | undefined;
    isShowPreview?: boolean;
    isHueMode?: boolean;
    hex?: string;
    onChangeCallback?: (
      value: number | string,
      additional?: {
        saturation?: number;
        lightness?: number;
      }
    ) => void;
    onDebouncedChangeCallback?: (
      value: number | string,
      additional?: {
        saturation?: number;
        lightness?: number;
      }
    ) => void;
  } = $props();
  let saturation = $state(50);
  let lightness = $state(50);
  let fgColorHsl = $state("");
  let isDark = $state($appearance.colorScheme.isDark);
  $effect(() => {
    isDark = $appearance.colorScheme.isDark;
  });

  function onChange(value: number | string) {
    if (typeof onChangeCallback === "function") {
      onChangeCallback(value, {
        saturation,
        lightness
      });
    }
  }

  function onDebouncedChange(value: number | string) {
    if (typeof onDebouncedChangeCallback === "function") {
      onDebouncedChangeCallback(value, {
        saturation,
        lightness
      });
    }
  }

  function onElementChange(payload: {
    rgb: { r: number; g: number; b: number; a: number };
    hex: string;
  }) {
    hex = payload.hex;
    onChange(payload.hex);
  }

  function onElementDebouncedChange(payload: {
    rgb: { r: number; g: number; b: number; a: number };
    hex: string;
  }) {
    hex = payload.hex;
    onDebouncedChange(payload.hex);
  }
</script>

<FormControlLabelWrapper props={label}>
  <div class="flex flex-col gap-6 items-center justify-center w-full">
    {#if isHueMode}
      <ColorSlider
        bind:hue
        bind:saturation
        bind:fgColorHsl
        bind:lightness
        {onChange}
        {onDebouncedChange}
      />
    {:else}
      <ColorPickerElement
        onChange={onElementChange}
        onDebouncedChange={onElementDebouncedChange}
        bind:value={hex}
      />
    {/if}
    {#if $appStore.isDebugMode}
      <Button
        label={isDark ? "Dark" : "Light"}
        onclick={() => {
          isDark = !isDark;
        }}
      />
    {/if}
  </div>
  {#if isShowPreview}
    {#if isHueMode}
      <div class="flex w-full justify-center mt-4">
        <div
          class="w-1/2 h-8 p-2 flex justify-center items-center rounded-md"
          style="background-color:hsl({hue}, {saturation}%, {lightness}%); color: {fgColorHsl};"
        >
          Preview
        </div>
      </div>
    {:else}
      <div class="flex w-full justify-center mt-4">
        <div
          class="w-1/2 h-8 p-2 flex justify-center items-center rounded-md"
          style="background-color: {hex};"
        >
          Preview
        </div>
      </div>
    {/if}
  {/if}
</FormControlLabelWrapper>

<!-- TODO - used colors -->
