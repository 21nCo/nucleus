<script lang="ts">
  import type { Snippet } from "svelte";
  import type { MouseEventHandler } from "svelte/elements";
  import { Size } from "@21n/types/size.enum";
  import Icon from "@21n/elements/Icon.svelte";
  import { ButtonStyle, ButtonVariant } from "@21n/types/button.type";
  import { Placement } from "@21n/types/direction.enum";
  import { bg, cn } from "@21n/utils/ui.utils";
  import type { IPopoverRenderBaseParams } from "@21n/types/popover.type";
  import Badge from "@21n/elements/text/Badge.svelte";
  import { hoverable } from "@nucleum/actions/hover.action";
  import { popover } from "@nucleum/actions/popover.action";
  import ShortcutText from "@21n/elements/text/ShortcutText.svelte";
  import type { IKeyboardShortcut } from "@21n/types/shortcut.type";
  import { PopoverTriggerMethod } from "@21n/types/popover.type";
  import ButtonTooltip from "@21n/elements/button/ButtonTooltip.svelte";
  import context from "@nucleum/stores/context.store";

  let {
    parentBgIndex = 1,
    label = undefined,
    class: className = "",
    variant = ButtonVariant.SECONDARY,
    type: buttonType = undefined,
    size = Size.md,
    isExpandToFullWidth = false,
    style = ButtonStyle.DEFAULT,
    icon = undefined,
    isDisabled = false,
    tooltip = undefined,
    isPreventMinWidth = false,
    tooltipOptions = {
      placement: Placement.BottomCenter,
      offsetInPx: 4,
      isSpanToTriggerWidth: false,
      isUseAbsolutePositioning: false
    },
    isLoading = false,
    isUnderlined = false,
    id = "",
    ariaLabel = undefined,
    testId = undefined,
    isHovering = $bindable(false),
    shortcut = undefined,
    badge = undefined,
    isBoxed = false,
    onclick = undefined,
    onmousedown = undefined,
    children = undefined
  }: {
    parentBgIndex?: number;
    label?: string | undefined;
    class?: string;
    variant?: ButtonVariant;
    type?: "primary" | "secondary" | "danger" | ButtonVariant | undefined;
    size?: Size.xs | Size.sm | Size.md | Size.lg;
    isExpandToFullWidth?: boolean;
    style?: ButtonStyle;
    icon?: string | undefined;
    isDisabled?: boolean;
    tooltip?: string | undefined;
    isPreventMinWidth?: boolean;
    tooltipOptions?: IPopoverRenderBaseParams;
    isLoading?: boolean;
    isUnderlined?: boolean;
    id?: string;
    ariaLabel?: string | undefined;
    testId?: string | undefined;
    isHovering?: boolean;
    shortcut?: string | IKeyboardShortcut | undefined;
    badge?: string | undefined;
    isBoxed?: boolean;
    onclick?: MouseEventHandler<HTMLButtonElement> | undefined;
    onmousedown?: MouseEventHandler<HTMLButtonElement> | undefined;
    children?: Snippet | undefined;
  } = $props();

  let buttonRef: any;
  const hasDefaultContent = $derived(!!children);
  const type = $derived(
    (buttonType ?? variant) as
      | "primary"
      | "secondary"
      | "danger"
      | ButtonVariant
  );
  const isIconOnlyButton = $derived(!label && !hasDefaultContent);
  const shortcutSize = $derived(size === Size.xs ? Size.sm : Size.md);
  const iconSize = $derived(size === Size.xs ? Size.sm : size);
  const iconClass = $derived({
    "text-aps1":
      (style === ButtonStyle.OUTLINED && type === ButtonVariant.PRIMARY) ||
      (isHovering &&
        style === ButtonStyle.PLAIN &&
        type === ButtonVariant.SECONDARY),
    "text-ars1":
      (style === ButtonStyle.OUTLINED ||
        style === ButtonStyle.PLAIN ||
        (isIconOnlyButton && style === ButtonStyle.DEFAULT)) &&
      type === ButtonVariant.DANGER,
    "text-fgs2": type === ButtonVariant.SECONDARY,
    "text-abg":
      style === ButtonStyle.DEFAULT &&
      (type === ButtonVariant.PRIMARY || type === ButtonVariant.DANGER),
    "text-fgs1":
      style === ButtonStyle.DEFAULT &&
      type === ButtonVariant.SECONDARY &&
      isHovering
  });

  function invokeMouseHandler(
    handler: MouseEventHandler<HTMLButtonElement> | undefined,
    event: Parameters<NonNullable<MouseEventHandler<HTMLButtonElement>>>[0]
  ) {
    if (typeof handler === "function") {
      handler(event);
    }
  }
</script>

