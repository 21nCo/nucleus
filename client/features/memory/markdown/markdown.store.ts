import {
  NodeType,
  type StructuralNodeType,
  structuralNodeTypes
} from "@nucleum/features/memory/node/node.type";
import { get, writable } from "svelte/store";
import { tick } from "svelte";
import {
  type IBlockInterface,
  type IMarkdownParams,
  type IMarkdownStore,
  type IMarkdown,
  type IBlockOperationContext,
  BlockAction,
  type IListBlockBody,
  type IListBlock,
  type IBlock
} from "@nucleum/features/memory/markdown/md.type";
import { Resource } from "@nucleum/datafn/resource.enum";
import { ObservableStore } from "@nucleum/stores/client.store";
import type { IRecordId } from "@nucleum/schema/legacy/data.type";
import { generateResourceId } from "@nucleum/datafn/id.utils";
import {
  isSameResource,
  resourceInList
} from "@nucleum/datafn/resource.utils";
import { logger } from "@nucleum/client/runtime/logging/logger";

/**
 * Used to identify if temporary s3 storage should be used or not, If true, temporary s3 storage is used
 */
export const isReplaceableMd = writable<boolean>(false);

const seedMdStore: IMarkdownStore = {
  blocks: [],
  headingsInView: []
};

export const mdContentChangeEvent = initMdContentChangeEvent();

function initMdContentChangeEvent() {
  const { subscribe, set, update } = writable<boolean>(false);
  return {
    subscribe,
    trigger: () => set(!get(mdContentChangeEvent))
  };
}
export type MdStoreType = InstanceType<typeof MarkdownStore>;
export const mdStores = new Map<string, MdStoreType>();
export function getMdStore(id: string) {
  if (!mdStores.has(id)) {
    mdStores.set(id, new MarkdownStore());
  }
  return mdStores.get(id)!;
}

class MarkdownStore extends ObservableStore<IMarkdownStore> {
  focus = writable<
    | { id?: IRecordId; params?: { xOffset?: number; isBottom?: boolean } }
    | undefined
  >(undefined);
  alter = writable<
    | { action: BlockAction; block?: IBlock; data?: any; blockId?: IRecordId }
    | undefined
  >(undefined);
  constructor() {
    super("markdownStore");
    this.set(seedMdStore);
  }

  reset() {
    this.set(seedMdStore);
  }

  load(md?: IMarkdown, params?: { isPreventFocus?: boolean }) {
    let isEmpty = !md || !md.blocks || md.blocks.length === 0;
    this.set({
      blocks: isEmpty
        ? [
            {
              id: generateResourceId(Resource.node),
              contentType: NodeType.SIMPLE_TEXT,
              body: ""
            }
          ]
        : md!.blocks,
      headingsInView: []
    });
    if (!params?.isPreventFocus) this.focus.set({ id: md?.blocks?.[0]?.id });
    if (isEmpty) mdContentChangeEvent.trigger();
  }

  setParams(params: IMarkdownParams) {
    this.update((store) => ({ ...store, params }));
  }

  /**
   * Inserts a new block after the context block
   * @param contextBlockId block to insert the new block after
   * @param params block type to insert, defaults to simple text
   */
  insert(params: IBlockOperationContext) {
    logger.log({ at: "MarkdownStore - insert", params });
    let newBlock: IBlock = {
      id: generateResourceId(Resource.node),
      body: params.body ?? "",
      contentType: NodeType.SIMPLE_TEXT
    };
    if (params.blockType && params.blockType != NodeType.NODULAR_MARKDOWN) {
      newBlock = {
        ...newBlock,
        contentType: params.blockType ?? NodeType.SIMPLE_TEXT
      } as IBlock;
    } else {
      newBlock = {
        ...newBlock,
        contentType: NodeType.SIMPLE_TEXT
      };
    }
    this.update((store) => {
      const contextBlockIndex = store.blocks.findIndex(
        resourceInList(params.source)
      );
      if (!newBlock) return store;
      store.blocks = [
        ...store.blocks.slice(0, contextBlockIndex + 1),
        newBlock,
        ...store.blocks.slice(contextBlockIndex + 1)
      ];
      this.focus.set({ id: newBlock.id, params: { xOffset: 0 } });
      // store = handleNodeMarkdownChildHierarchyChanges(store, id, newBlock, true);
      return store;
    });
    return newBlock.id;
  }

