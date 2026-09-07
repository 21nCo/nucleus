<script lang="ts">
  import { Size } from "@21n/elements/size.enum";
  import { trackPosition } from "@nucleum/actions/observe.action";
  import Icon from "@21n/elements/Icon.svelte";
  import { Placement } from "@21n/elements/direction.enum";
  import Tooltip from "@21n/elements/text/Tooltip.svelte";
  import type { InputLabelInfoToolTip } from "@21n/elements/input/input.type";
  import { popover } from "@nucleum/actions/popover.action";
  import { PopoverTriggerMethod } from "@nucleum/actions/popover.type";
  import view from "@nucleum/stores/view.store";
    let {
    info,
    icon = "info",
  }: {
    info: InputLabelInfoToolTip;
    icon?: string;
  } = $props();

  
  let ref: HTMLElement;

  function resolveIconSize(size: Size | undefined): Size.sm | Size.md | Size.lg {
    if (size === Size.lg) return Size.lg;
    if (size === Size.md) return Size.md;
    return Size.sm;
  }

  function closeTooltip() {
    ref?.dispatchEvent(new CustomEvent("hide"));
  }
</script>

<button
  class="relative rounded-full w-fit h-fit flex justify-center items-center text-b3 text-fgs3 cursor-pointer active:bg-bgs2 notouch:hover:bg-bgs2"
  use:trackPosition={{
    callback: closeTooltip
  }}
  bind:this={ref}
  onclick={(event) => event.stopPropagation()}
  use:popover={{
    content: Tooltip,
    triggerMethod: $view.isConstrainedWidth
      ? [PopoverTriggerMethod.CLICK]
      : [PopoverTriggerMethod.CLICK, PopoverTriggerMethod.HOVER],
    placement: info.placement ?? Placement.Right,
    isRenderAsModalForCW: true,
    id: "form-label-tooltip-popover",
    componentProps: {
      info,
      onClose: closeTooltip
    }
  }}
>
  <Icon {icon} size={resolveIconSize(info.size)} class="text-fgs3" />
</button>
