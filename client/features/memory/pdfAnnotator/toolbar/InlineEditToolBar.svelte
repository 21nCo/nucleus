<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import Divider from "@21n/elements/Divider.svelte";
  import { ColorStrength } from "@21n/types/appearance.type";
  import { Orientation } from "@21n/types/direction.enum";
  import HighlightColors from "@nucleum/features/memory/common/highlighters/HighlightColors.svelte";
  import { ButtonVariant } from "@21n/types/button.type";
  let {
    style = "",
    selectedColor = $bindable(""),
    editable = false,
    onEdit = undefined,
    onDelete = undefined,
    onColor = undefined
  }: {
    style?: string;
    selectedColor?: string;
    editable?: boolean;
    onEdit?: (() => void) | undefined;
    onDelete?: (() => void) | undefined;
    onColor?: ((highlighter: any) => void) | undefined;
  } = $props();
</script>

<button
  data-pdf-annotation-overlay
  class="flex gap-1 min-h-fit h-10 items-center bg-bgs2 text-fgs1 rounded-md px-2 py-1 border border-brs3"
  {style}
  onclick={(event) => event.stopPropagation()}
  onmousedown={(event) => event.stopPropagation()}
>
  {#if editable}
    <Button
      icon="edit"
      tooltip="Edit"
      parentBgIndex={2}
      onclick={() => {
        onEdit?.();
      }}
    />
  {/if}
  <Button
    icon="trash"
    parentBgIndex={2}
    tooltip="Delete"
    type={ButtonVariant.DANGER}
    onclick={() => {
      onDelete?.();
    }}
  />
  <Divider
    orientation={Orientation.Vertical}
    colorStrength={ColorStrength.Strong}
  />
  <HighlightColors
    bind:selected={selectedColor}
    onColor={onColor}
  />
</button>