  insertMany(src: IRecordId, blocks: IBlock[]) {
    this.update((store) => {
      const contextBlockIndex = store.blocks.findIndex(resourceInList(src));
      store.blocks = [
        ...store.blocks.slice(0, contextBlockIndex + 1),
        ...blocks,
        ...store.blocks.slice(contextBlockIndex + 1)
      ];
      return store;
    });
  }

  /**
   * Inserts a structural block after the context block
   * @param contextBlockId block to insert the new block after
   * @param blockType type of structural block to insert
   */
  insertStructualBlock(
    contextBlockId: IRecordId,
    blockType: StructuralNodeType
  ) {
    const newBlockId = generateResourceId(Resource.node);
    this.update((store) => {
      const contextBlockIndex = store.blocks.findIndex(
        resourceInList(contextBlockId)
      );
      const resolvedBlockType =
        blockType === NodeType.DIVIDER || blockType === NodeType.DOUBLE_DIVIDER
          ? blockType
          : NodeType.DIVIDER;
      const newBlock: IBlock = {
        id: newBlockId,
        contentType: resolvedBlockType,
        body: ""
      };
      store.blocks = [
        ...store.blocks.slice(0, contextBlockIndex),
        newBlock,
        ...store.blocks.slice(contextBlockIndex)
      ];
      this.focus.set({ id: newBlock.id });
      return store;
    });
    return newBlockId;
  }

  deleteBlock(id: IRecordId, params?: { isPreventFocus?: boolean }) {
    this.update((n) => {
      const deleteIndex = n.blocks.findIndex(resourceInList(id));
      n.blocks = n.blocks.filter((b) => !isSameResource(b, id));
      if (deleteIndex && !params?.isPreventFocus)
        this.focus.set({
          id: n.blocks[deleteIndex - 1].id,
          params: {
            isBottom: true
          }
        });
      return n;
    });
  }

  deleteMany(ids: IRecordId[]) {
    this.update((n) => {
      n.blocks = n.blocks.filter((b) => !ids.some(resourceInList(b)));
      return n;
    });
  }

  shiftFocus(
    id: IRecordId,
    direction: "up" | "down",
    params?: { xOffset?: number }
  ) {
    this.update((n) => {
      const contextIndex = n.blocks.findIndex((b) => b.id === id);
      if (contextIndex === -1) return n;
      let siblingIndex =
        direction === "up" ? contextIndex - 1 : contextIndex + 1;
      let siblingBlock = n.blocks[siblingIndex];
      while (structuralNodeTypes.includes(siblingBlock?.contentType)) {
        siblingIndex = direction === "up" ? siblingIndex - 1 : siblingIndex + 1;
        siblingBlock = n.blocks[siblingIndex];
      }
      if (siblingIndex < 0 || siblingIndex > n.blocks.length - 1) return n;
      this.focus.set({
        id: siblingBlock.id,
        params: {
          ...params,
          isBottom: direction === "up"
        }
      });
      return n;
    });
  }

  move(id: IRecordId, direction: BlockAction.MOVEUP | BlockAction.MOVEDOWN) {
    let changedBlocks: IListBlock[] = [];
    this.update((n) => {
      const contextIndex = n.blocks.findIndex((b) => b.id === id);
      if (contextIndex === -1) return n;
      const siblingIndex =
        direction === BlockAction.MOVEUP ? contextIndex - 1 : contextIndex + 1;
      if (siblingIndex < 0 || siblingIndex > n.blocks.length - 1) return n;
      const currentBlock = n.blocks[contextIndex];
      const siblingBlock = n.blocks[siblingIndex];
      if (currentBlock.contentType === NodeType.ORDERED_LIST) {
        if (
          siblingBlock.contentType !== NodeType.ORDERED_LIST ||
          siblingBlock.body.indent !== currentBlock.body.indent
        )
          return n;
        const currentOrder = currentBlock.body.order;
        currentBlock.body.order = siblingBlock.body.order;
        siblingBlock.body.order = currentOrder;
        changedBlocks.push(currentBlock, siblingBlock);
      }
      n.blocks[contextIndex] = siblingBlock;
      n.blocks[siblingIndex] = currentBlock;
      return n;
    });
    tick().then(() => {
      this.focus.set({ id });
    });
    return changedBlocks;
  }

