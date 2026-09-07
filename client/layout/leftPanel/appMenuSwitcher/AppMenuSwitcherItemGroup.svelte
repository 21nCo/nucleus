<svelte:options runes={true} />

<script lang="ts">
  import { cn } from "@21n/utils/ui.utils";
  import { LayoutContext } from "@21n/layout/layout-mode.type";
  import AppMenuSwitcherItem from "@21n/layout/leftPanel/appMenuSwitcher/AppMenuSwitcherItem.svelte";
  import type { IAction } from "@nucleum/application/commandBar/action.type";
  import { appStore } from "@nucleum/stores/app.store";
  let {
    items,
    layoutContext,
    parentBackgroundIndex,
    onClick
  }: {
    items: IAction[];
    layoutContext: LayoutContext;
    parentBackgroundIndex: number;
    onClick?: (item: IAction) => void;
  } = $props();
</script>

<div
  class={cn("flex flex-col", {
    "gap-2 items-center": layoutContext === LayoutContext.THIN_WITH_LABEL,
    "gap-1": layoutContext !== LayoutContext.THIN_WITH_LABEL,
    "px-1":
      $appStore.currentComponent?.panel &&
      layoutContext !== LayoutContext.THIN_WITH_LABEL
  })}
>
  {#each items as item (item.action)}
    <AppMenuSwitcherItem
      {parentBackgroundIndex}
      {layoutContext}
      {item}
      onClick={() => onClick?.(item)}
    />
  {/each}
</div>
