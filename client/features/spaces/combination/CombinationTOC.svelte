<script lang="ts">
  import { onDestroy } from "svelte";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import {
    ActiveNodeStore,
    type IActiveNodeStore
  } from "@nucleum/features/memory/node/node.store";
  import {
    headingNodeTypes,
    NodeType
  } from "@nucleum/features/memory/node/node.type";
  import { cn } from "@nucleum/client/utils/ui.utils";

  let {
    resourceId = undefined,
    resourceType = undefined
  }: {
    resourceId?: IRecordId | undefined;
    resourceType?: Resource | undefined;
  } = $props();

  let unsubscribe: (() => void) | undefined;
  let node: IActiveNodeStore | undefined = undefined;
  let headings: { id: string; label: string; level: number }[] = [];

  $effect(() => {
    if (resourceType === Resource.node && resourceId) {
      initializeNodeStore(resourceId);
    } else {
      headings = [];
      cleanup();
    }
  });

  function initializeNodeStore(id: IRecordId) {
    cleanup();
    node = ActiveNodeStore.resolve(id);
    unsubscribe = node.subscribe((value: any) => {
      if (!value || !Array.isArray(value.blocks)) {
        headings = [];
        return;
      }
      headings = extractHeadings(value.blocks);
    });
  }

  function cleanup() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = undefined;
    }
    node = undefined;
  }

  onDestroy(() => {
    cleanup();
  });

  function extractHeadings(blocks: any[]) {
    return blocks
      .filter((block) => headingNodeTypes.includes(block.contentType))
      .map((block) => ({
        id: block.id,
        label: resolveHeadingLabel(block),
        level: resolveHeadingLevel(block.contentType)
      }));
  }

  function resolveHeadingLabel(block: any) {
    if (typeof block.body === "string" && block.body.trim().length > 0) {
      return block.body.trim();
    }
    if (typeof block.label === "string" && block.label.trim().length > 0) {
      return block.label.trim();
    }
    return "Untitled heading";
  }

  function resolveHeadingLevel(contentType: NodeType) {
    switch (contentType) {
      case NodeType.HEADING1:
        return 1;
      case NodeType.HEADING2:
        return 2;
      case NodeType.HEADING3:
        return 3;
      case NodeType.HEADING4:
        return 4;
      case NodeType.HEADING5:
        return 5;
      default:
        return 6;
    }
  }

  function scrollToHeading(id: string) {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
</script>

<div class="flex flex-col h-full w-full gap-2">
  {#if resourceType !== Resource.node}
    <span class="text-b3 text-fgs3 px-2">TOC available only for nodes</span>
  {:else if headings.length === 0}
    <span class="text-b3 text-fgs3 px-2">No headings found</span>
  {:else}
    <header class="px-2 py-1">
      <span class="text-b2 font-medium text-fgs1">Table of contents</span>
    </header>
    <nav class="flex-1 overflow-auto">
      <ul class="flex flex-col gap-1">
        {#each headings as heading}
          <li>
            <button
              class={cn(
                "w-full text-left px-3 py-2 rounded-md hover:bg-bgs2 text-b2",
                {
                  "pl-3": heading.level === 1,
                  "pl-6": heading.level === 2,
                  "pl-9": heading.level === 3,
                  "pl-12": heading.level === 4,
                  "pl-14": heading.level >= 5
                }
              )}
              onclick={() => scrollToHeading(heading.id)}
            >
              {heading.label}
            </button>
          </li>
        {/each}
      </ul>
    </nav>
  {/if}
</div>
