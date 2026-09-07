<script lang="ts">
  import { Size } from "@21n/types/size.enum";
  import { bg, cn } from "@21n/utils/ui.utils";
  import Icon from "@21n/elements/Icon.svelte";
  import type { IToolTipOptions } from "@21n/elements/text/text.type";
  import Badge from "@21n/elements/text/Badge.svelte";
  import { tooltip as tooltipAction } from "@nucleum/actions/popover.action";
  import { Placement } from "@21n/types/direction.enum";
  import type { IKeyboardShortcut } from "@nucleum/components/shortcuts/shortcut.type";
  import ShortcutText from "@21n/elements/text/ShortcutText.svelte";
  let {
    icon,
    on = $bindable(false),
    size = Size.md,
    parentBgIndex = 1,
    tooltip = undefined,
    tooltipOptions = undefined,
    isPreventFillOnActive = false,
    count = undefined,
    bgSize = Size.md,
    shortcut = undefined,
    isBoxed = false,
    isRenderAsDiv = false,
    isPassive = false,
    onChange = undefined,
    onMouseDown = undefined
  }: {
    icon: string;
    on?: boolean;
    size?: Size.sm | Size.md | Size.lg;
    parentBgIndex?: number;
    tooltip?: string | undefined;
    tooltipOptions?: IToolTipOptions | undefined;
    isPreventFillOnActive?: boolean;
    count?: number | undefined;
    bgSize?: Size.sm | Size.md | Size.lg;
    shortcut?: string | IKeyboardShortcut | undefined;
    isBoxed?: boolean;
    isRenderAsDiv?: boolean;
    isPassive?: boolean;
    onChange?: ((event: CustomEvent<boolean>) => void) | undefined;
    onMouseDown?: ((event: MouseEvent) => void) | undefined;
  } = $props();
  let isHovering = $state(false);
  function onclick() {
    if (isPassive) return;
    on = !on;
    onChange?.(new CustomEvent("change", { detail: on }));
  }
  function handleHover(value: boolean) {
    isHovering = value;
  }
  const shortcutSize = $derived(size === Size.lg ? Size.md : size);
</script>

<svelte:element
  this={isRenderAsDiv ? "div" : "button"}
  aria-label={tooltip}
  {onclick}
  onmousedown={(event: MouseEvent) => {
    onMouseDown?.(event);
  }}
  role={isRenderAsDiv && !isPassive ? "button" : undefined}
  tabindex={isRenderAsDiv && !isPassive ? 0 : undefined}
  onmouseenter={() => handleHover(true)}
  onmouseleave={() => handleHover(false)}
  onfocus={() => handleHover(true)}
  onblur={() => handleHover(false)}
  use:tooltipAction={{
    text: tooltip,
    direction: tooltipOptions?.placement ?? Placement.Bottom
  }}
  class={cn(
    "flex relative items-center justify-center",
    {
      "rounded-md": !isBoxed,
      "h-full w-full": isBoxed,
      [`${bg(parentBgIndex)}-striped`]: isHovering && !on,
      [bg(parentBgIndex)]: on
    },
    !isBoxed && {
      "min-h-8 min-w-8": bgSize === Size.sm || (!bgSize && size === Size.sm),
      "min-h-10 min-w-10": bgSize === Size.md || (!bgSize && size === Size.md),
      "min-h-12 min-w-12": bgSize === Size.lg || (!bgSize && size === Size.lg),
      [bg(parentBgIndex)]: isHovering || on
    }
  )}
>
  <Icon
    {icon}
    {size}
    isFilled={on && !isPreventFillOnActive}
    class={cn({
      "text-aps1": on,
      "text-fgs2": !on
    })}
  />
  {#if count}
    <div
      class={cn("absolute", {
        "bottom-1 right-1": bgSize !== Size.sm,
        "bottom-0 right-0": bgSize === Size.sm
      })}
    >
      <Badge text={count} size={Size.sm} />
    </div>
  {/if}
  {#if shortcut}
    <ShortcutText {shortcut} size={shortcutSize} {parentBgIndex} />
  {/if}
</svelte:element>
