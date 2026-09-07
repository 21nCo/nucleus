<script lang="ts">
  import { hoverable } from "@nucleum/actions/hover.action";
  import { cn } from "@21n/utils/ui.utils";
  import { truncateString } from "@21n/shared-utils/text.utils";
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/types/size.enum";
  import Badge from "@21n/elements/text/Badge.svelte";
  import type { IAvatar } from "@21n/types/avatar.type";
  import AvatarRenderer from "@21n/elements/avatarPicker/AvatarRenderer.svelte";
  import type { IRecordId } from "@21n/types/data.type";
  import { Placement } from "@21n/types/direction.enum";
  import context from "@nucleum/stores/context.store";
  import type { IKeyboardShortcut } from "@21n/types/shortcut.type";
  import ShortcutText from "@21n/elements/text/ShortcutText.svelte";

  let {
    label,
    parentBgIndex = 1,
    icon = undefined,
    size = Size.md,
    isRemovable = true,
    isActive = false,
    count = undefined,
    shortcut = undefined,
    id = undefined,
    isShowExpandFeedbackOnActive = false,
    expandFeedbackPosition = Placement.BottomCenter,
    removeStyle = "inline",
    onclick = undefined,
    onRemove = undefined
  }: {
    label: string;
    parentBgIndex?: number;
    icon?: string | IAvatar | undefined;
    size?: Size.sm | Size.md;
    isRemovable?: boolean;
    isActive?: boolean;
    count?: number | undefined;
    shortcut?: string | IKeyboardShortcut | undefined;
    id?: IRecordId | undefined;
    isShowExpandFeedbackOnActive?: boolean;
    expandFeedbackPosition?:
      | Placement.BottomCenter
      | Placement.BottomLeft
      | Placement.BottomRight;
    removeStyle?: "overlay" | "inline" | "always-show";
    onclick?: ((event: MouseEvent) => void) | undefined;
    onRemove?: (() => void) | undefined;
  } = $props();
  let isHovering = false;
  const isRemoveIconRenderedInline = $derived(
    isRemovable &&
      ($context.isTouchDevice ||
        removeStyle === "always-show" ||
        (removeStyle === "inline" && isHovering))
  );
</script>

<div class="overflow-hidden">
  <button
    type="button"
    aria-label={label}
    data-testid={`tag:${id}`}
    class={cn(
      "relative flex gap-2 items-center justify-center whitespace-nowrap border min-w-20",
      {
        "text-b3 px-2 py-0.5 rounded-md": size === Size.sm,
        "text-b2 pl-4 pr-2 py-1 rounded-full": size === Size.md,
        "pr-4": size === Size.md && !isRemoveIconRenderedInline,
        "border-brs3 hover:border-fgs4": !isActive,
        "border-aps1": isActive
      }
    )}
    id={id?.toString()}
    onclick={(event) => {
      onclick?.(event);
    }}
    use:hoverable={{
      onHover: (value) => (isHovering = value)
    }}
  >
    {#if icon && typeof icon === "string"}
      <Icon {icon} size={Size.sm} />
    {:else if icon && typeof icon === "object"}
      <AvatarRenderer avatar={icon} size={Size.sm} />
    {/if}
    {label ? truncateString(label, 24) : ""}
    {#if count !== undefined}
      <Badge text={count} size={size === Size.sm ? Size.xs : Size.sm} />
    {/if}
    {#if shortcut}
      <ShortcutText {shortcut} {size} {parentBgIndex} />
    {/if}
    {#if isRemoveIconRenderedInline}
      <span
        role="button"
        tabindex="0"
        aria-label="Remove"
        data-testid={`tag-remove:${id}`}
        class={cn("rounded-full flex h-full items-center", {
          "from-bgs1 via-bgs1": parentBgIndex === 1,
          "from-bgs2 via-bgs2": parentBgIndex === 2,
          "from-bgs3 via-bgs3": parentBgIndex === 3,
          "absolute top-0 right-0 bg-gradient-to-l  to-transparent pr-2 pl-3":
            removeStyle === "overlay",
          "active:bg-bgs2 notouch:hover:bg-bgs2":
            removeStyle === "inline" || removeStyle === "always-show"
        })}
        onmousedown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onpointerdown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onclick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove?.();
        }}
        onkeydown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            onRemove?.();
          }
        }}
      >
        <Icon icon="cross" />
      </span>
    {/if}
    {#if isActive && isShowExpandFeedbackOnActive}
      <svg
        width="16"
        height="10"
        viewBox="0 0 16 10"
        class={cn("absolute -bottom-[5px] -translate-x-1/2", {
          "left-1/4": expandFeedbackPosition === Placement.BottomLeft,
          "right-1/4": expandFeedbackPosition === Placement.BottomRight,
          "left-1/2": expandFeedbackPosition === Placement.BottomCenter
        })}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M2 7C2 7 4.5 7 8 7C11.5 7 14 7 14 7L8 1L2 7Z"
          class="stroke-aps1 fill-bgs1"
          stroke-width="1.2"
          stroke-linejoin="round"
        />
      </svg>
    {/if}
  </button>
</div>
