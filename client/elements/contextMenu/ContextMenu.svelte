<script lang="ts">
  import type { IContextMenuGroup, IContextMenuItem } from "@21n/elements/contextMenu/context-menu.type";
  import { Size } from "@21n/elements/size.enum";
  import { bg, cn } from "@21n/utils/ui.utils";
  import Divider from "@21n/elements/Divider.svelte";
  import Text from "@21n/elements/text/Text.svelte";
  import { TextStyle } from "@21n/elements/text/text.enum";
  import ContextMenuItem from "@21n/elements/contextMenu/ContextMenuItem.svelte";
  import { ColorStrength } from "@21n/theme/appearance.type";
  import view from "@nucleum/stores/view.store";
  let {
    menuResolver,
    size = Size.md,
    heading = undefined,
    onSelect = () => {},
    parentBgIndex = 1,
    isFullWidth = $view.isConstrainedWidth,
    bottomRender = undefined
  }: {
    menuResolver: () => IContextMenuGroup[];
    size?: Size.sm | Size.md | Size.lg | Size.xl;
    heading?: string | undefined;
    onSelect?: (item: IContextMenuItem) => void;
    parentBgIndex?: number;
    isFullWidth?: boolean;
    bottomRender?: string | undefined;
  } = $props();
  const menu = $derived<IContextMenuGroup[]>(menuResolver ? menuResolver() : []);

  function resolveItemSize() {
    return size === Size.xl ? Size.lg : size;
  }
</script>

<div
  class={cn(
    "flex flex-col gap-1 p-1 rounded-md",
    {
      [bg(parentBgIndex)]: !$view.isConstrainedWidth,
      "w-full": isFullWidth,
      "border border-brs2": !isFullWidth,
      "text-b3": size === Size.sm,
      "text-b2": size === Size.md || size === Size.lg || size === Size.xl
    },
    !isFullWidth && {
      "w-48": size === Size.sm,
      "w-56": size === Size.md,
      "w-64": size === Size.lg,
      "w-72": size === Size.xl
    }
  )}
>
  {#if heading}
    <span
      class={cn("w-full px-2 text-left", {
        "px-1.5": size === Size.sm,
        "px-2": size === Size.md,
        "px-3": size === Size.lg
      })}
    >
      <Text content={heading} style={TextStyle.SECTION_HEADING_SMALL} />
    </span>
  {/if}
  {#each menu as group, index}
    <div
      class={cn("flex", {
        "flex-col": !group.isToggleGroup,
        "flex-row justify-around p-2 gap-2": group.isToggleGroup
      })}
    >
      {#each group.items as item}
        <ContextMenuItem
          {item}
          size={resolveItemSize()}
          isToggleGroup={group.isToggleGroup}
          {parentBgIndex}
          onSelect={() => onSelect(item)}
        />
      {/each}
    </div>
    {#if index !== menu.length - 1}
      <Divider colorStrength={ColorStrength.Strong} />
    {/if}
  {/each}
  {#if bottomRender}
    {@html bottomRender}
  {/if}
</div>
