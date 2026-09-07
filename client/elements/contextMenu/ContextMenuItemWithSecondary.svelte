<script lang="ts">
  import type { IContextMenuItem } from "@21n/elements/contextMenu/context-menu.type";
  import { Placement } from "@21n/elements/direction.enum";
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import ContextMenuItemBase from "@21n/elements/contextMenu/ContextMenuItemBase.svelte";
  import { popover } from "@nucleum/actions/popover.action";
  import { PopoverTriggerMethod } from "@nucleum/actions/popover.type";
  let {
    item,
    size = Size.md,
    onAction = undefined,
    onSelect = undefined
  }: {
    item: IContextMenuItem;
    size?: Size.sm | Size.md | Size.lg;
    onAction?: ((event: CustomEvent<unknown>) => void) | undefined;
    onSelect?: ((event: CustomEvent<unknown>) => void) | undefined;
  } = $props();
  let isPopoverVisible = $state(false);

  function handleSelect(value: unknown) {
    onSelect?.(new CustomEvent<unknown>("select", { detail: value }));
  }

  function handleAction(value: unknown) {
    onAction?.(new CustomEvent<unknown>("action", { detail: value }));
  }

  function handlePopoverChange(e: Event) {
    isPopoverVisible = (e as CustomEvent<{ open?: boolean }>).detail?.open ?? false;
  }
</script>

<button
  use:popover={{
    placement: Placement.Right,
    offsetInPx: 12,
    triggerMethod: [PopoverTriggerMethod.HOVER, PopoverTriggerMethod.CLICK],
    content: item.secondStepComponent?.component,
    isSecondary: true,
    componentProps: {
      onSelect: handleSelect,
      onAction: handleAction,
      ...item.secondStepComponent?.props
    },
    groupId: "contextMenuPopoverSecondaryScreen",
    id: "contextMenuPopoverSecondaryScreen",
    classForHoverDismissal: "contextmenuitem"
  }}
  onchange={handlePopoverChange}
  class={cn(
    "contextmenuitem flex items-center gap-2.5 justify-between hover:bg-bgs3 rounded-md",
    {
      "p-1.5": size === Size.sm,
      "p-2": size === Size.md,
      "px-3 py-2": size === Size.lg,
      "bg-bgs3": isPopoverVisible
    }
  )}
  data-context-menu-item-id={item.value}
>
  <ContextMenuItemBase {item} />
</button>
