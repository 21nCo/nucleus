<script lang="ts">
  import {
    BlockAction,
    type IBlock,
    type IMarkdown,
    type IMarkdownParams
  } from "@nucleum/components/markdown/md.type";
  import { onDestroy, onMount, type Snippet } from "svelte";
  import Block from "@nucleum/components/markdown/Block.svelte";
  import {
    getMdStore,
    mdContentChangeEvent
  } from "@nucleum/components/markdown/markdown.store";
  import Button from "@21n/elements/button/Button.svelte";
  import { TextStyle } from "@21n/types/text.enum";
  import Text from "@21n/elements/text/Text.svelte";
  import { Size } from "@21n/types/size.enum";
  import { isValidAndUniqueArray } from "@21n/shared-utils/obj.utils";
  import InlineErrorMessage from "@21n/elements/text/InlineErrorMessage.svelte";
  import { setContext } from "svelte";
  import { generateMarkdownText } from "@nucleum/features/memory/node/node.utils";
  import { logger } from "@nucleum/components/debug/logger.client";
  import { get } from "svelte/store";
  import { KeyboardKey } from "@21n/types/keyboard.type";
  import type { IRecordId } from "@21n/types/data.type";
  import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";
  import {
    reorderList,
    type DragDropEvent
  } from "@nucleum/actions/rearrange.action";
  import {
    isSameResource,
    resourceInList,
    shiftResourceInArray
  } from "@nucleum/datafn/resource.utils";
  import { NodeType } from "@nucleum/features/memory/node/node.type";
  import context from "@nucleum/stores/context.store";
  import MarkdownkeyboardToolbar from "@nucleum/components/markdown/toolbar/MarkdownkeyboardToolbar.svelte";
  import { debouncer } from "@21n/utils/utils";
  import { toasts } from "@nucleum/stores/notification.store";
  import { dragSelection } from "@nucleum/actions/dragSelection.action";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import {
    ResourceAccessPoint,
    ResourceActionType
  } from "@nucleum/datafn/resource.type";
  import { bulkEditStore as globalBulkEditStore } from "@nucleum/components/record/bulkedit.store";
  import { generateResourceId } from "@nucleum/datafn/id.utils";
  import { ErrorMessage } from "@nucleum/components/error/error.type";
  import { resizeListener } from "@nucleum/actions/resize.action";
  import { stringify } from "@21n/shared-utils/json.utils";
  import { Context } from "@21n/types/appStore.type";

  interface $$Events {
    action: CustomEvent<any>;
    blocks: CustomEvent<IBlock[]>;
    blur: CustomEvent<any>;
    change: CustomEvent<any>;
    debouncedChange: CustomEvent<IMarkdown | undefined>;
    focus: CustomEvent<any>;
    rearrange: CustomEvent<{ md: IMarkdown | undefined }>;
  }

  /**
   * Propagates the event to the parent component.
   *
   * Repropagating by tapping the events from children to parent as blocks in `md` are not latest versions during some events when the NodularMarkdown component is receiving the events directly without interference from this component.
   *
   * @param event
   * @param data
   */
  function propagate(event: string, data: any) {
    const detail = {
      ...data,
      md: { ...md, blocks: $mdStore.blocks }
    };
    const customEvent = new CustomEvent(event, { detail });
    if (event === "action") {
      if (typeof onAction === "function") {
        onAction(customEvent);
      }
    } else if (event === "change") {
      if (typeof onChange === "function") {
        onChange(customEvent);
      }
    } else if (event === "focus") {
      if (typeof onFocus === "function") {
        onFocus(customEvent);
      }
    } else if (event === "blur") {
      if (typeof onBlur === "function") {
        onBlur(customEvent);
      }
    }
  }

  function markdownContext(message: any) {
    if (!message) return;
    if (message.event === "focus") {
      resetSelection();
      focusedBlock = message.id;
      return;
    } else if (message.event === "blur") {
      if (focusedBlock === message.id) {
        focusedBlock = undefined;
      }
    }
    if (message.event) propagate(message.event, message.data);
  }
  setContext(Context.MARKDOWN, markdownContext);

  let {
    md = $bindable(),
    params = undefined,
    parentBackgroundIndex = undefined,
    id = undefined,
    onAction = undefined,
    onBlocks = undefined,
    onBlur = undefined,
    onChange = undefined,
    onDebouncedChange = undefined,
    onFocus = undefined,
    onRearrange = undefined,
    title = undefined
  }: {
    md?: IMarkdown | undefined;
    params?: IMarkdownParams | undefined;
    parentBackgroundIndex?: number | undefined;
    id?: string | undefined;
    onAction?: ((event: CustomEvent<any>) => void) | undefined;
    onBlocks?: ((event: CustomEvent<IBlock[]>) => void) | undefined;
    onBlur?: ((event: CustomEvent<any>) => void) | undefined;
    onChange?: ((event: CustomEvent<any>) => void) | undefined;
    onDebouncedChange?:
      | ((event: CustomEvent<IMarkdown | undefined>) => void)
      | undefined;
    onFocus?: ((event: CustomEvent<any>) => void) | undefined;
    onRearrange?:
      | ((event: CustomEvent<{ md: IMarkdown | undefined }>) => void)
      | undefined;
    title?: Snippet | undefined;
  } = $props();
  const generatedMdId = generateSimpleRandomId();
  const mdId = $derived(id ?? generatedMdId);
  const mdStore = $derived(getMdStore(mdId));
  const containerId = $derived(`mdcontainer-${mdId}`);
  load(md);
  let lastExternalMdSignature = $state<string | undefined>(undefined);
  $effect(() => {
    if (!md?.blocks?.length) return;
    const nextSignature = stringify(
      md.blocks.map((block) => ({
        id: block.id,
        contentType: block.contentType,
        body: block.body,
        label: block.label
      }))
    );
    if (nextSignature === lastExternalMdSignature) return;
    const currentBlocks = $mdStore.blocks ?? [];
    const isStoreSeededEmpty =
      currentBlocks.length === 1 &&
      currentBlocks[0]?.contentType === NodeType.SIMPLE_TEXT &&
      !currentBlocks[0]?.body &&
      currentBlocks[0]?.id !== md.blocks[0]?.id;
    const isStoreMissingBlocks = currentBlocks.length === 0;
    if (!isStoreSeededEmpty && !isStoreMissingBlocks) return;
    lastExternalMdSignature = nextSignature;
    load(md);
  });
  let lastParamsSignature = $state<string | undefined>(undefined);
  $effect(() => {
    if (!params) {
      lastParamsSignature = undefined;
      return;
    }
    const nextParamsSignature = stringify(params);
    if (nextParamsSignature === lastParamsSignature) return;
    lastParamsSignature = nextParamsSignature;
    mdStore?.setParams(params);
  });
  // $: console.log("blocks", $mdStore.blocks);
  let keyboardToolbarPanelSelection = $state<string | undefined>();
  let keyboardToolbarRef = $state<MarkdownkeyboardToolbar | undefined>();
  let focusedBlock = $state<IRecordId | undefined>();
  let containerWidth = $state(0);
  let isInSelectionMode = $state(false);
  let isSelectionConsecutive = $state(false);
  const multiSelectContext = $derived.by(() => ({
    resource: Resource.node,
    accessPoint: ResourceAccessPoint.MARKDOWN,
    accessPointId: id
  }));
  let bulkSelection = $state<IRecordId[]>([]);
  let bulkEditUnsub: (() => void) | undefined;
  $effect(() => {
    if (globalBulkEditStore.matchesContext(multiSelectContext)) {
      resolveBulkEditorInstance();
      return;
    }
    bulkEditUnsub?.();
    bulkEditUnsub = undefined;
    if (bulkSelection.length > 0) {
      bulkSelection = [];
      isInSelectionMode = false;
      isSelectionConsecutive = false;
      keyboardToolbarPanelSelection = undefined;
    }
  });

  onMount(() => {
    const mdChangeSub = mdContentChangeEvent.subscribe((val) => {
      if (md && "blocks" in md) md = { ...md, blocks: $mdStore.blocks };
      else md = { blocks: $mdStore.blocks };
      const event = new CustomEvent<IBlock[]>("blocks", {
        detail: $mdStore.blocks
      });
      if (typeof onBlocks === "function") {
        onBlocks(event);
      }
      dispatchDebouncedChangeEvent();
    });
    return () => {
      mdChangeSub();
    };
  });

  onDestroy(() => {
    bulkEditUnsub?.();
    if (globalBulkEditStore.matchesContext(multiSelectContext)) {
      globalBulkEditStore.clear();
    }
  });

  const dispatchDebouncedChangeEvent = debouncer(() => {
    const event = new CustomEvent<IMarkdown | undefined>("debouncedChange", {
      detail: md
    });
    if (typeof onDebouncedChange === "function") {
      onDebouncedChange(event);
    }
  }, 1000);

  function resolveBulkEditorInstance() {
    globalBulkEditStore.activate(multiSelectContext, {
      onAction: handleBulkAction,
      onSelectAll: selectAll,
      subContext: id
    });
    if (!bulkEditUnsub) {
      bulkEditUnsub = globalBulkEditStore.subscribe((value = []) => {
        bulkSelection = value;
        isInSelectionMode = bulkSelection.length > 0;
        if (bulkSelection.length === 0) {
          keyboardToolbarPanelSelection = undefined;
          isSelectionConsecutive = false;
        }
      });
    }
  }

  function load(md: IMarkdown | undefined) {
    let isSeeded = false;
    let newBlock: IBlock | undefined = undefined;
    if (!md || !md.blocks || md.blocks.length === 0) {
      newBlock = {
        id: generateResourceId(Resource.node),
        contentType: NodeType.SIMPLE_TEXT,
        body: ""
      };
      md = {
        ...md,
        blocks: [newBlock]
      };
      isSeeded = true;
    }
    mdStore.load(md, { isPreventFocus: params?.isPreventFocusOnLoad });
    if (isSeeded) {
      setTimeout(() => {
        propagate("action", { action: BlockAction.INSERT, ...newBlock });
      }, 500);
    }
  }

  function onKeyDown(event: KeyboardEvent) {
    const focus = get(mdStore.focus);
    logger.log({
      key: event.key,
      focusedBlock: focus,
      at: "Markdown.svelte"
    });
    if (event.key === KeyboardKey.ESCAPE && focus) {
      mdStore.focus.set(undefined);
      event.stopPropagation();
    }
  }

  export function focus(blockId?: IRecordId) {
    try {
      if (blockId) {
        mdStore.focus.set({ id: blockId });
      } else {
        mdStore.focus.set({ id: md?.blocks[0].id });
      }
    } catch (e) {
      logger.error(e);
    }
  }

  function onReorderBlocks(event: DragDropEvent) {
    logger.log({ event, at: "Markdown.svelte onReorderBlocks" });
    let { fromId, toId } = event;
    if (
      !event ||
      event.listId !== "markdown" ||
      !fromId ||
      !toId ||
      fromId === toId
    )
      return;
    if (isInSelectionMode) {
      handleReorderBlocksInSelectionMode(event);
      return;
    }
    const fromBlock = $mdStore.blocks.find(resourceInList(fromId));
    const toBlock = $mdStore.blocks.find(resourceInList(toId));
    const toIndex = $mdStore.blocks.findIndex(resourceInList(toId));
    const toSiblingBlock = $mdStore.blocks[toIndex + 1];
    let needsReconciliation =
      fromBlock?.contentType === NodeType.ORDERED_LIST &&
      (toBlock?.contentType === NodeType.ORDERED_LIST ||
        toSiblingBlock?.contentType === NodeType.ORDERED_LIST);
    $mdStore.blocks = shiftResourceInArray($mdStore.blocks, fromId, toId, true);
    const rearrangeEvent = new CustomEvent<{ md: IMarkdown | undefined }>(
      "rearrange",
      {
        detail: { md: { ...md, blocks: $mdStore.blocks } }
      }
    );
    onRearrange?.(rearrangeEvent);
    if (needsReconciliation) {
      const changedBlocks = mdStore.reconcileOrderedListOnDrag(fromId);
      changedBlocks?.forEach((b) => {
        propagate(BlockAction.CHANGE, {
          id: b.id,
          body: b.body
        });
      });
    }
  }
  function handleReorderBlocksInSelectionMode(event: DragDropEvent) {
    let { toId } = event;
    if (bulkSelection.length === 0 || !toId) {
      return;
    }
    if (bulkSelection.some((selectedId) => selectedId === toId.toString())) {
      return;
    }
    const selectedBlocks = $mdStore.blocks.filter((block) =>
      bulkSelection.some((selectedId) => block.id.toString() === selectedId)
    );

    let newBlocks = $mdStore.blocks.filter(
      (block) =>
        !bulkSelection.some((selectedId) => block.id.toString() === selectedId)
    );

    const newToIndex = newBlocks.findIndex(resourceInList(toId));
    const insertIndex = newToIndex + 1;
    newBlocks.splice(insertIndex, 0, ...selectedBlocks);
    $mdStore.blocks = newBlocks;
    //TODO - check for reconciliation scenarios
    const rearrangeEvent = new CustomEvent<{ md: IMarkdown | undefined }>(
      "rearrange",
      {
        detail: { md: { ...md, blocks: $mdStore.blocks } }
      }
    );
    onRearrange?.(rearrangeEvent);
    resetSelection();
  }

  function resetSelection() {
    globalBulkEditStore.reset();
    keyboardToolbarPanelSelection = undefined;
    isInSelectionMode = false;
    isSelectionConsecutive = false;
  }

  function onBulkAction(action: BlockAction | ResourceActionType, data?: any) {
    try {
      if (action === BlockAction.DELETE) {
        mdStore.deleteMany(bulkSelection);
        propagate("action", {
          action: BlockAction.DELETE_MANY,
          source: bulkSelection
        });
        resetSelection();
        return;
      }
      const selectedBlocks = $mdStore.blocks.filter((block) =>
        bulkSelection.some((selectedId) => block.id.toString() === selectedId)
      );
      const blocksLengthText =
        selectedBlocks.length > 1
          ? ` ${selectedBlocks.length} blocks`
          : ` ${selectedBlocks.length} block`;
      if (action === ResourceActionType.DUPLICATE) {
        const duplicatedBlocks = selectedBlocks.map((block) => ({
          ...block,
          id: generateResourceId(Resource.node)
        }));
        const lastSelectedBlockIndex = Math.max(
          ...selectedBlocks.map((block) =>
            $mdStore.blocks.findIndex((b) => isSameResource(b.id, block.id))
          )
        );
        const lastSelectedBlock = $mdStore.blocks[lastSelectedBlockIndex];
        mdStore.insertMany(lastSelectedBlock.id, duplicatedBlocks);
        propagate("action", {
          action: BlockAction.INSERT_MANY,
          source: bulkSelection,
          blocks: duplicatedBlocks
        });
        resetSelection();
        toasts.success(`Duplicated ${blocksLengthText}`);
      } else if (action === ResourceActionType.COPY_CONTENTS) {
        const markdownText = generateMarkdownText(selectedBlocks, {
          isIncludeNonSearchBlocks: true
        });
        navigator.clipboard.writeText(markdownText);
        toasts.success(`Copied ${blocksLengthText} to clipboard`);
      } else if (action === ResourceActionType.CONVERT) {
        //TODO: Implement convert
        resetSelection();
        toasts.success(`Converted ${blocksLengthText} to ${data.toType}`);
      }
    } catch (e) {
      logger.error({ at: "Markdown.svelte onBulkAction", error: e });
      toasts.error(ErrorMessage.DEFAULT);
    }
  }

  function handleBulkAction(_ids: IRecordId[], action: string, data?: unknown) {
    onBulkAction(action as BlockAction | ResourceActionType, data);
  }

  function refreshConsecutiveSelectionState() {
    try {
      const selectedIndices = bulkSelection
        .map((id) =>
          $mdStore.blocks.findIndex((block) => block.id.toString() === id)
        )
        .filter((index) => index !== -1)
        .sort((a, b) => a - b);

      isSelectionConsecutive =
        selectedIndices.length > 1 &&
        selectedIndices.every(
          (index, i) => i === 0 || index === selectedIndices[i - 1] + 1
        );
    } catch (e) {
      logger.error({
        at: "Markdown.svelte refreshConsecutiveSelectionState",
        error: e
      });
    }
  }

  function selectAll() {
    return $mdStore.blocks.map((b) => b.id.toString());
  }
