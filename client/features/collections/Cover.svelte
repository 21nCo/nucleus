<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import { ButtonVariant } from "@21n/elements/button/button.type";
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import CoverRenderer from "@21n/elements/coverPicker/CoverRenderer.svelte";
  import Icon from "@21n/elements/Icon.svelte";
  import ToggleGroup from "@21n/elements/toggle/ToggleGroup.svelte";
  import type { ICoverLayout } from "@nucleum/features/collections/collection.type";
  import { Placement } from "@21n/elements/direction.enum";
  import { hoverable } from "@nucleum/actions/hover.action";
  import type { IImageRepositionerOptions } from "@nucleum/features/files/file.type";
  import { resizable } from "@nucleum/actions/resize.action";
  import view from "@nucleum/stores/view.store";
  import { debouncer } from "@21n/utils/utils";
  import context from "@nucleum/stores/context.store";

  let {
    cover = $bindable(),
    placement = Placement.Top,
    position = {},
    size = {},
    dev_isRoundedCover = false,
    isInEditMode = false,
    isCoverPickerOpen = $bindable(false),
    isHovered = $bindable(false),
    isConstrainedWidth = false,
    onChange,
    onPlacement,
    onReposition,
    onRepositionDebounced,
    onResize: onResizeCallback,
    onResizeDebounced: onResizeDebouncedCallback
  }: {
    cover?: string | undefined;
    placement?: Placement;
    position?: { x?: number; y?: number };
    size?: { width?: number; height?: number };
    dev_isRoundedCover?: boolean;
    isInEditMode?: boolean;
    isCoverPickerOpen?: boolean;
    isHovered?: boolean;
    isConstrainedWidth?: boolean;
    onChange?: ((event: CustomEvent<string | undefined>) => void) | undefined;
    onPlacement?: ((event: CustomEvent<Placement>) => void) | undefined;
    onReposition?: ((event: CustomEvent<number>) => void) | undefined;
    onRepositionDebounced?: ((event: CustomEvent<number>) => void) | undefined;
    onResize?: ((event: CustomEvent<any>) => void) | undefined;
    onResizeDebounced?: ((event: CustomEvent<any>) => void) | undefined;
  } = $props();

  let isPositionable = $derived(
    (cover?.toString().includes("file:") ||
      cover?.toString().includes("unsplash_")) &&
      isInEditMode
  );

  let height = $derived(
    isConstrainedWidth ? 180 : size?.height ?? $view.height / 5
  );

  function onReplace(e: MouseEvent) {
    isCoverPickerOpen = true;
    if (e instanceof MouseEvent) e.stopPropagation();
  }

  function onClose(e: MouseEvent) {
    isCoverPickerOpen = false;
    if (e instanceof MouseEvent) e.stopPropagation();
  }

  function onRemove(e: MouseEvent) {
    cover = undefined;
    onChange?.(
      new CustomEvent("change", {
        detail: cover
      })
    );
    if (e instanceof MouseEvent) e.stopPropagation();
  }

  function onClick(e: MouseEvent) {
    if (!cover) {
      isCoverPickerOpen = true;
    }
    e.stopPropagation();
  }

  function onPlacementChange(e: CustomEvent) {
    onPlacement?.(
      new CustomEvent("placement", {
        detail: e.detail
      })
    );
  }

  function onHoverChange(value: boolean) {
    isHovered = value;
  }

  function resolveRespositionParams(
    placement: Placement,
    isPositionable: boolean | undefined
  ): IImageRepositionerOptions {
    if (placement === Placement.Left || placement === Placement.Right) {
      return {
        axis: "x",
        enabled: isPositionable,
        initialPosition: position?.x ?? 50
      };
    } else {
      return {
        axis: "y",
        enabled: isPositionable,
        initialPosition: position?.y ?? 50
      };
    }
  }

  function resolveResizeParams(placement: Placement, isInEditMode: boolean) {
    if (!isInEditMode || !cover || $context.isTouchDevice)
      return {
        enabled: false
      };
    return {
      enabled: true,
      minWidth: 220,
      minHeight: 100,
      maxWidth: 400,
      maxHeight: 400,
      edges:
        placement === Placement.Top || !placement
          ? (["bottom"] as ("bottom")[])
          : placement === Placement.Right
            ? (["left"] as ("left")[])
            : (["right"] as ("right")[]),
      onResize: handleResize
    };
  }

  function handleResize(e: any) {
    onResizeCallback?.(
      new CustomEvent("resize", {
        detail: e
      })
    );
    debouncedResizePropagation(e);
  }

  const debouncedResizePropagation = debouncer((e: any) => {
    onResizeDebouncedCallback?.(
      new CustomEvent("resizeDebounced", {
        detail: e
      })
    );
  }, 1000);
</script>

