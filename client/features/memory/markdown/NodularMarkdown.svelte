<script lang="ts">
  import type {
    IBlock,
    IMarkdown,
    IMarkdownParams
  } from "@nucleum/features/memory/markdown/md.type";
  import {
    NodeType,
    headingNodeTypes,
    type IActiveNode,
    type INodeHierarchyV1,
    type INodeStructure
  } from "@nucleum/features/memory/node/node.type";
  import { onDestroy, onMount } from "svelte";
  import Markdown from "@nucleum/features/memory/markdown/Markdown.svelte";
  import {
    extractRootStructure,
    extractStructureForChildren,
    recursivelyExtractAllChildrenIntoArray
  } from "@nucleum/features/memory/markdown/markdown.utils";
  import { hierarchyFactorLimit } from "@nucleum/features/memory/node/node.store";
  import { isReplaceableMd } from "@nucleum/features/memory/markdown/markdown.store";
  import { logger } from "@nucleum/client/runtime/logging/logger";
  import type { IRecordId } from "@21n/types/data.type";
  import {
    isSameResource,
    resourceInList
  } from "@nucleum/datafn/resource.utils";
  import Button from "@21n/elements/button/Button.svelte";
  import { ButtonStyle } from "@21n/types/button.type";

  /**
   * Markdown in node form i.e. each block of the markdown stored as node record and nested under each node
   */
  let {
    node = undefined,
    md = $bindable(),
    childrenWithStructure = $bindable([]),
    focusedBlockChildrenWithStructure = $bindable([]),
    rootStructure = $bindable(),
    mdId,
    isNodular = node != undefined,
    params = undefined,
    onAction = undefined,
    onChange = undefined,
    onFocus = undefined,
    onReady = undefined,
    onRestructure = undefined
  }: {
    node?: IActiveNode | undefined;
    md: IMarkdown;
    childrenWithStructure?: INodeStructure[];
    focusedBlockChildrenWithStructure?: INodeStructure[];
    rootStructure?: string[] | undefined;
    mdId: string;
    isNodular?: boolean;
    params?: IMarkdownParams | undefined;
    onAction?: ((event: CustomEvent<any>) => void) | undefined;
    onChange?: ((event: CustomEvent<any>) => void) | undefined;
    onFocus?: ((event: CustomEvent<any>) => void) | undefined;
    onReady?: ((event: CustomEvent<void>) => void) | undefined;
    onRestructure?: ((event: CustomEvent<any>) => void) | undefined;
  } = $props();

  /**
   * Since node is undefined when NodularMarkdown is created from Writer we use this to decide if the media needs to be stored in temporary s3 storage or not
   */
  $effect(() => {
    $isReplaceableMd = node == undefined;
    return () => {
      $isReplaceableMd = false;
    };
  });
  onDestroy(() => {
    $isReplaceableMd = false;
  });
  /**
   * Markdown as a linear array of blocks i.e. blocks of the markdown stored as a single record on server.
   *
   * This is used to
   * 1. Capture a markdown
   * 2. Back propagate block content changes to the parent component in the case of Nodular Markdown.
   *
   * See {@link propagateChanges} and {@link onBlockContentChange} for more details on propagation.
   */
  let refreshId = $state(new Date().getTime());

  function resolveNodeMarkdown() {
    return {
      blocks: node ? (recursivelyExtractAllChildrenIntoArray(node) as IBlock[]) : []
    };
  }

  /**
   * Scoped blocks from {@link md} which is used to render the markdown.
   *
   * This is used to render the markdown when a heading is focused.
   */
  let _md = $state<IMarkdown>(node ? resolveNodeMarkdown() : md);

  /**
   * @deprecated - children structure determination trail 1
   */
  let hierarchyV1: INodeHierarchyV1[] = [];

  /**
   * The heading block which is focused when nodularity is enabled via {@link isNodular}
   */
  let focusedBlock = $state<IRecordId | undefined>();

  /**
   * The block in main root markdown until which the blocks are clipped starting from focused heading block when a heading is focused.
   *
   * This is used to reverse propagate the changes that happened when a heading block is focused.
   *
   * {@link md} and {@link childrenWithStructure} maintains the root blocks and structure of the markdown. Using this anchorBlock, {@link _md} and {@link focusedBlockChildrenWithStructure} - changes are propagated back to {@link md} and {@link childrenWithStructure}.
   */
  let anchorBlock = $state<IRecordId | undefined>();
  let mdRef = $state<Markdown | undefined>();

  function emitAction(detail: any) {
    const event = new CustomEvent("action", { detail });
    onAction?.(event);
  }

  function emitChange(detail: any) {
    const event = new CustomEvent("change", { detail });
    onChange?.(event);
  }

  function emitFocus(detail: any) {
    const event = new CustomEvent("focus", { detail });
    onFocus?.(event);
  }

  function emitReady() {
    const event = new CustomEvent<void>("ready");
    if (typeof onReady === "function") {
      onReady(event);
    }
  }

  function emitRestructure(detail: any) {
    const event = new CustomEvent("restructure", { detail });
    onRestructure?.(event);
  }

  onMount(() => {
    if (node) {
      _md = resolveNodeMarkdown();
      reCalculateStructure(_md, true);
      md = _md;
      emitReady();
      return;
    }
    _md = md;
    reCalculateStructure(_md, true);
    emitReady();
  });
  /**
   * @deprecated - used with v1 resolution of {@link hierarchyV1}
   * @param blockType
   */
  function resolveFactorV1(blockType: NodeType) {
    switch (blockType) {
      case NodeType.HEADING1:
        return 5;
      case NodeType.HEADING2:
        return 4;
      case NodeType.HEADING3:
        return 3;
      case NodeType.HEADING4:
        return 2;
      case NodeType.HEADING5:
        return 1;
      default:
        return 0;
    }
  }

  /**
   *
   * calculates the structure of the root markdown upon changes in structure of the markdown.
   *
   * Root structure will not change when a heading is focused since the user cannot add headings greater or equal in hierarchy to the focused heading.
   *
   * @param md
   * @param isInitCalculation
   */
  function reCalculateStructure(md: IMarkdown, isInitCalculation = false) {
    const result = extractStructureForChildren(md.blocks);
    if (!focusedBlock) childrenWithStructure = result;
    else {
      focusedBlockChildrenWithStructure = result;
      //Parse using achorBlock as below will disturb hierarchy
      // const remaining = childrenWithStructure.filter((block) => {
      //   return !result.some((y) => y.id === block.id);
      // });
      // childrenWithStructure = [...remaining, ...result];
      const focusedBlockIndex = childrenWithStructure.findIndex(
        resourceInList(focusedBlock)
      );
      const anchorBlockIndex = anchorBlock
        ? childrenWithStructure.findIndex(resourceInList(anchorBlock))
        : -1;
      let succeedingBlocks: INodeStructure[] = [];
      const preBlocks = childrenWithStructure.slice(0, focusedBlockIndex);
      if (anchorBlockIndex > 0)
        succeedingBlocks = childrenWithStructure.slice(anchorBlockIndex);
      childrenWithStructure = [
        ...preBlocks,
        ...focusedBlockChildrenWithStructure,
        ...succeedingBlocks
      ];
    }
    if (!focusedBlock)
      rootStructure = extractRootStructure(
        childrenWithStructure,
        hierarchyFactorLimit
      ).map((x) => x.id);
    if (isInitCalculation) return;
    //TODO - if focused - propagate only children of the focusedNode
    emitRestructure({
      root: rootStructure,
      children: focusedBlock
        ? focusedBlockChildrenWithStructure
        : childrenWithStructure
    });
  }
  function onBlockStructuralChanges(event: any) {
    if (isNodular) reCalculateStructure(event.detail.md);
    propagateChanges(event.detail.md);
    logger.log({
      at: "onBlockStructuralChanges",
      detail: event.detail,
      childrenWithStructure,
      rootStructure,
      node,
      md
    });
  }

  /**
   * Merges the focused markdown with the root markdown when a heading is focused.
   * @param focusedMd - the markdown of the focused heading
   * @returns - the merged markdown
   */
  function mergeFocusedMd(focusedMd: IMarkdown) {
    const focusedBlockIndex = focusedBlock
      ? md.blocks.findIndex(resourceInList(focusedBlock))
      : -1;
    const anchorBlockIndex = anchorBlock
      ? md.blocks.findIndex(resourceInList(anchorBlock))
      : -1;
    let succeedingBlocks: IBlock[] = [];
    const preBlocks = md.blocks.slice(0, focusedBlockIndex);
    if (anchorBlockIndex > 0)
      succeedingBlocks = md.blocks.slice(anchorBlockIndex);
    return {
      blocks: [...preBlocks, ...focusedMd.blocks, ...succeedingBlocks]
    };
  }
  /**
   * Propagates changes back to the {@link md} when content in markdown changes.
   * md returned from events is used instead of using _md directly as {@link Markdown} component used md store internally to maintain the state of the markdown. _md binding is back propagated from Markdown with a delay.
   * @param updatedMd - the updated markdown parsed from events from {@link Markdown}
   */
  function propagateChanges(updatedMd: IMarkdown) {
    if (!focusedBlock) md = updatedMd;
    else md = mergeFocusedMd(updatedMd);
  }
  /**
   * This function is called when the content of a block changes. It propagates the changes to the parent component for persistence.
   * @param event
   */
  function onBlockContentChange(event: any) {
    logger.log({ at: "onBlockChanges", event });
    const detail = event.detail;
    propagateChanges(detail.md);
    emitChange({
      md,
      block: detail,
      root: rootStructure,
      childrenWithStructure
    });
  }
  /**
   * Resolves the anchor block when a heading is focused.
   * @param focusedBlock - the focused block id
   * @returns - the anchor block id and the index of the anchor block in the root markdown and the index of the focused block in the root markdown
   */
  function resolveAnchorBlock(focusedBlock: IRecordId) {
    let focusBlockIndex = -1;
    let anchorBlockIndex = undefined;
    let anchorBlock;
    focusBlockIndex =
      childrenWithStructure.findIndex(resourceInList(focusedBlock)) ??
      focusBlockIndex;
    const factor = childrenWithStructure.find(
      resourceInList(focusedBlock)
    )?.factor;
    logger.log({ focusBlockIndex, factor });
    if (!factor) return { focusBlockIndex, anchorBlockIndex };
    const succeedingBlocks = childrenWithStructure.slice(focusBlockIndex + 1);
    anchorBlock = succeedingBlocks.find((b) => b.factor <= factor);
    if (anchorBlock)
      anchorBlockIndex = childrenWithStructure.findIndex(
        resourceInList(anchorBlock?.id)
      );
    return {
      id: anchorBlock?.id,
      focusBlockIndex,
      anchorBlockIndex
    };
  }
  function extractParent(id: IRecordId): IRecordId[] {
    const parent = childrenWithStructure.find((x) =>
      x.children?.some(resourceInList(id))
    );
    if (parent) return [...extractParent(parent.id), parent.id];
    else return node?.id ? [node?.id] : [];
  }

  export function focus(blockToFocus: IRecordId) {
    if (!blockToFocus) return;
    logger.log({
      at: "NodularMarkdown - focus",
      blockToFocus,
      focusedBlock,
      node,
      childrenWithStructure
    });
    if (focusedBlock && isSameResource(blockToFocus, focusedBlock)) return;
    if (node && isSameResource(node, blockToFocus)) {
      unFocus();
      return { status: 0, parent: [] };
    }
    if (childrenWithStructure.findIndex(resourceInList(blockToFocus)) == -1)
      return { status: -1 };
    focusedBlock = blockToFocus;
    const { id, anchorBlockIndex, focusBlockIndex } =
      resolveAnchorBlock(focusedBlock);
    anchorBlock = id;
    const blocks = md.blocks.slice(focusBlockIndex, anchorBlockIndex);
    _md = { blocks };
    refreshId = new Date().getTime();
    logger.log({
      at: "focus",
      blockToFocus,
      anchorBlock,
      focusBlockIndex,
      childrenWithStructure,
      rootStructure
    });
    const parent = extractParent(blockToFocus);
    return { status: 1, parent };
  }
  /**
   * TODO - disabling direct focus on blocks until all edge cases are handled for node page. direct focus on capture still works.
   * @param event
   */
  function onBlockFocus(event: any) {
    propagateChanges(event.detail.md);
    if (!event.detail.id) return;
    if (!node) {
      if (focusedBlock && isSameResource(event.detail.id, focusedBlock)) {
        unFocus();
        return;
      }
      focus(event.detail.id);
    } else {
      const parent = extractParent(event.detail.id);
      emitFocus({ id: event.detail.id, parent });
      logger.log({ at: "onBlockFocus", event, parent, md });
    }
  }
  export function unFocus() {
    focusedBlock = undefined;
    _md = { blocks: md.blocks };
    refreshId = new Date().getTime();
  }

  function onBlockAction(event: CustomEvent) {
    logger.log({ at: "onBlockAction", event });
    emitAction(event.detail);
    onBlockStructuralChanges(event);
  }

  export function focusBlock(id?: IRecordId) {
    mdRef?.focus(id);
  }

  function onRearrange(event: any) {
    if (!event.detail.md) return;
    onBlockStructuralChanges(event);
  }
</script>

{#key refreshId}
  {#if focusedBlock && !node}
    <Button
      icon="back-sm"
      label="Back"
      style={ButtonStyle.PLAIN}
      onclick={() => {
        unFocus();
      }}
    />
  {/if}
  <Markdown
    bind:md={_md}
    id={mdId}
    params={{
      isNodular,
      canUseSlashShortcut: true,
      ...params
    }}
    bind:this={mdRef}
    onChange={onBlockContentChange}
    onFocus={onBlockFocus}
    onAction={onBlockAction}
    {onRearrange}
  />
{/key}
