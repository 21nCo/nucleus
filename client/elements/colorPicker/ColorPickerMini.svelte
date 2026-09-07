<script lang="ts">
  import { popover } from "@nucleum/actions/popover.action";
  import { Size } from "@21n/types/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import Icon from "@21n/elements/Icon.svelte";
  import CustomColorPropagator from "@21n/elements/style/CustomColorPropagator.svelte";
  import ColorPickerPopover from "@21n/elements/colorPicker/ColorPickerPopover.svelte";
  let {
    hue = $bindable(),
    changeCallback = () => {},
    onDebouncedChangeCallback = () => {},
    width = undefined
  }: any = $props();
  let saturation = $state(50);
  let lightness = $state(50);

  function onChange(
    value: number | string,
    additional?: {
      saturation?: number;
      lightness?: number;
    }
  ) {
    hue = +value;
    if (additional) {
      saturation = additional.saturation || 50;
      lightness = additional.lightness || 50;
    }
    changeCallback?.(value);
  }
</script>

<CustomColorPropagator color={hue}>
  <div
    class={cn(
      "flex gap-1 items-center justify-center border border-brs3",
      width,
      {
        "w-8 h-8 rounded-full": !width,
        "rounded-md h-full": width,
        "bg-ccs1": hue !== undefined,
        "bg-bgs2": hue === undefined
      }
    )}
    use:popover={{
      content: ColorPickerPopover,
      id: "color-picker-mini-popover",
      componentProps: {
        hue: hue ?? 0,
        onChangeCallback: onChange,
        onDebouncedChangeCallback,
        isShowPreview: false
      }
    }}
  >
    <Icon
      icon="paint-brush"
      class={hue !== undefined ? "text-cbg" : "text-fgs3"}
      size={Size.sm}
    />
    {#if width}
      <span
        class={cn("text-b2", {
          "text-cbg": hue !== undefined,
          "text-fgs3": hue === undefined
        })}
      >
        Set color</span
      >
    {/if}
  </div>
</CustomColorPropagator>