<!-- TODO - Cover photo popover with upload, from link, solid colors, graphics and unsplash options -->
{#if (cover && !isInEditMode) || isInEditMode}
  <button
    class={cn("relative flex justify-center items-center", {
      "bg-bgs2 bg-opacity-50 cursor-pointer": !cover,
      "border-y border-y-brs3": !cover || isInEditMode,
      "cursor-default": cover,
      "px-4 pt-4": dev_isRoundedCover,
      "h--72 min-h--[18rem] w-full": placement === Placement.Top || !placement,
      "w--72 min-w--[18rem] h-full":
        placement === Placement.Left || placement === Placement.Right,
      "cursor-move": isPositionable
    })}
    style={placement === Placement.Top || !placement
      ? `min-height: ${height}px; max-height: ${height}px;`
      : `min-width: ${size?.width ?? 300}px; max-width: ${size?.width ?? 300}px;`}
    onclick={onClick}
    use:hoverable={{ onHover: onHoverChange }}
    use:resizable={resolveResizeParams(placement, isInEditMode)}
  >
    {#if cover}
      <CoverRenderer
        repositionParams={resolveRespositionParams(placement, isPositionable)}
        {cover}
        isLazyLoad={false}
        class={cn({
          "rounded-xl": dev_isRoundedCover
        })}
        onReposition={onReposition}
        onRepositionDebounced={onRepositionDebounced}
      />
    {:else if isInEditMode}
      + Add cover photo
    {/if}
    {#if isInEditMode && cover}
      {#if isPositionable && !isConstrainedWidth}
        <span
          class="absolute flex gap-1 items-center text-fgs1 bg-bgs2 bg-opacity-60 dark:bg-opacity-50 py-1 px-2 rounded-md backdrop-blur-sm dark:backdrop-blur-none"
        >
          <Icon icon="grab" class="stroke-fgs1" size={Size.sm} />
          Pan to reposition</span
        >
      {/if}
      <div
        class={cn(
          "absolute custom--gradient items-center gap-2 bottom-0 pb-3 pt-4 px-4 cursor-default",
          {
            "flex-col pt-8 mx-auto":
              placement === Placement.Left || placement === Placement.Right,
            "right-0": placement === Placement.Top
          }
        )}
      >
        <span
          class={cn("flex gap-3", {
            "flex-col":
              placement === Placement.Left || placement === Placement.Right,
            "items-center": placement === Placement.Top
          })}
        >
          {#if !isConstrainedWidth}
            <span class="flex gap-3 items-center bg-bgs2 rounded-full px-4">
              <span class="text-fgs2 text-b2"> Layout </span>
              <ToggleGroup
                size={Size.sm}
                bgSize={Size.sm}
                selected={placement}
                onChange={onPlacementChange}
                parentBgIndex={2}
                class="gap-1"
                items={[
                  {
                    value: Placement.Left,
                    icon: "ph:align-left-simple-light"
                  },
                  {
                    value: Placement.Top,
                    icon: "ph:align-top-simple-light"
                  },
                  {
                    value: Placement.Right,
                    icon: "ph:align-right-simple-light"
                  }
                ]}
              />
            </span>
          {/if}
          <Button
            label={isCoverPickerOpen ? "Close" : "Replace"}
            icon={isCoverPickerOpen ? "x-circle" : "reset"}
            size={Size.sm}
            onclick={isCoverPickerOpen ? onClose : onReplace}
          />
          <Button
            label="Remove"
            icon="trash"
            type={ButtonVariant.DANGER}
            size={Size.sm}
            onclick={onRemove}
          />
        </span>
      </div>
    {/if}
  </button>
{/if}

<style>
  .custom-gradient {
    background-image: linear-gradient(
        to top,
        rgba(var(--colors-fgs1), 0.8) 0%,
        rgba(var(--colors-fgs1), 0.7) 10%,
        rgba(var(--colors-fgs1), 0.6) 20%,
        rgba(var(--colors-fgs1), 0.5) 30%,
        rgba(var(--colors-fgs1), 0.4) 40%,
        rgba(var(--colors-fgs1), 0.3) 50%,
        rgba(var(--colors-fgs1), 0.2) 60%,
        rgba(var(--colors-fgs1), 0.15) 70%,
        rgba(var(--colors-fgs1), 0.075) 80%,
        rgba(var(--colors-fgs1), 0.05) 85%,
        rgba(var(--colors-fgs1), 0.025) 90%,
        rgba(var(--colors-fgs1), 0.0125) 92%,
        rgba(var(--colors-fgs1), 0.00625) 94%,
        rgba(var(--colors-fgs1), 0.00312) 96%,
        rgba(var(--colors-fgs1), 0.00078125) 98%,
        rgba(var(--colors-fgs1), 0) 100%
      ),
      repeating-conic-gradient(
        rgba(var(--colors-fgs1), 0.02) 0% 25%,
        transparent 0% 50%
      );
    background-size:
      100% 100%,
      4px 4px;
    background-blend-mode: normal, overlay;
  }
</style>
