<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import Button from "@21n/elements/button/Button.svelte";
  import ColorPicker from "@21n/elements/colorPicker/ColorPicker.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import Popover from "@21n/elements/popover/Popover.svelte";
  import { Orientation } from "@21n/elements/direction.enum";
  import { InputStyle } from "@21n/elements/input/input.type";
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import CustomColorPropagator from "@21n/elements/style/CustomColorPropagator.svelte";
  import type { IPropertyConfigOption } from "@nucleum/features/collections/properties/property.type";
  import { hoverable } from "@nucleum/actions/hover.action";
  import { ButtonStyle } from "@21n/elements/button/button.type";
  import Badge from "@21n/elements/text/Badge.svelte";
  import context from "@nucleum/stores/context.store";
  import { OperatingSystem } from "@nucleum/client/runtime/context.type";
  let {
    option,
    index,
    isFocusing = $bindable(false),
    isHovering = $bindable(false),
    isDefault = false,
    groupId = "ungrouped",
    parentBgIndex = 1,
    onRemove = undefined,
    onDefault = undefined,
    onEnter = undefined,
    onChange = undefined
  }: {
    option: IPropertyConfigOption;
    index: number;
    isFocusing?: boolean;
    isHovering?: boolean;
    isDefault?: boolean;
    groupId?: string;
    parentBgIndex?: number;
    onRemove?: ((event: CustomEvent<string>) => void) | undefined;
    onDefault?: ((event: CustomEvent<string | null>) => void) | undefined;
    onEnter?: ((event: CustomEvent<string>) => void) | undefined;
    onChange?: ((event?: CustomEvent<any>) => void) | undefined;
  } = $props();
  let textInputRef: any;
  let isColorPickerOpen = $state(false);
  let colorPickerPopoverRef: any;
  let dev_isEnableDefaultSelection: boolean = false;
  let optionLabel = $state("");
  let optionColor = $state(0);
  $effect(() => {
    if (isFocusing) textInputRef?.focus();
  });
  $effect(() => {
    optionLabel = option.label ?? "";
    optionColor = option.color ?? Math.random() * 360;
  });

  function onHoverChange(isHovered: boolean) {
    isHovering = isHovered;
  }

  function propagateOptionChange() {
    onChange?.(
      new CustomEvent("change", {
        detail: {
          id: option.id,
          label: optionLabel,
          color: optionColor
        }
      })
    );
  }

  function onOptionKeydown(event: CustomEvent<KeyboardEvent>) {
    const keyboardEvent = event.detail;
    if (!(keyboardEvent instanceof KeyboardEvent)) return;
    if (keyboardEvent.key === "Escape") {
      textInputRef?.blur();
      keyboardEvent.stopPropagation();
    }
  }
</script>

<div
  class={cn(
    "flex relative items-center gap-2 w-full rounded-md px-1 h-10 border",
    {
      "border-brs3": isFocusing,
      "border-transparent": !isFocusing
    }
  )}
  data-index={index}
  data-id={option.id}
  data-group-id={groupId}
  draggable={!isColorPickerOpen}
  use:hoverable={{
    onHover: onHoverChange
  }}
>
  <span class="cursor-move h-full flex flex-col items-center justify-center">
    <Icon icon="rearrange" class="stroke-fgs3" />
  </span>
  <Popover
    triggerClass="flex items-center w-6 h-full"
    bind:isPopoverVisible={isColorPickerOpen}
    bind:this={colorPickerPopoverRef}
    options={{
      class: "w-80 min-h-fit p-4",
      id: "colorpickerforoption"
    }}
  >
    <CustomColorPropagator
      color={optionColor}
      class="relative rounded-full h-5 w-5 bg-ccs1"
    >
      <div
        class="absolute top-0.5 left-0.5 rounded-full h-4 w-4 border-[1.5px] border-brs2 bg-ccs1"
      ></div>
    </CustomColorPropagator>
    {#snippet popover()}
      <div class="flex flex-col items-center justify-center gap-8">
        <ColorPicker
          bind:hue={optionColor}
          onChangeCallback={propagateOptionChange}
          isShowPreview={false}
          label={{ label: "Choose color", orientation: Orientation.Vertical }}
        />
        <Button
          label="Done"
          style={ButtonStyle.OUTLINED}
          size={Size.sm}
          onclick={() => {
            colorPickerPopoverRef?.hide();
          }}
        />
      </div>
    {/snippet}
  </Popover>
  <TextInput
    bind:this={textInputRef}
    bind:value={optionLabel}
    style={InputStyle.PLAIN}
    placeholder="option..."
    onChange={propagateOptionChange}
    onEnter={() => {
      onEnter?.(
        new CustomEvent("enter", {
          detail: option.id
        })
      );
    }}
    onKeydown={onOptionKeydown}
    onFocus={() => {
      isFocusing = true;
      colorPickerPopoverRef?.hide();
    }}
    onBlur={() => {
      isFocusing = false;
    }}
  />
  <div
    class={cn("flex items-center h-full right-0 pr-1 rounded-r-md", {
      "absolute pl-4": !isFocusing,
      "bg-gradient-to-l to-bgs1/80 from-bgs1 via-bgs1": parentBgIndex === 1,
      "bg-gradient-to-l to-bgs2/80 from-bgs2 via-bgs2": parentBgIndex === 2
    })}
  >
    {#if isHovering || isFocusing || $context.os === OperatingSystem.IOS}
      {#if !isFocusing && dev_isEnableDefaultSelection}
        <Button
          icon={isDefault ? "minus-circle" : "circle-dashed"}
          size={Size.sm}
          tooltip={isDefault ? "Remove default" : "Set as default"}
          onclick={(event) => {
            event.stopPropagation();
            if (isDefault) {
              onDefault?.(
                new CustomEvent("default", {
                  detail: null
                })
              );
            } else {
              onDefault?.(
                new CustomEvent("default", {
                  detail: option.id
                })
              );
            }
          }}
        />
      {/if}
      <Button
        icon="cross"
        size={Size.sm}
        tooltip={"Remove"}
        onclick={(event) => {
          event.stopPropagation();
          onRemove?.(
            new CustomEvent("remove", {
              detail: option.id
            })
          );
        }}
      />
    {:else if isDefault && dev_isEnableDefaultSelection}
      <Badge text="default" size={Size.md} />
    {/if}
  </div>
</div>
