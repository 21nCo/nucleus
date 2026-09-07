<script lang="ts">
  import type { MouseEventHandler } from "svelte/elements";
  import { Size } from "@21n/elements/size.enum";
  import { bg, cn } from "@21n/utils/ui.utils";
  import Icon from "../Icon.svelte";
  import { popover } from "@nucleum/actions/popover.action";
  import { ButtonVariant } from "@21n/elements/button/button.type";
  import type { IKeyboardShortcut } from "@21n/elements/keyboard/shortcut.type";
  import ButtonTooltip from "@21n/elements/button/ButtonTooltip.svelte";
  import ShortcutText from "../text/ShortcutText.svelte";
  import { PopoverTriggerMethod } from "@nucleum/actions/popover.type";
  import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";

  let {
    icon = undefined,
    tooltip = undefined,
    label = undefined,
    size = Size.md,
    parentBgIndex = 1,
    width = "",
    type = ButtonVariant.SECONDARY,
    shortcut = undefined,
    testId = undefined,
    ariaLabel = undefined,
    onclick = undefined
  }: {
    icon?: string | undefined;
    tooltip?: string | undefined;
    label?: string | undefined;
    size?: Size.xs | Size.sm | Size.md | Size.lg;
    parentBgIndex?: number;
    width?: string;
    type?: ButtonVariant;
    shortcut?: string | IKeyboardShortcut | undefined;
    testId?: string | undefined;
    ariaLabel?: string | undefined;
    onclick?: MouseEventHandler<HTMLButtonElement> | undefined;
  } = $props();

  const id = generateSimpleRandomId();
</script>

<button
  aria-label={ariaLabel ?? tooltip}
  data-testid={testId}
  class={cn(
    "flex gap-1 justify-center h-full w-full items-center",
    width,
    `hover:${bg(parentBgIndex)}-striped`,
    {
      "text-b2": size === Size.md,
      "text-b3": size === Size.sm,
      "text-ars1": type === ButtonVariant.DANGER
    }
  )}
  onclick={(event) => {
    event.stopPropagation();
    onclick?.(event);
  }}
  use:popover={{
    content: tooltip ? ButtonTooltip : "",
    triggerMethod: tooltip ? [PopoverTriggerMethod.HOVER] : [],
    // placement: tooltipOptions.placement,
    isSecondary: true,
    id: `button-tooltip-popover-${id}`,
    componentProps: tooltip
      ? {
          tooltip,
          shortcut,
          parentBgIndex,
          size: Size.sm
        }
      : {}
  }}
>
  {#if icon}
    <Icon
      {icon}
      size={size ?? Size.md}
      class={cn({
        "text-ars1": type === ButtonVariant.DANGER
      })}
    />
  {/if}
  {#if label}
    {label}
  {/if}
  {#if label && shortcut}
    <ShortcutText {shortcut} size={Size.sm} parentBgIndex={parentBgIndex + 1} />
  {/if}
</button>
