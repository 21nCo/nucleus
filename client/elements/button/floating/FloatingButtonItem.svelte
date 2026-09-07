<script lang="ts">
  import { popover } from "@nucleum/actions/popover.action";
  import type { IButtonParams } from "@21n/elements/button/button.type";
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import Icon from "@21n/elements/Icon.svelte";
    let {
    param,
    index,
    length,
  }: {
    param: IButtonParams;
    index: number;
    length: number;
  } = $props();

  
  

  let contextMenuRef: HTMLElement;

  function hideContextMenu() {
    if (contextMenuRef) {
      contextMenuRef.dispatchEvent(new CustomEvent("hide"));
    }
  }
</script>

<button
  class={cn(
    "h-10 px-6 bg-aps1 text-abg flex justify-center items-center gap-1 hover:brightness-90",
    {
      "rounded-r-full": index === length - 1,
      "rounded-l-full": index === 0
    }
  )}
  bind:this={contextMenuRef}
  onclick={async () => {
    if (param.callback) await param?.callback();
  }}
  use:popover={{
    content: param.popoverAction?.content,
    placement: param.popoverAction?.placement,
    isRenderAsModalForCW: param.popoverAction?.isRenderAsModalForCW,
    id: `floating-button-popover-${index}`,
    componentProps: {
      ...(param.popoverAction?.componentProps ?? {}),
      onSelect: () => {
        hideContextMenu();
      }
    }
  }}
>
  <Icon icon={param.icon} size={Size.sm} class="text-abg" />
  <span class="text-b2">{param.label}</span>
</button>
{#if index !== length - 1}
  <div class="bg-aps1">
    <div class="h-full border-r border-abg opacity-30" />
  </div>
{/if}
