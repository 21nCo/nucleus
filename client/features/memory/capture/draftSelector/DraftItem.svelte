<script lang="ts">
  import { hoverable } from "@nucleum/actions/hover.action";
  import Button from "@21n/elements/button/Button.svelte";
  import context from "@nucleum/stores/context.store";
  import { ButtonStyle, ButtonVariant } from "@21n/types/button.type";
  import { Size } from "@21n/types/size.enum";
  import { parseAndFormatDate } from "@21n/utils/time.utils";
  import type { ICapture } from "@nucleum/features/memory/capture/capture.type";

  let {
    draft,
    onSelect = undefined,
    onDelete = undefined
  }: {
    draft: ICapture;
    onSelect?: (() => void) | undefined;
    onDelete?: ((draft: ICapture) => void) | undefined;
  } = $props();
  let isHovered = $state(false);
</script>

<button
  class="flex w-full justify-between items-center gap-2 p-2 hover:bg-bgs2 rounded-md h-10 min-h-10"
  use:hoverable={{
    onHover: (val) => {
      isHovered = val;
    }
  }}
  onclick={() => onSelect?.()}
>
  <div class="text-b2 font-medium text-fgs1 text-start">
    {draft.label ? draft.label : "Untitled"}
  </div>
  <div class="flex items-center gap-2">
    <div class="text-b3 text-fgs3 whitespace-nowrap">
      {parseAndFormatDate(new Date(draft.updatedAt))}
    </div>
    {#if isHovered || $context.isTouchDevice}
      <Button
        icon="trash"
        tooltip="Delete draft"
        size={Size.sm}
        type={ButtonVariant.DANGER}
        style={ButtonStyle.OUTLINED}
        onclick={(e) => {
          e.stopPropagation();
          onDelete?.(draft);
        }}
      />
    {/if}
  </div>
</button>
