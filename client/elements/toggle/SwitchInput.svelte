<script lang="ts">
  import { Orientation } from "@21n/elements/direction.enum";
  import { Size } from "@21n/elements/size.enum";
  import { InputStyle, type InputLabel } from "@21n/elements/input/input.type";
  import { cn } from "@21n/utils/ui.utils";
  import FormControlLabel from "@21n/elements/text/formLabel/FormControlLabel.svelte";
  import Switch from "@21n/elements/toggle/Switch.svelte";
  import InputBaseElement from "@21n/elements/InputBaseElement.svelte";

  let {
    label,
    style = InputStyle.PLAIN,
    checked = $bindable(false),
    size = Size.md,
    isExpanded = false,
    isDisabled = false,
    parentBgIndex = 1,
    onChange = undefined
  }: {
    label: InputLabel;
    style?: InputStyle;
    checked?: boolean;
    size?: Size;
    isExpanded?: boolean;
    isDisabled?: boolean;
    parentBgIndex?: number;
    onChange?: ((event: CustomEvent<boolean>) => void) | undefined;
  } = $props();
  const resolvedLabel = $derived(
    label.orientation
      ? label
      : {
          ...label,
          orientation: Orientation.Horizontal
        }
  );

  function propagateChange(nextChecked: boolean) {
    const changeEvent = new CustomEvent<boolean>("change", {
      detail: nextChecked
    });
    onChange?.(changeEvent);
  }
</script>

{#if !isExpanded &&
  (resolvedLabel.orientation === Orientation.Horizontal || !resolvedLabel.orientation)}
  <button
    class={cn("flex justify-center items-center min-w-32", {
      "gap-3": size === Size.sm,
      "gap-4": size === Size.md,
      "border border-brs3 rounded-full py-1": style === InputStyle.BORDERED
    })}
    onclick={() => {
      checked = !checked;
      propagateChange(checked);
    }}
  >
    <Switch
      bind:on={checked}
      {size}
      ariaLabel={resolvedLabel.label}
      onChange={(event) => {
        propagateChange(event.detail);
      }}
      {isDisabled}
    />
    <FormControlLabel
      props={resolvedLabel}
      isCursorPointer={true}
      isWrapText={isExpanded}
    />
  </button>
{:else}
  <InputBaseElement {style} label={resolvedLabel} {parentBgIndex}>
    <Switch
      bind:on={checked}
      {size}
      ariaLabel={resolvedLabel.label}
      onChange={(event) => {
        propagateChange(event.detail);
      }}
      {isDisabled}
    />
  </InputBaseElement>
{/if}