<button
  {id}
  aria-label={ariaLabel}
  data-testid={testId}
  use:hoverable={{
    onHover: (val) => {
      queueMicrotask(() => {
        isHovering = val;
      });
    }
  }}
  type="button"
  class={cn(
    "relative flex flex-row justify-center items-center",
    {
      "w-full": isExpandToFullWidth,
      "opacity-70 cursor-not-allowed hover:opacity-50": isDisabled || isLoading,
      "gap-4 text-base": size === Size.lg,
      "gap-2 text-b2 dp:text-base": size === Size.md,
      "gap-2 text-b3 dp:text-b2": size === Size.sm,
      "gap-1 text-b4 dp:text-b3": size === Size.xs,
      "p-1.5 rounded-md": isIconOnlyButton && !isBoxed,
      "w-full h-full": isBoxed,
      "rounded-md": !isBoxed && !$context.experiments?.isEnableRoundedMain,
      "rounded-full": !isBoxed && $context.experiments?.isEnableRoundedMain,
      [bg(parentBgIndex)]:
        isHovering && isIconOnlyButton && style !== ButtonStyle.PLAIN,
      "underline-dotted hover:underline-dotted-primary":
        style === ButtonStyle.PLAIN && isUnderlined
    },
    style === ButtonStyle.PLAIN && {
      "text-fgs2 hover:text-aps1": type === ButtonVariant.SECONDARY,
      "text-aps1 hover:brightness-110": type === ButtonVariant.PRIMARY,
      "text-ars1 hover:brightness-110": type === ButtonVariant.DANGER
    },
    style !== ButtonStyle.PLAIN &&
      !isPreventMinWidth &&
      !isIconOnlyButton && {
        "min-w-32": size === Size.lg || size === Size.md || size === Size.sm,
        "min-w-fit": size === Size.xs
      },
    style !== ButtonStyle.PLAIN &&
      !isBoxed &&
      !isIconOnlyButton && {
        "shadow--md": true,
        "h-12 py-4 px-6": size === Size.lg,
        "h-10 py-3 px-5": size === Size.md,
        "h-8 py-2 px-4": size === Size.sm,
        "h-6 py-1 px-2": size === Size.xs
      },
    style === ButtonStyle.DEFAULT &&
      !isIconOnlyButton && [
        {
          "hover:brightness-110 text-abg":
            type === ButtonVariant.PRIMARY || type === ButtonVariant.DANGER,
          "bg-aps1": type === ButtonVariant.PRIMARY,
          "bg-ars1": type === ButtonVariant.DANGER,
          "border border-transparent hover:border-brs3":
            type === ButtonVariant.SECONDARY && !isBoxed,
          [bg(parentBgIndex + 1)]: type === ButtonVariant.SECONDARY,
          [`hover:${bg(parentBgIndex + 2)}-striped`]:
            type === ButtonVariant.SECONDARY
        }
      ],
    style === ButtonStyle.OUTLINED && [
      {
        border: !isBoxed,
        "border-aps2 bg-aps3 text-aps1 hover:bg-aps2-striped hover:border-aps1":
          type === ButtonVariant.PRIMARY,
        "border-brs3 text-fgs2 hover:text-fgs1":
          type === ButtonVariant.SECONDARY,
        [`${bg(parentBgIndex)}-striped`]:
          type === ButtonVariant.SECONDARY && isHovering,
        "border-ars1 text-ars1": type === ButtonVariant.DANGER
      }
    ],
    className
  )}
  onclick={(event) => {
    invokeMouseHandler(onclick, event);
  }}
  onmousedown={(event) => {
    invokeMouseHandler(onmousedown, event);
  }}
  bind:this={buttonRef}
  use:popover={{
    content: tooltip ? ButtonTooltip : "",
    triggerMethod: tooltip ? [PopoverTriggerMethod.HOVER] : [],
    placement: tooltipOptions.placement,
    offsetInPx: tooltipOptions.offsetInPx,
    isSecondary: true,
    id: `button-tooltip-popover-${id || "default"}`,
    componentProps: tooltip
      ? {
          tooltip,
          shortcut,
          size: shortcutSize,
          parentBgIndex
        }
      : {}
  }}
  disabled={isDisabled || isLoading}
>
  {#if isLoading}
    <Icon
      icon="svg-spinners:bars-scale-fade"
      class={cn(iconClass)}
      size={iconSize}
    />
  {:else}
    {#if icon}
      <Icon {icon} size={iconSize} class={cn(iconClass)} />
    {/if}
    {#if label}
      <div class="min-w-fit whitespace-nowrap">
        {label}
      </div>
      <ShortcutText
        {shortcut}
        size={shortcutSize}
        parentBgIndex={style === ButtonStyle.PLAIN
          ? parentBgIndex
          : style === ButtonStyle.OUTLINED && type !== ButtonVariant.PRIMARY
            ? parentBgIndex + 1
            : undefined}
        isAccentOutlined={style === ButtonStyle.OUTLINED &&
          type === ButtonVariant.PRIMARY}
      />
      {#if badge}
        <Badge text={badge} />
      {/if}
    {:else}
      {@render children?.()}
    {/if}
  {/if}
</button>
