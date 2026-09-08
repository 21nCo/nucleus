<script lang="ts">
  import type { IBlock } from "@nucleum/features/memory/markdown/md.type";
  import { headingNodeTypes, listNodeTypes, simpleTextNodeTypeList, type IMediaGridNode } from "@nucleum/features/memory/node/node.type";
import { NodeType } from "@nucleum/schema/legacy/node-type.enum";
  import EmbedContent from "@nucleum/features/memory/markdown/embed/EmbedContent.svelte";
  import type { MdStoreType } from "@nucleum/features/memory/markdown/markdown.store";
  import MediaGrid from "@nucleum/features/memory/markdown/mediaGrid/MediaGrid.svelte";
  import Callout from "@nucleum/features/memory/markdown/callout/Callout.svelte";
  import TextContent from "@nucleum/features/memory/markdown/content/TextContent.svelte";
  import CodeContent from "@nucleum/features/memory/markdown/content/CodeContent.svelte";
  import ListContent from "@nucleum/features/memory/markdown/lists/ListContent.svelte";
  import HeadingContent from "@nucleum/features/memory/markdown/content/HeadingContent.svelte";
  import { cn } from "@21n/utils/ui.utils";
  let {
    mdStore,
    block,
    parentHierarchy = [],
    isHovering = false,
    isFocusing = $bindable(false),
    onBlur = undefined,
    onDelete = undefined,
    onUpdate = undefined
  }: {
    mdStore: MdStoreType;
    block: IBlock;
    parentHierarchy?: string[];
    isHovering?: boolean;
    isFocusing?: boolean;
    onBlur?: ((event?: CustomEvent<any>) => void) | undefined;
    onDelete?: (() => void) | undefined;
    onUpdate?: ((event: CustomEvent<any>) => void) | undefined;
  } = $props();

  void parentHierarchy;

  const mediaGridBlock = $derived(block as unknown as IMediaGridNode);
</script>

<div
  class={cn("relative w-full", {
    "h-fit": block.contentType === NodeType.EMBED,
    "flex-grow": block.contentType !== NodeType.EMBED
  })}
>
  {#if block.contentType === NodeType.DIVIDER}
    <div class="h-px bg-brs3 my-4"></div>
  {:else if block.contentType === NodeType.DOUBLE_DIVIDER}
    <div class="flex flex-col my-1 gap-0.5">
      <div class="h-px bg-bgs4"></div>
      <div class="h-px bg-bgs4"></div>
    </div>
  {:else if block.contentType === NodeType.MEDIA_GRID}
    <MediaGrid block={mediaGridBlock} {mdStore} {onDelete} {onUpdate} />
  {:else if block.contentType === NodeType.EMBED}
    <EmbedContent
      id={block.id}
      body={block.body}
      {mdStore}
      {isHovering}
      onUpdate={onUpdate}
      onDelete={onDelete}
    />
  {:else if block.contentType === NodeType.CALLOUT}
    <Callout id={block.id} body={block.body} {mdStore} {isHovering} onUpdate={onUpdate} />
  {:else if block.contentType === NodeType.CODE}
    <CodeContent body={block.body} {mdStore} {onUpdate} {onDelete} />
  {:else if headingNodeTypes.includes(block.contentType)}
    <HeadingContent
      id={block.id}
      text={block.label}
      bind:isFocusing
      {mdStore}
      contentType={block.contentType}
      {onUpdate}
    />
  {:else if listNodeTypes.includes(block.contentType) && typeof block.body === "object"}
    <ListContent
      body={block.body}
      id={block.id}
      contentType={block.contentType}
      {isHovering}
      {mdStore}
      bind:isFocusing
      {onUpdate}
      {onBlur}
    />
  {:else if simpleTextNodeTypeList.includes(block.contentType) && typeof block.body === "string"}
    <TextContent
      text={block.body}
      id={block.id}
      contentType={block.contentType}
      {mdStore}
      {isHovering}
      bind:isFocusing
      {onUpdate}
      {onBlur}
    />
  {:else}
    <span class="flex text-ars1 text-b2"
      >Unable to load this block's content.</span
    >
  {/if}
</div>