</script>

<div
  id="markDown-{mdId}"
  class="relative flex flex-col justify-start items-start text-start w-full h-full"
  aria-label="Markdown editor"
  role="textbox"
  tabindex="-1"
  onkeydown={onKeyDown}
  use:resizeListener={(e) => {
    containerWidth = e.width;
  }}
>
  <div class="flex justify-between">
    <div class="flex gap-2 items-center">
      {#if title}
        {@render title()}
      {:else if params?.title}
        <Text content={params.title} style={TextStyle.PANEL_HEADING} />
      {/if}
    </div>
    <div class="absolute flex gap-2 top-0 right-0 z-40">
      {#if params?.actions?.includes("copy")}
        <div>
          <Button
            icon="copy"
            label="Copy markdown"
            size={Size.xs}
            parentBgIndex={parentBackgroundIndex}
            onclick={() => {
              const markdownAsText = generateMarkdownText($mdStore.blocks, {
                isIncludeNonSearchBlocks: true
              });
              navigator.clipboard.writeText(markdownAsText);
              toasts.success("Copied to clipboard");
            }}
          />
        </div>
      {/if}
      {#if params?.actions?.includes("copyRaw")}
        <div>
          <Button
            icon="copy"
            tooltip="Copy raw md"
            label="Copy raw md"
            size={Size.xs}
            parentBgIndex={parentBackgroundIndex}
            onclick={() => {
              const rawMdJson = stringify($mdStore.blocks, {
                isPreventReplacer: true
              });
              navigator.clipboard.writeText(rawMdJson);
              toasts.success("Copied to clipboard");
            }}
          />
        </div>
      {/if}
    </div>
  </div>
  <div
    id="mdContent"
    class="grow w-full relative"
    use:reorderList={{
      listId: "markdown",
      draggedOverClass: "!border-b-aps1 !rounded-none",
      onDrop: onReorderBlocks,
      dragImage:
        bulkSelection.length > 0
          ? `moving ${bulkSelection.length} blocks`
          : "dragimage"
    }}
    use:dragSelection={{
      selectableSelector: "div[id^='md-block-']",
      containerId: containerId,
      onSelectionChange: (elements, ids) => {
        resolveBulkEditorInstance();
        if (!ids || ids.length === 0) {
          globalBulkEditStore.select([]);
          isInSelectionMode = false;
          return;
        }
        if (isInSelectionMode) {
          const current = globalBulkEditStore.getState().selectedIds;
          globalBulkEditStore.select([...new Set([...current, ...ids])]);
        } else {
          isInSelectionMode = true;
          globalBulkEditStore.select(ids);
        }
        isInSelectionMode =
          globalBulkEditStore.getState().selectedIds.length > 0;
      },
      onSelectionEnd: (elements, ids) => {
        if (ids.length > 0) {
          refreshConsecutiveSelectionState();
          keyboardToolbarPanelSelection = "actions";
          keyboardToolbarRef?.action("actions");
        } else {
          keyboardToolbarPanelSelection = undefined;
          isSelectionConsecutive = false;
        }
      }
    }}
  >
    {#if isValidAndUniqueArray($mdStore.blocks)}
      {#each $mdStore.blocks as block, index (block.id)}
        {@const isSelected = bulkSelection.some(resourceInList(block.id))}
        <Block
          bind:block={$mdStore.blocks[index]}
          {mdStore}
          {index}
          {isSelected}
          isRearrangeBlockInSelectionMode={isSelected &&
            isSelectionConsecutive &&
            $mdStore.blocks
              .find((b) =>
                bulkSelection.some(
                  (selectedId) => b.id.toString() === selectedId
                )
              )
              ?.id.toString() === block.id.toString()}
          isInSelectionMode={bulkSelection.length > 0}
          onNodularize={(e) => {
            propagate("focus", e.detail);
          }}
          onPopoverVisibility={(e) => {
            if (e.detail) {
              resetSelection();
            }
          }}
          onSelect={() => {
            resolveBulkEditorInstance();
            const current = globalBulkEditStore.getState().selectedIds;
            const resourceId = block.id.toString();
            if (current.some((selectedId) => selectedId === resourceId)) {
              globalBulkEditStore.select(
                current.filter((x) => x !== resourceId)
              );
              if (globalBulkEditStore.getState().selectedIds.length === 0) {
                keyboardToolbarPanelSelection = undefined;
              }
            } else {
              globalBulkEditStore.select([...current, resourceId]);
              keyboardToolbarPanelSelection = "actions";
              keyboardToolbarRef?.action("actions");
            }
            refreshConsecutiveSelectionState();
          }}
        />
      {/each}
    {:else}
      <InlineErrorMessage
        isDissappear={false}
        error="Invalid markdown content. Pleae try again after sometime."
      />
    {/if}
  </div>
</div>
{#if $context.isTouchDevice && (focusedBlock || keyboardToolbarPanelSelection)}
  <MarkdownkeyboardToolbar
    bind:this={keyboardToolbarRef}
    bind:keyboardToolbarPanelSelection
    selectedBlocks={bulkSelection}
    onSelect={() => {
      resolveBulkEditorInstance();
      if (focusedBlock) globalBulkEditStore.select([focusedBlock]);
    }}
    onUnselect={() => {
      resolveBulkEditorInstance();
      globalBulkEditStore.select([]);
    }}
    onAction={(e) => {
      const { action, data } = e;
      if (bulkSelection.length === 1) {
        mdStore.alterBlock({ action, data, blockId: bulkSelection[0] });
      } else if (
        bulkSelection.length === 0 &&
        action === BlockAction.INSERT &&
        focusedBlock
      ) {
        mdStore.alterBlock({ action, data, blockId: focusedBlock });
      } else {
        onBulkAction(action);
      }
      resolveBulkEditorInstance();
      globalBulkEditStore.select([]);
    }}
    onInsert={(toType) => {
      const block = $mdStore.blocks.find(resourceInList(bulkSelection[0]));
      if (!block) return;
      if (block.contentType === NodeType.SIMPLE_TEXT && !block.body) {
        mdStore.alterBlock({
          action: BlockAction.CONVERT,
          data: { toType },
          blockId: block.id
        });
      } else {
        mdStore.alterBlock({
          action: BlockAction.INSERT,
          data: { blockType: toType },
          blockId: block.id
        });
      }
      resolveBulkEditorInstance();
      globalBulkEditStore.select([]);
    }}
    onFocus={() => {
      if (bulkSelection.length === 1) mdStore.focusBlock(bulkSelection[0]);
    }}
  />
{/if}