  duplicate(id: IRecordId) {
    let newBlock: IBlock;
    const md = this.get();
    const contextIndex = md.blocks.findIndex((b) => b.id === id);
    if (contextIndex === -1) return;
    const currentBlock = md.blocks[contextIndex];
    newBlock = {
      ...currentBlock,
      id: generateResourceId(Resource.node)
    };
    this.update((n) => {
      n.blocks = [
        ...n.blocks.slice(0, contextIndex + 1),
        newBlock,
        ...n.blocks.slice(contextIndex + 1)
      ];
      return n;
    });
    this.focus.set({ id: newBlock.id });
    return newBlock;
  }

  focusBlock(id: IRecordId, params?: { xOffset?: number; isBottom?: boolean }) {
    this.focus.set({ id, params });
  }

  alterBlock(params?: {
    action: BlockAction;
    block?: IBlock;
    data?: any;
    blockId?: IRecordId;
  }) {
    this.alter.set(params);
  }

  isFirstBlockAndIsEmpty(id: IRecordId) {
    let isFirstBlock = false;
    let isEmpty = false;
    const md = this.get();
    const firstBlock = md.blocks[0];
    isFirstBlock = isSameResource(firstBlock, id);
    if (isFirstBlock) {
      if (md.blocks.length > 1) {
        isEmpty = false;
      } else if (firstBlock.contentType === NodeType.SIMPLE_TEXT) {
        isEmpty = !firstBlock.body;
      } else if (firstBlock.contentType === NodeType.LIST) {
        isEmpty = !firstBlock.body.text;
      }
    }
    return isFirstBlock && isEmpty;
  }

  isFirstBlock(id: IRecordId) {
    const md = this.get();
    return isSameResource(md.blocks[0], id);
  }

  isLastBlock(id: IRecordId) {
    const md = this.get();
    return isSameResource(md.blocks[md.blocks.length - 1], id);
  }

  getPreviousSibling(id: IRecordId) {
    const md = this.get();
    const contextIndex = md.blocks.findIndex(resourceInList(id));
    return md.blocks[contextIndex - 1];
  }

  setActiveHeading(id: IRecordId) {
    this.update((n) => {
      const closestHeading = findNearestHeading(n.blocks, id);
      n.activeHeading = closestHeading?.id;
      return n;
    });

    function findNearestHeading(blocks: IBlock[], id: IRecordId) {
      let contextIndex = blocks.findIndex(resourceInList(id));
      let contextBlock = blocks[contextIndex];
      while (
        !contextBlock?.contentType?.includes("HEADING") &&
        contextIndex >= 0
      ) {
        contextBlock = blocks[contextIndex - 1];
        contextIndex--;
      }
      return contextBlock;
    }
  }

  /**
   * Returns the parent of the block with the given id and the parent's indent is equal to the given indent
   * @param id id of the block to get the parent of
   * @param indent the indent of the parent
   * @returns the parent of the list block of type ordered list
   */
  getListParentOrdered(id: IRecordId, indent: number) {
    const md = this.get();
    let parent = getImmediateParent(id);
    while (parent && parent.body.indent !== indent) {
      parent = getImmediateParent(parent?.id);
    }
    return parent;

    function getImmediateParent(id: IRecordId | undefined) {
      if (!id) return undefined;
      const contextIndex = md.blocks.findIndex(resourceInList(id));
      const contextBlock = md.blocks[contextIndex];
      if (contextBlock.contentType !== NodeType.ORDERED_LIST) return undefined;
      for (let i = contextIndex; i >= 0; i--) {
        const block = md.blocks[i];
        if (
          block.contentType === NodeType.ORDERED_LIST &&
          block.body.indent < contextBlock.body.indent
        )
          return block;
      }
    }
  }

