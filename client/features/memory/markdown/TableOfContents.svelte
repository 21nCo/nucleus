<script lang="ts">
  import type {
    IBlock,
    IMarkdownStore
  } from "@nucleum/features/memory/markdown/md.type";
  import { onMount } from "svelte";
  import { getMdStore } from "@nucleum/features/memory/markdown/markdown.store";
  import Text from "@21n/elements/text/Text.svelte";
  import { TextStyle } from "@21n/elements/text/text.enum";
  import { cn } from "@21n/utils/ui.utils";
  import { headingNodeTypes } from "@nucleum/features/memory/node/node.type";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import { Size } from "@21n/elements/size.enum";
  import { tooltip } from "@nucleum/actions/popover.action";
  import { Placement } from "@21n/elements/direction.enum";
  import {
    isSameResource,
    resourceInList
  } from "@nucleum/datafn/resource.utils";
  import TableOfContentsList from "@nucleum/features/memory/markdown/TableOfContentsList.svelte";
  import { hoverable } from "@nucleum/actions/hover.action";
  let {
    mdId,
    isHideEmptyPlaceholder = false,
    isExpandOnHover = false
  }: {
    mdId: string;
    isHideEmptyPlaceholder?: boolean;
    isExpandOnHover?: boolean;
  } = $props();
  const mdStore = getMdStore(mdId);
  const mdcontainerID = `markDown-${mdId}`;
  let mdContainerHeight = $state<number | undefined>();
  let headingBlocks = $state<any>([]);
  let isHeadingAvailable = $state(false);
  const dev_isShowFocusState: boolean = false;
  let isHovered = $state(false);
  onMount(() => {
    let mdContainerElement = document.getElementById(mdcontainerID);
    mdContainerHeight = mdContainerElement?.offsetHeight;
    const sub = mdStore.subscribe((x: IMarkdownStore) => {
      refresh(x.blocks);
    });
    return () => {
      sub();
    };
  });
  function refresh(blocks: IBlock[]) {
    headingBlocks = blocks
      .filter((block: IBlock) => headingNodeTypes.includes(block.contentType))
      .map((block: IBlock) => ({
        content: block.label ?? block.body,
        id: block.id,
        HEADING: Number(block.contentType.slice(-1)) - 1
      }));
    if (!(headingBlocks.length > 0)) return;
    isHeadingAvailable = true;
  }

  function scrollToHeading(e: MouseEvent, id: string) {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
</script>

{#if isHeadingAvailable}
  <div
    class={cn("w-full text-left transition-all", {
      "p-2": isExpandOnHover
    })}
    class:relative={isExpandOnHover}
    use:hoverable={{
      onHover: (val) => {
        isHovered = val;
      }
    }}
  >
    <div class="sticky top-10 pt-10">
      {#if isExpandOnHover}
        <div class="flex flex-col items-end gap-1.5 py-2">
          {#each headingBlocks as block}
            {@const isInView = $mdStore?.headingsInView?.some(
              resourceInList(block)
            )}
            {@const isActive =
              dev_isShowFocusState &&
              $mdStore.activeHeading &&
              isSameResource($mdStore.activeHeading, block)}
            {@const lineWidth = 24 - block.HEADING * 6}
            <a
              href="#{block.id}"
              onclick={(e) => scrollToHeading(e, block.id)}
              class="flex items-center py-0.5"
              use:tooltip={{
                text: block.content,
                direction: Placement.Right
              }}
            >
              <div
                class={cn("h-[1.5px] rounded-full transition-all", {
                  "bg-aps1": isActive && !$mdStore.params?.isReadOnly,
                  "bg-fgs1":
                    isInView && (!isActive || $mdStore.params?.isReadOnly),
                  "bg-fgs4":
                    !isInView && (!isActive || $mdStore.params?.isReadOnly)
                })}
                style="width: {lineWidth}px;"
              ></div>
            </a>
          {/each}
        </div>
      {/if}
      {#if isExpandOnHover && isHovered}
        <div
          class="absolute right-0 top-10 z-10 bg-bgs1 border border-brs1 rounded-lg shadow-lg p-2 min-w-64"
        >
          <TableOfContentsList
            {headingBlocks}
            {mdStore}
            {scrollToHeading}
            {dev_isShowFocusState}
          />
        </div>
      {:else if !isExpandOnHover}
        <TableOfContentsList
          {headingBlocks}
          {mdStore}
          {scrollToHeading}
          {dev_isShowFocusState}
        />
      {/if}
    </div>
  </div>
{:else if !isHideEmptyPlaceholder}
  <EmptyStatusView mainText="No headings found" size={Size.sm} />
{/if}
