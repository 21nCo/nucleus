<script lang="ts">
  import type { InputLabel } from "@21n/elements/input/input.type";
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import Badge from "@21n/elements/text/Badge.svelte";
  import FormLabelTooltip from "@21n/elements/text/formLabel/FormLabelTooltip.svelte";
    let {
    props,
    forId = "",
    isCursorPointer = false,
    isWrapText = false,
  }: {
    props: InputLabel;
    forId?: string;
    isCursorPointer?: boolean;
    isWrapText?: boolean;
  } = $props();

  
  
  
</script>

<label
  class={cn("flex gap-2 items-center max-w-full", {
    "cursor-pointer": isCursorPointer
  })}
  for={forId}
>
  <div
    class={cn("text-fgs2 text-b2 min-w-fit whitespace-nowrap text-left", {
      "text-wrap": isWrapText
    })}
  >
    {props.label}
  </div>
  {#if props.tooltip && props.tooltip.body}
    <FormLabelTooltip info={props.tooltip} />
  {/if}
  {#if props.isMarkRequired}
    <div class="text-ars1">*</div>
  {/if}
  {#if props.badge}
    <Badge text={props.badge} size={Size.sm} />
  {/if}
</label>
