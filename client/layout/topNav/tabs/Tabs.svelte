<svelte:options runes={true} />

<script lang="ts">
  import TopBarResourceItem from "@21n/layout/topNav/tabs/TopBarResourceItem.svelte";
  import { tabs } from "@21n/layout/topNav/tabs/tabs.store";
  import { moveItemInArray } from "@21n/shared-utils/obj.utils";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import Button from "@21n/elements/button/Button.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import { ButtonStyle } from "@21n/elements/button/button.type";
  let {
    pinnedItems,
    isShowHome = false,
    activeTab = null,
    onHome
  }: {
    pinnedItems: IRecordId[];
    isShowHome?: boolean;
    activeTab?: string | null;
    onHome?: (value: boolean) => void;
  } = $props();
</script>

<div
  class={cn("flex gap--2 pr-8 h-full items-center overflow-x-auto", {
    grow: pinnedItems.length > 0
  })}
>
  {#if isShowHome}
    <div
      class={cn("flex justify-center items-center px-2 border-r border-brs3", {
        "bg-bgs1": !activeTab
      })}
    >
      <Button
        icon="ph:house"
        style={ButtonStyle.PLAIN}
        onclick={() => {
          onHome?.(true);
        }}
      />
    </div>
  {/if}
  {#each pinnedItems as item, index (item)}
    <TopBarResourceItem
      {item}
      onClick={() => {
        onHome?.(false);
        tabs.activate(item);
      }}
      onRearrange={(displacement) => {
        pinnedItems = moveItemInArray(
          pinnedItems,
          index,
          displacement > 0 ? 1 : -1
        );
      }}
      onRearranged={() => {
        tabs.rearrange(pinnedItems);
      }}
    />
  {/each}
</div>
