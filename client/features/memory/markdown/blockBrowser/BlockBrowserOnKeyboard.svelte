<script lang="ts">
  import {
    calloutBrowserItem,
    codeBrowserItem,
    quoteBrowserItem
  } from "@nucleum/features/memory/markdown/blockBrowser/blockBrowser.utils";
  import type { IBlockBrowserItem } from "@nucleum/features/memory/markdown/blockBrowser/blockBrowser.type";
  import { Size } from "@21n/types/size.enum";
  import { NodeType } from "@nucleum/features/memory/node/node.type";
  import BlockBrowserKeyboardItem from "@nucleum/features/memory/markdown/blockBrowser/BlockBrowserKeyboardItem.svelte";
  import ScrollViewBottomSpacer from "@21n/layout/scrollView/ScrollViewBottomSpacer.svelte";
  import { fly } from "svelte/transition";

  let {
    configData,
    selectedSection,
    onSelect = undefined
  }: {
    configData: any;
    selectedSection: string;
    onSelect?: ((type: NodeType) => void) | undefined;
  } = $props();
  const notAvailableOnMobile = [NodeType.CODE];
  const itemsClass =
    "w-full grid gap-3 grid-cols-[repeat(auto-fill,minmax(100px,1fr))]";
  const shorterItemsClass =
    "w-full grid gap-3 grid-cols-[repeat(auto-fill,minmax(80px,1fr))]";

  function handleSelect(type: IBlockBrowserItem["type"]) {
    onSelect?.(type as NodeType);
  }

  const items = $derived(
    configData.config
      .find((section: any) => section.section === selectedSection)
      ?.children?.filter(
        (c: any) => !c.isDisabled && !notAvailableOnMobile.includes(c.type)
      )
  );
</script>

<div
  class="flex flex-col justify-between w-full h-full pb-8"
  transition:fly={{ y: 10 }}
>
  <div class="w-full overflow-y-auto min-h-0 flex-1">
    {#if selectedSection === "text"}
        <!--  -->
      <div class="flex flex-col gap-3 w-full">
        <div class={itemsClass}>
          <BlockBrowserKeyboardItem item={quoteBrowserItem} onSelect={handleSelect} />
          <BlockBrowserKeyboardItem item={calloutBrowserItem} onSelect={handleSelect} />
          <BlockBrowserKeyboardItem item={codeBrowserItem} onSelect={handleSelect} />
        </div>
        <div class={shorterItemsClass}>
          {#each configData.headingsSection.children as item}
            <BlockBrowserKeyboardItem {item} onSelect={handleSelect} />
          {/each}
        </div>
        <div class={itemsClass}>
          {#each configData.listsSection.children as item}
            <BlockBrowserKeyboardItem {item} onSelect={handleSelect} />
          {/each}
        </div>
      </div>
    {:else}
      <div class={itemsClass}>
        {#if items && items.length > 0}
          {#each items as item}
            <BlockBrowserKeyboardItem {item} onSelect={handleSelect} />
          {/each}
        {/if}
      </div>
    {/if}
    <ScrollViewBottomSpacer size={Size.sm} />
  </div>
</div>