  reconcileOrderedListOnDrag(id: IRecordId) {
    try {
      const md = this.get();
      const contextIndex = md.blocks.findIndex(resourceInList(id));
      const contextBlock = md.blocks[contextIndex];
      if (contextBlock.contentType !== NodeType.ORDERED_LIST) return;
      let traverseIndex = contextIndex - 1;
      let traversalBlock = md.blocks[traverseIndex];
      let preceeding = [];
      while (
        traversalBlock?.contentType === NodeType.ORDERED_LIST &&
        traverseIndex >= 0
      ) {
        preceeding.unshift(traversalBlock);
        traverseIndex--;
        traversalBlock = md.blocks[traverseIndex];
      }
      const succeeding = [];
      traverseIndex = contextIndex + 1;
      traversalBlock = md.blocks[traverseIndex];
      while (
        traversalBlock?.contentType === NodeType.ORDERED_LIST &&
        traverseIndex < md.blocks.length
      ) {
        succeeding.push(traversalBlock);
        traverseIndex++;
        traversalBlock = md.blocks[traverseIndex];
      }
      const set = [...preceeding, contextBlock, ...succeeding];
      const rootLevel = set.filter((b) => b.body.indent === 0);
      const modifiedRootLevel = rootLevel.map((b, index) => ({
        ...b,
        body: { ...b.body, order: index + 1 }
      }));

      let previousIndent = 0;
      let modifiedSubLevel: IListBlock[] = [];
      set.forEach((b, index) => {
        if (b.body.indent > previousIndent) {
          let operatingSet: IListBlock[] = [];
          operatingSet.push(b);
          for (let i = index + 1; i < set.length; i++) {
            if (set[i].body.indent === b.body.indent) {
              operatingSet.push(set[i]);
            }
            if (set[i].body.indent < b.body.indent) break;
          }
          operatingSet = operatingSet.map((b, index) => ({
            ...b,
            body: { ...b.body, order: index + 1 }
          }));
          modifiedSubLevel.push(...operatingSet);
        }
        previousIndent = b.body.indent;
      });

      let changedBlocks: IListBlock[] = [];
      this.update((n) => {
        [...modifiedRootLevel, ...modifiedSubLevel].forEach((b) => {
          const existingBlockIndex = n.blocks.findIndex(resourceInList(b.id));
          if (
            existingBlockIndex !== -1 &&
            typeof n.blocks[existingBlockIndex].body !== "string" &&
            "order" in n.blocks[existingBlockIndex].body &&
            n.blocks[existingBlockIndex].body.order !== b.body.order
          ) {
            changedBlocks.push(b);
            n.blocks[existingBlockIndex] = b;
          }
        });
        return n;
      });
      return changedBlocks;
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  reconcileOrderedList(
    id: IRecordId,
    body: IListBlockBody,
    action: BlockAction.TAB | BlockAction.SHIFT_TAB,
    replacedOrder: number
  ) {
    const md = this.get();
    const contextIndex = md.blocks.findIndex(resourceInList(id));
    const contextBlock = md.blocks[contextIndex];
    if (contextBlock.contentType !== NodeType.ORDERED_LIST) return;
    const succeedingBlock = md.blocks[contextIndex + 1];
    if (
      !succeedingBlock ||
      succeedingBlock.contentType !== NodeType.ORDERED_LIST
    )
      return;
    let changedBlocks: IListBlock[] = [];
    orderAll((body.order ?? 0) + 1, body.indent);
    if (succeedingBlock.body.indent > body.indent) {
      orderAll(1, succeedingBlock.body.indent);
    }
    if (action === BlockAction.TAB) {
      orderAll(replacedOrder, body.indent - 1);
    }
    this.update((n) => {
      n.blocks = n.blocks.map((b) => {
        if (changedBlocks.some(resourceInList(b.id)))
          return {
            ...b,
            body: { ...changedBlocks.find(resourceInList(b.id))?.body }
          } as IBlock;
        return b;
      });
      return n;
    });
    return changedBlocks;

    function orderAll(from: number, targetIndent: number) {
      const index = contextIndex + 1;
      for (let i = index; i < md.blocks.length; i++) {
        const block = md.blocks[i];
        if (
          block.contentType !== NodeType.ORDERED_LIST ||
          block.body.indent < targetIndent
        )
          break;
        if (block.body.indent !== targetIndent) continue;
        block.body.order = from++;
        changedBlocks.push(block);
      }
    }
  }
}
