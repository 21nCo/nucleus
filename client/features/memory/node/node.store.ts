import { Resource } from "@nucleum/datafn/resource.enum";
import { LinkType } from "@nucleum/features/memory/linking/link.type";
import {
  type IActiveNode,
  type INode,
  NodeType,
  type INodeLinkThumb,
  canHaveTraces,
  NodeView,
  headingNodeTypes,
  mediaNodeTypeList,
  socialPostNodeTypeList
} from "@nucleum/features/memory/node/node.type";
import { ResourcePanelType } from "@nucleum/application/resource/resource-panel.type";
import { ActiveResourceStore } from "@nucleum/application/record/active-resource.store";
import { PanelSwitcherMixin } from "@nucleum/application/resource/panelSwitcher.mixin";
import {
  activeResourceFilterIgnoreAncestorInactive
} from "@21n/utils/utils";
import { AccessMode, ResourceAccessPoint, type IResourceMutationParams } from "@nucleum/datafn/resource.type";
import { ResourceActionType } from "@nucleum/schema/legacy/resource-action.enum";
import { ResourceActions } from "@nucleum/application/record/resource.actions";
import { get, writable } from "svelte/store";
import { ContextMenuType, type IContextMenu, type IContextMenuItem } from "@21n/elements/contextMenu/context-menu.type";
import { logger } from "@nucleum/client/runtime/logging/logger";
import { resolveCollectionTypes } from "@nucleum/features/collections/collection.utils";
import type { IRecordId } from "@nucleum/schema/legacy/data.type";
import type { IToggleItem } from "@21n/elements/toggle/toggle.type";
import { generateMarkdownText } from "@nucleum/features/memory/node/node.utils";
import {
  resourceInList,
  isSameResource,
  isRecordId,
  removeDuplicatesFilter,
  determineResourceType
} from "@nucleum/datafn/resource.utils";

import context from "@nucleum/stores/context.store";
import { Embed } from "@nucleum/client/runtime/context.type";
import { isValidArrayWithData } from "@21n/shared-utils/obj.utils";
import { fileStore } from "@nucleum/features/files/file.store";
import { recursivelyExtractAllChildrenIntoArray } from "@nucleum/features/memory/markdown/markdown.utils";
import view from "@nucleum/stores/view.store";
import { CollectibleStore } from "@nucleum/features/collections/collectible.store";
import { appStore } from "@nucleum/stores/app.store";
import type { ILink } from "@nucleum/features/memory/linking/link.type";
import { toasts } from "@nucleum/stores/notification.store";
import { datafn } from "@nucleum/datafn/datafn.store";

export const hierarchyFactorLimit = 5;
const defaults: Partial<INode> = {
  metaType: "",
  contentType: NodeType.UNKNOWN
};

type NodeWithExpandedChildren = INode & {
  children?: INode[];
};

function linkId(from: IRecordId, to: IRecordId, linkType: LinkType = LinkType.DIRECT) {
  return `${from.toString()}|${to.toString()}|${linkType}`;
}

function isNodeId(id: IRecordId | undefined) {
  return id?.toString().startsWith(`${Resource.node}:`);
}

function normalizeNodeRelationLink(sourceId: IRecordId, row: Record<string, any>) {
  const from = (row.in ?? row.from ?? sourceId).toString();
  const to = (row.out ?? row.to ?? row.id)?.toString();
  if (!to) return undefined;
  const metadata = row.$relation_metadata ?? row;
  const linkType = metadata.linkType ?? LinkType.DIRECT;
  return {
    id: linkId(from, to, linkType),
    in: from,
    out: to,
    linkType,
    tags: metadata.tags ?? [],
    location: metadata.location,
    metadata: metadata.metadata,
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt,
    createdBy: metadata.createdBy,
    updatedBy: metadata.updatedBy
  } as ILink;
}

function pruneUndefined(input: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  );
}

function resolveDate(value: unknown) {
  if (value instanceof Date) return value;
  if (typeof value === "number" || typeof value === "string")
    return new Date(value);
  return undefined;
}

function normalizeNodeRecord(input: Record<string, unknown>) {
  const record = { ...input } as Record<string, unknown>;
  const createdAt = resolveDate(record.createdAt);
  const updatedAt = resolveDate(record.updatedAt);
  if (createdAt) record.createdAt = createdAt;
  record.updatedAt = updatedAt ?? createdAt ?? new Date();
  return record as unknown as INode;
}

function normalizeMdChildOrderIds(mdChildOrder: unknown) {
  if (!Array.isArray(mdChildOrder)) return [];
  return mdChildOrder
    .map((child) => {
      if (typeof child === "string") return child;
      if (child && typeof child === "object" && "id" in child) {
        return (child as { id?: unknown }).id;
      }
      return undefined;
    })
    .filter((child): child is IRecordId => typeof child === "string");
}

function resolveMarkdownParentFields(mdParent: unknown) {
  if (!Array.isArray(mdParent)) return {};
  const parents = mdParent.filter(
    (parent): parent is IRecordId => typeof parent === "string"
  );
  const parent = parents[parents.length - 1];
  if (!parent) return { parent: undefined, parentPath: undefined };
  return {
    parent,
    parentPath: parents.join("-")
  };
}

function resolveBlockParentFields(mdParent: unknown, fallbackParent: IRecordId) {
  const parentChain = Array.isArray(mdParent)
    ? mdParent.filter(
        (parent): parent is IRecordId => typeof parent === "string"
      )
    : [];
  const resolvedMdParent =
    parentChain.length > 0 ? parentChain : [fallbackParent];
  return {
    mdParent: resolvedMdParent,
    ...resolveMarkdownParentFields(resolvedMdParent)
  };
}

async function queryNodes(params: any) {
  const result = await datafn.node.query(params);
  return (result.data ?? []).map(normalizeNodeRecord);
}

async function selectNode(
  id: IRecordId,
  select?: string[],
  params?: { signal?: AbortSignal }
) {
  const result = (await datafn.node.select(id.toString(), {
    select,
    signal: params?.signal,
    metadata: {
      includeTrashed: true,
      includeArchived: true
    }
  })) as Record<string, unknown> | undefined;
  if (!result) return undefined;
  return normalizeNodeRecord(result);
}

async function expandNodeMdChildOrder(
  mdChildOrder: Array<IRecordId | INode>,
  parentId?: IRecordId,
  seen = new Set<IRecordId>()
): Promise<INode[]> {
  if (mdChildOrder.some((child) => child && typeof child === "object")) {
    return nestExpandedNodeChildren(
      mdChildOrder.filter(Boolean) as INode[],
      parentId
    );
  }
  const childIds = mdChildOrder
    .filter(
      (childId): childId is IRecordId =>
        typeof childId === "string" && !seen.has(childId)
    )
    .map((childId) => {
      seen.add(childId);
      return childId;
    });
  const childRecords = await queryNodes({
    select: ["*", "parent.*", "file.*"],
    filters: {
      id: {
        $in: childIds.map((childId) => childId.toString())
      }
    },
    metadata: {
      includeTrashed: true,
      includeArchived: true
    }
  });
  const childById = new Map(
    childRecords.map((child) => [child.id.toString(), child])
  );
  const nodes = (
    await Promise.all(
      childIds.map(async (childId) => {
        const child = childById.get(
          childId.toString()
        ) as NodeWithExpandedChildren | undefined;
        if (!child) return undefined;
        if (child.mdChildOrder && Array.isArray(child.mdChildOrder)) {
          child.children = await expandNodeMdChildOrder(
            child.mdChildOrder,
            child.id,
            seen
          );
        }
        return child;
      })
    )
  ).filter(Boolean) as INode[];
  return nodes;
}

function resolveDirectNodeParentId(child: INode) {
  if (typeof child.parent === "string") return child.parent;
  if (
    typeof (child as INode & { parentPath?: string }).parentPath === "string"
  ) {
    const parents = (child as INode & { parentPath?: string }).parentPath
      ?.split("-")
      .filter(Boolean);
    return parents?.[parents.length - 1];
  }
  if (Array.isArray(child.mdParent)) {
    const parents = child.mdParent.filter(
      (item): item is IRecordId => typeof item === "string"
    );
    return parents[parents.length - 1];
  }
  return undefined;
}

function nestExpandedNodeChildren(
  children: INode[],
  parentId?: IRecordId
): INode[] {
  const byId = new Map(
    children.map((child) => [child.id, { ...child, children: [] as INode[] }])
  );
  const roots: INode[] = [];
  for (const child of byId.values()) {
    const directParentId = resolveDirectNodeParentId(child);
    const parent = directParentId ? byId.get(directParentId) : undefined;
    if (parent) {
      parent.children = [...(parent.children ?? []), child];
    } else if (!parentId || directParentId === parentId) {
      roots.push(child);
    }
  }
  return roots.length > 0 ? roots : children;
}

async function fetchNode(id: IRecordId) {
  const response = (await selectNode(id, [
    "*",
    "parent.*",
    "file.*",
    "collections",
    "mdChildOrder"
  ])) as NodeWithExpandedChildren | undefined;
  if (response?.mdChildOrder && Array.isArray(response.mdChildOrder)) {
    response.children = await expandNodeMdChildOrder(
      response.mdChildOrder,
      response.id
    );
  }
  return response;
}

async function queryNodeLinksForNode(id: IRecordId) {
  const nodeId = id.toString();
  const relationQuery = {
    select: ["#"],
    metadata: {
      includeTrashed: true,
      includeArchived: true
    }
  };
  const [outgoingResult, incomingResult] = (await Promise.all([
    datafn.node.relation("links").query(nodeId, relationQuery),
    datafn.node.relation("backlinks").query(nodeId, relationQuery)
  ])) as Array<{
    data?: Record<string, any>[];
  }>;
  const outgoing =
    (outgoingResult.data ?? [])
      .map((row) => normalizeNodeRelationLink(nodeId, row))
      .filter((link): link is ILink => Boolean(link));
  const incoming =
    (incomingResult.data ?? [])
      .map((row) => normalizeNodeRelationLink(nodeId, row))
      .filter((link): link is ILink => Boolean(link))
      .filter((link) => link.out?.toString() === nodeId);
  return Array.from(
    new Map(
      [...outgoing, ...incoming]
        .filter(
          (link) =>
            link.in?.toString() === nodeId || link.out?.toString() === nodeId
        )
        .filter((link) => {
          const linkedId = link.in?.toString() === nodeId ? link.out : link.in;
          return isNodeId(linkedId);
        })
        .map((link) => [link.id.toString(), link])
    ).values()
  );
}

export async function downloadNode(node: IRecordId | INode) {
  let file;
  if (isRecordId(node)) {
    const result = await selectNode(node as IRecordId);
    if (result?.file) {
      file = result.file;
    }
  } else if (typeof node === "object" && "file" in node) {
    file = node.file;
  }
  if (file) {
    return fileStore.download(file);
  }
}

async function resolveNodeDependencies(ids: IRecordId[]) {
  const [childrenResult, ...mdChildrenResult] = (await datafn.query([
    {
      resource: Resource.node,
      select: ["id"],
      filters: {
        parent: { $in: ids.map((id) => id.toString()) }
      },
      metadata: {
        includeTrashed: true,
        includeArchived: true
      }
    },
    ...ids.map((id) => ({
      resource: Resource.node,
      select: ["id"],
      filters: {
        mdParent: {
          $contains: id.toString()
        }
      },
      metadata: {
        includeTrashed: true,
        includeArchived: true
      }
    }))
  ])) as Array<{ data?: Record<string, unknown>[] }>;
  return [
    ...((childrenResult.data ?? []).map(normalizeNodeRecord) ?? []),
    ...mdChildrenResult.flatMap(
      (result) => result.data?.map(normalizeNodeRecord) ?? []
    )
  ];
}

async function onNodeParentChange(ids: IRecordId[], status: boolean) {
  try {
    const children = await resolveNodeDependencies(ids);
    if (!children || children.length === 0) return;
    const childrenIds = children.map((g: INode) => g.id)?.filter(Boolean);
    if (!childrenIds || childrenIds.length === 0) return;
    await datafn.node.mutate(
      childrenIds.map((id) => ({
        operation: "merge",
        id,
        record: {
          isAncestorInactive: status
        }
      }))
    );
  } catch (e) {
    logger.error({ at: "onParentChange - node", error: e });
  }
}

export async function onNodeArchive(ids: IRecordId[]) {
  return onNodeParentChange(ids, true);
}

export async function onNodeUnarchive(ids: IRecordId[]) {
  return onNodeParentChange(ids, false);
}

export async function onNodeTrash(ids: IRecordId[]) {
  return onNodeParentChange(ids, true);
}

export async function onNodeRestore(ids: IRecordId[]) {
  return onNodeParentChange(ids, false);
}

export type IActiveNodeStore = InstanceType<typeof ActiveNodeStore>;

export class ActiveNodeStore extends CollectibleStore<
  INode,
  IActiveNode
> {
  eventStore: any;

  constructor(node: IRecordId) {
    super(node);
    this.eventStore = resolveActiveNodeEventStore(node.toString());
  }

  /**
   *
   * For changes to markdown child order - using isModifyAsSystem: true in additionalParams - since when structure changes are happeneing - currently structure is being updated for all heading nodes in the markdown and therefore all of the heading nodes are being perceived as recents in recentStore due to updatedAt being updated.
   *
   * @param id
   * @param changedProps
   * @returns
   */
  updateBlockPropagator = async (
    id: IRecordId,
    changedProps: Partial<INode>,
    params?: IResourceMutationParams
  ) => {
    logger.log({
      at: "ActiveNodeStore.updateBlockPropagator",
      changedProps,
      id: id.toString()
    });
    if ("mdChildOrder" in changedProps) {
      const childIds = normalizeMdChildOrderIds(changedProps.mdChildOrder);
      const node = this.get();
      const markdownBlocks = node.md?.blocks ?? node.blocks ?? [];
      const childrenNodes = markdownBlocks.filter(
        (x) => x.id && childIds.some(resourceInList(x.id))
      );

      const currentNodeResult = await datafn.node.query({
        filters: { id },
        limit: 1,
        metadata: {
          includeTrashed: true,
          includeArchived: true
        }
      } as any);
      const currentNode = currentNodeResult.data?.[0] as INode | undefined;
      if (!currentNode) return;
      const mdText = generateMarkdownText(childrenNodes);
      logger.log({
        at: "ActiveNodeStore.updateBlockPropagator - end",
        changedProps,
        mdText,
        id: id.toString()
      });
      const result = await datafn.node.mutate({
        operation: "merge",
        id,
        record: pruneUndefined({
          id,
          ...changedProps,
          mdChildOrder: childIds,
          text: mdText
        } as Record<string, unknown>),
        context: params?.context,
        debounceKey: params?.debounceKey,
        debounceMs: params?.isDebounced ? 1500 : undefined,
        system: params?.isModifyAsSystem ?? true
      });
      return result;
    }
    const result = await datafn.node.mutate({
      operation: "merge",
      id,
      record: pruneUndefined({
        id,
        ...changedProps,
        ...resolveMarkdownParentFields(changedProps.mdParent)
      } as Record<string, unknown>),
      context: params?.context,
      debounceKey: params?.debounceKey,
      debounceMs: params?.isDebounced ? 1500 : undefined,
      system: params?.isModifyAsSystem
    });
    return result;
  };

  async modify(val: Partial<INode>, params?: IResourceMutationParams) {
    const shouldUpdateActive = !params?.isPreventBackPropagation;
    const previous = shouldUpdateActive ? this.get() : undefined;
    if (shouldUpdateActive) {
      this.update((prev) => ({ ...prev, ...val }) as IActiveNode);
    }
    try {
      await this.updateBlockPropagator(this.id, val, params);
    } catch (error) {
      if (previous) this.set(previous);
      throw error;
    }
  }

  init = async (params: {
    accessMode: AccessMode;
    accessPoint: ResourceAccessPoint;
    panel?: ResourcePanelType;
  }) => {
    logger.log({ at: "ActiveNodeStore.init", id: this.id });
    try {
      const node = await fetchNode(this.id);
      if (!node || !node.id) {
        return {
          error: "Node not found"
        };
      }
      const defaultPanel =
        node.contentType === NodeType.NODULAR_MARKDOWN
          ? ResourcePanelType.CONTENT
          : ResourcePanelType.OVERVIEW;
      this.set({
        ...node,
        defaultPanel,
        accessMode: params.accessMode,
        panel: params.panel ?? defaultPanel,
        switchPanel: (panel?: string) => {
          this.update((prev) => ({ ...prev, panel: panel ?? prev.panel }));
        },
        closeEditMode: () => {
          this.update((prev) => ({ ...prev, isInEditMode: false }));
        }
      } as IActiveNode);
      if (
        params.accessPoint === ResourceAccessPoint.CALENDAR ||
        !node.metaType
      ) {
        appStore.addToRecents({
          record: node,
          type: Resource.node,
          timestamp: new Date()
        });
      }
      let blocks: INode[] = [];
      if (
        node.contentType === NodeType.NODULAR_MARKDOWN ||
        headingNodeTypes.includes(node.contentType)
      ) {
        blocks = recursivelyExtractAllChildrenIntoArray(
          node as IActiveNode
        ) as INode[];
      }
      if (blocks.some((x) => !x?.id)) {
        return {
          error: "Node has invalid blocks"
        };
      }
      let types: any[] = [];
      if (params.accessPoint !== ResourceAccessPoint.CALENDAR) {
        types = await resolveCollectionTypes(node.collections ?? []);
      }
      this.update((n) => {
        n.types = types;
        n.blocks = blocks;
        return n;
      });
    } catch (e) {
      logger.error({ at: "node.store fetch", e });
    }
  };

  afterInit = async () => {
    try {
      const node = this.get();
      const linksResult = await queryNodeLinksForNode(this.id);
      if (linksResult && isValidArrayWithData(linksResult)) {
        let uniqueLinkIds = new Set();
        linksResult.forEach((x: ILink) => {
          const id = x.in.toString() === this.id ? x.out : x.in;
          uniqueLinkIds.add(id);
        });
        const links: INodeLinkThumb[] = Array.from(uniqueLinkIds).map((id) => {
          const allLinks = linksResult.filter(
            (y) => y.out === id || y.in === id
          );
          return {
            linkedTo: id,
            links: allLinks.map((y) => ({
              id: y.id,
              linkType: y.linkType,
              direction: y.in.toString() === this.id ? "outgoing" : "incoming",
              tags: y.tags
            })),
            tags: allLinks
              .map((y) => y.tags)
              .flat()
              .filter(Boolean)
              .filter(removeDuplicatesFilter)
          } as INodeLinkThumb;
        });
        this.update((n) => {
          n.links = links;
          return n;
        });
      }
      if (canHaveTraces.includes(node.contentType)) {
        const result = await queryNodes({
          filters: {
            parent: this.id.toString()
          }
        });
        let clips: any[] = [];
        if (result && isValidArrayWithData(result)) {
          clips = result.filter(activeResourceFilterIgnoreAncestorInactive);
        }
        if (
          [NodeType.YOUTUBE_VIDEO, NodeType.YOUTUBE_SHORT].includes(
            node.contentType
          ) &&
          clips &&
          Array.isArray(clips)
        ) {
          clips.sort((a, b) => a.body.timestamp - b.body.timestamp);
        }
        this.update((n) => {
          n.clips = clips;
          return n;
        });
      }
    } catch (e) {
      logger.error({ at: "ActiveNodeStore.afterInit", error: e });
    }
  };

  updateBlock = (
    id: IRecordId,
    changedProps: any,
    params?: {
      isDebounced?: boolean;
      debounceKey?: string;
    }
  ) => {
    if (!params?.isDebounced) {
      return this.updateBlockPropagator(id, changedProps);
    }
    const mutationId = `${id.toString()}-${params.debounceKey ?? "block"}`;
    return this.updateBlockPropagator(id, changedProps, {
      isDebounced: true,
      debounceKey: mutationId
    });
  };

  createBlock = async (
    id: IRecordId,
    contentType: any,
    params?: { body?: any; mdParent?: IRecordId[] }
  ) => {
    logger.log({ at: "ActiveNodeStore.createBlock", id, contentType, params });
    await datafn.node.mutate({
      operation: "insert",
      id,
      record: {
        id,
        ...defaults,
        contentType,
        creationContext: this.id,
        ...resolveBlockParentFields(params?.mdParent, this.id),
        body: params?.body,
        label: ""
      }
    });
    return queryNodes({
      filters: { id },
      limit: 1
    });
  };

  createBlocks = async (
    blocks: {
      id: IRecordId;
      contentType: NodeType;
      body: any;
      label?: string;
      mdParent?: IRecordId[];
    }[]
  ) => {
    await datafn.node.mutate(
      blocks.map((x) => ({
        operation: "insert",
        id: x.id,
        record: {
          id: x.id,
          ...defaults,
          contentType: x.contentType,
          creationContext: this.id,
          ...resolveBlockParentFields(x.mdParent, this.id),
          body: x.body,
          label: x.label ?? ""
        }
      }))
    );
    return queryNodes({
      filters: {
        id: blocks.map((block) => block.id)
      }
    });
  };

  deleteBlock = async (id: IRecordId) => {
    const result = await datafn.node.mutate({
      operation: "trash",
      id
    });
    await onNodeTrash([id]);
    return result;
  };

  deleteMany = async (ids: IRecordId[]) => {
    const result = await datafn.node.mutate(
      ids.map((id) => ({
        operation: "trash",
        id
      }))
    );
    await onNodeTrash(ids);
    return result;
  };

  mention = async (
    location: string,
    id: string,
    params?: { tags?: IRecordId[] }
  ) => {
    const fromResource = determineResourceType(this.id);
    const toResource = determineResourceType(id);
    const result = await datafn.table(fromResource).mutate({
      operation: "relate",
      id: this.id.toString(),
      relations: {
        links: [
          {
            $ref: id.toString(),
            fromResource: fromResource.toString(),
            toResource: toResource.toString(),
            linkType: LinkType.MENTION,
            location,
            tags: params?.tags
          }
        ]
      }
    } as any);
    if (!result) return;
    this.update((n) => ({
      ...n,
      links: [
        ...(n.links ?? []),
        {
          linkedTo: id,
          linkType: LinkType.MENTION,
          direction: "outgoing",
          id: linkId(this.id, id, LinkType.MENTION)
        }
      ]
    }));
  };
  unmention = async (location: string, id: string) => {
    const fromResource = determineResourceType(this.id);
    const result = await datafn.table(fromResource).mutate({
      operation: "unrelate",
      id: this.id.toString(),
      relations: {
        links: [
          {
            $ref: id.toString(),
            linkType: LinkType.MENTION
          }
        ]
      }
    } as any);
    this.update((n) => ({
      ...n,
      links: n.links?.filter(
        (x) =>
          !(isSameResource(x.linkedTo, id) && x.linkType === LinkType.MENTION)
      )
    }));
  };

  async linkCollection(id: IRecordId) {
    const node = this.get();
    return super.linkCollection(id, node.focusedBlock ?? node.id);
  }

  async unlinkCollection(id: IRecordId) {
    const node = this.get();
    return super.unlinkCollection(id, node.focusedBlock ?? node.id);
  }

  /**
   * Sets the focused block and parent for the focused block.
   *
   * This is triggered in both the cases of focusing from markdown and breadcrumbs.
   *
   * @param id
   * @param parent
   */
  onFocus(id: IRecordId, parent: IRecordId[]) {
    logger.debug({ at: "ActiveNodeStore.onFocus", id, parent });
    //TODO - refresh collections, links, types
    this.update((n) => {
      n.focusedBlock = id;
      n.mdParent = [...parent, id];
      return n;
    });
  }
  unFocus() {
    //TODO - refresh collections, links, types
    this.update((n) => {
      n.focusedBlock = undefined;
      n.mdParent = [];
      return n;
    });
  }

  /**
   * @deprecated - fetching directly in node.fetch
   * @returns
   */
  async fetchLinks() {
    const node = this.get();
    let id = node.id;
    if (node.focusedBlock) id = node.focusedBlock;
    const links = await queryNodeLinksForNode(id);
    const to = links.filter((link) => link.in?.toString() === id.toString());
    const from = links.filter((link) => link.out?.toString() === id.toString());
    const response = {
      from,
      to
    };
    logger.log({ at: "ActiveNodeStore.resolveLinks", response });
    return response;
  }

  /**
   *
   * Note: The md needs to be loaded from NodularMarkdown on init.
   */
  resolveExportContent(): string {
    const node = this.get();
    logger.log({ at: "ActiveNodeStore.resolveExportContent", node });
    if (!node || node?.contentType !== NodeType.NODULAR_MARKDOWN) return "";
    return node.md?.blocks
      ? generateMarkdownText(node.md.blocks, { isIncludeNonSearchBlocks: true })
      : "";
  }

  switchPanel!: (panel: string) => void;

  toggleCoverPicker(val?: boolean) {
    this.update((n) => {
      n.isShowCoverPicker = val ?? !n.isShowCoverPicker;
      return n;
    });
  }

  static resolve<T extends ActiveResourceStore<any, any>>(
    this: new (id: IRecordId) => T,
    id: IRecordId
  ): T {
    if (!ActiveNodeStore.prototype.switchPanel) {
      ActiveNodeStore.prototype.switchPanel = PanelSwitcherMixin.switchPanel;
    }

    const instance = super.resolve.call(this, id) as T & {
      switchPanel?: (panel: string) => void;
    };

    if (!instance.switchPanel) {
      instance.switchPanel = PanelSwitcherMixin.switchPanel;
    }

    return instance as T;
  }
}

const activeNodeEventStores = new Map<string, any>();

export function resolveActiveNodeEventStore(id: string) {
  if (!activeNodeEventStores.has(id)) {
    activeNodeEventStores.set(id, initActiveNodeEventStore(id));
  }
  let val = activeNodeEventStores.get(id);
  return val!;
}

/**
 * Node event store is used as a sub store in active node store to communicate between remote node UI components like in the case of click events from breadcrumbs to relay it to the markdown component.
 * @param id
 * @returns
 */
function initActiveNodeEventStore(id: string) {
  const { subscribe, set, update } = writable<
    { event: MouseEvent; id: string } | undefined
  >();
  return {
    subscribe,
    set,
    update,
    reset: () => {
      set(undefined);
    }
  };
}

const nodeStaticActions = {
  metadataPane: {
    value: ResourcePanelType.METADATA,
    icon: "ph:file-light",
    label: "Metadata",
    tooltip: "Show metadata"
  },
  propertiesPane: {
    value: ResourcePanelType.PROPERTIES,
    icon: "shapes",
    label: "Properties",
    tooltip: "Show properties"
  },
  activityPane: {
    value: ResourcePanelType.ACTIVITY,
    icon: "activity",
    label: "Activity",
    tooltip: "Show activity"
  },
  showForks: {
    value: "forks",
    icon: "ph:git-fork-light",
    tooltip: "Show forks"
  }
};
class NodeActions {
  constructor(private node: INode) {
    this.node = node;
  }

  download = {
    value: "download",
    icon: "ph:download-simple-light",
    callback: async () => {
      const file = this.node.file ?? this.node.body?.file;
      if (
        isRecordId(file) ||
        (typeof file === "object" && isRecordId(file.id))
      ) {
        await fileStore.download(file);
      }
    }
  };
  share = {
    value: "share",
    icon: "share",
    callback: async () => {}
  };
  export = {
    value: "export",
    icon: "share",
    callback: async () => {}
  };
  trashFromClipper = {
    value: ResourceActionType.DELETE,
    icon: "trash",
    callback: async () => {}
  };
  editNotesOnClipper = {
    value: ResourceActionType.EDIT_NOTES,
    label: "Edit notes",
    icon: "note",
    callback: async () => {}
  };
  editLinksOnClipper = {
    value: ResourceActionType.EDIT_LINKS,
    label: "Edit links",
    icon: "link",
    callback: async () => {}
  };
  editTitleOnClipper = {
    value: ResourceActionType.EDIT_TITLE,
    label: "Edit title",
    icon: "text",
    callback: async () => {}
  };
  goToResourceFromClipper = {
    value: ResourceActionType.OPEN,
    label: "Open in app",
    icon: "weblink-two",
    callback: async () => {}
  };

  setCoverPhoto() {
    return {
      value: ResourceActionType.SET_COVER_PHOTO,
      label: "Set cover photo",
      icon: "ph:image",
      callback: async () => {}
    };
  }

  removeCoverPhoto() {
    return {
      value: "removeCoverPhoto",
      label: "Remove cover photo",
      icon: "trash",
      callback: async () => {
        await datafn.node.mutate({
          operation: "merge",
          id: this.node.id,
          record: {
            cover: ""
          }
        });
        toasts.success("Cover photo removed");
      }
    };
  }

  copyHighlightText = {
    value: "copyHighlightText",
    label: "Copy content",
    icon: "copy",
    callback: async () => {
      const text = this.node.text || this.node.mdText || "";
      if (text) {
        await navigator.clipboard.writeText(text);
        toasts.success("Highlight text copied to clipboard");
      }
    }
  };

  sideNotesPane() {
    return {
      value: ResourcePanelType.SIDENOTES,
      icon: this.node.notes ? "note" : "note-blank",
      label: "Side notes",
      tooltip: "Side notes"
    };
  }

  linksPane() {
    return {
      value: ResourcePanelType.LINKS,
      icon: "link",
      label: "Links",
      tooltip: "Show links",
      count:
        "links" in this.node &&
        this.node.links &&
        Array.isArray(this.node.links) &&
        this.node.links.length > 0
          ? this.node.links?.length
          : undefined
    };
  }

  tracesPane() {
    return {
      value: ResourcePanelType.BOOKMARKS,
      icon: "bookmark",
      label: "Bookmarks",
      tooltip: "Show bookmarks",
      count:
        "clips" in this.node &&
        this.node.clips &&
        Array.isArray(this.node.clips) &&
        this.node.clips.length > 0
          ? this.node.clips?.length
          : undefined
    };
  }

  toggleFullWidth() {
    return {
      value: "toggleFullWidth",
      label: "Expand to full width",
      icon: "widen",
      type: ContextMenuType.SWITCH,
      initialValue: this.node.config?.isWidened,
      callback: async (checked: boolean) => {
        await datafn.node.mutate({
          operation: "merge",
          id: this.node.id,
          record: {
            config: {
              isWidened: checked
            }
          }
        });
      }
    };
  }
}

export function resolveNodeContextMenu(
  node: INode,
  accessPoint: ResourceAccessPoint,
  params?: {
    accessPointId?: IRecordId;
    accessMode?: AccessMode;
    accessPointContext?: string;
    nodeView?: NodeView;
    isConstrainedWidth?: boolean;
  }
): IContextMenu {
  const resourceActions = new ResourceActions(node, {
    accessPoint,
    accessMode: params?.accessMode,
    lifecycle: {
      onArchive: onNodeArchive,
      onUnarchive: onNodeUnarchive,
      onTrash: onNodeTrash,
      onRestore: onNodeRestore
    }
  });
  const nodeActions = new NodeActions(node);
  const isMediaNode = node.contentType !== NodeType.NODULAR_MARKDOWN;
  if (accessPoint === ResourceAccessPoint.CLIPPER) {
    return [
      {
        group: "all",
        items: [
          nodeActions.editNotesOnClipper,
          nodeActions.editLinksOnClipper,
          nodeActions.editTitleOnClipper,
          nodeActions.goToResourceFromClipper,
          nodeActions.trashFromClipper
        ]
      }
    ];
  }
  const ctx = get(context);
  const viewStore = get(view);
  let commonGroups: { group: string; items: IContextMenuItem[] }[] = [];
  const moreGroup = {
    group: "more",
    items: [resourceActions.archive(), resourceActions.trash()]
  };
  if (ctx.isEmbed && ctx.embed === Embed.HANDSET) {
    commonGroups = [moreGroup];
  } else if (
    accessPoint === ResourceAccessPoint.SELF &&
    params?.accessMode !== AccessMode.SPLIT &&
    !viewStore.isPortrait
  ) {
    commonGroups = [
      {
        group: "open",
        items: [resourceActions.openAsTab(), resourceActions.maximize()]
      },
      moreGroup
    ];
  } else if (
    accessPoint === ResourceAccessPoint.SELF &&
    params?.accessMode === AccessMode.INLINE &&
    viewStore.isPortrait
  ) {
    commonGroups = [
      {
        group: "open",
        items: [resourceActions.maximize()]
      },
      moreGroup
    ];
  } else {
    commonGroups = [
      {
        group: "open",
        items: [
          resourceActions.openAsTab(),
          resourceActions.openAsSplit(),
          resourceActions.maximize()
        ]
      },
      moreGroup
    ];
  }
  let mediaShareAndExportGroup = {
    group: "shareAndExport",
    items: [
      resourceActions.copyLink(),
      ...(node.url ? [resourceActions.copyExternalLink()] : [])
    ]
  };
  if (
    [...mediaNodeTypeList, NodeType.WEB_SCREENSHOT].includes(node.contentType)
  ) {
    mediaShareAndExportGroup.items.unshift(nodeActions.download);
  }
  const isTextBookmarkOrSocialPost =
    node.contentType === NodeType.WEB_TEXT_BOOKMARK ||
    node.contentType === NodeType.KINDLE_HIGHLIGHT ||
    socialPostNodeTypeList.has(node.contentType);
  if (isTextBookmarkOrSocialPost) {
    mediaShareAndExportGroup.items.unshift(nodeActions.copyHighlightText);
  }
  if (
    (accessPoint === ResourceAccessPoint.NODE_LINKS ||
      accessPoint === ResourceAccessPoint.DEFAULT_RIGHT_PANE_LINKS) &&
    params?.accessPointId
  ) {
    let baseItems = [
      resourceActions.copyLink(),
      ...(node.url ? [resourceActions.copyExternalLink()] : [])
    ];
    if (accessPoint === ResourceAccessPoint.NODE_LINKS) {
      baseItems.unshift(
        resourceActions.select(accessPoint, params?.accessPointId)
      );
      if (params?.accessPointContext === LinkType.DIRECT) {
        baseItems.unshift(resourceActions.unlink(params?.accessPointId));
      }
    }
    return [
      {
        group: "all",
        items: [...baseItems]
      },
      ...commonGroups
    ];
  } else if (accessPoint !== ResourceAccessPoint.SELF) {
    let primaryItems = [
      resourceActions.select(accessPoint, params?.accessPointId),
      resourceActions.star(),
      resourceActions.addToCollection(),
      resourceActions.link(),
      resourceActions.edit(accessPoint),
      resourceActions.copyLink(),
      ...(node.url ? [resourceActions.copyExternalLink()] : [])
    ];
    if (isTextBookmarkOrSocialPost) {
      primaryItems.splice(5, 0, nodeActions.copyHighlightText);
    }
    if (
      accessPoint === ResourceAccessPoint.COLLECTION &&
      params?.accessPointId
    ) {
      primaryItems = [
        resourceActions.unlink(params?.accessPointId),
        resourceActions.select(accessPoint, params?.accessPointId),
        resourceActions.star(),
        resourceActions.edit(accessPoint),
        resourceActions.copyLink(),
        ...(node.url ? [resourceActions.copyExternalLink()] : [])
      ];
    }
    return [
      {
        group: "all",
        items: [...primaryItems]
      },
      ...commonGroups
    ];
  } else if (params?.isConstrainedWidth && isMediaNode) {
    return [
      {
        group: "all",
        items: [
          resourceActions.star(),
          resourceActions.edit(accessPoint),
          ...(canHaveTraces.includes(node.contentType)
            ? [nodeActions.tracesPane()]
            : []),
          nodeActions.linksPane(),
          nodeActions.sideNotesPane(),
          nodeStaticActions.propertiesPane,
          nodeStaticActions.metadataPane
        ]
      },
      mediaShareAndExportGroup,
      ...commonGroups
    ];
  } else if (isMediaNode) {
    return [
      {
        group: "all",
        items: [
          resourceActions.star(),
          resourceActions.edit(accessPoint),
          nodeActions.linksPane(),
          nodeStaticActions.metadataPane,
          nodeStaticActions.propertiesPane
        ]
      },
      mediaShareAndExportGroup,
      ...commonGroups
    ];
  } else if (params?.nodeView === NodeView.BIRD) {
    return [
      {
        group: "all",
        items: [
          resourceActions.star(),
          nodeActions.linksPane(),
          nodeActions.sideNotesPane(),
          nodeStaticActions.propertiesPane,
          nodeStaticActions.metadataPane
        ]
      },
      mediaShareAndExportGroup,
      ...commonGroups
    ];
  }
  const toggleGroupItems =
    node.contentType === NodeType.NODULAR_MARKDOWN
      ? [resourceActions.starAsToggle(), resourceActions.toggleLock()]
      : [];

  const coverPhotoAction =
    node.contentType === NodeType.NODULAR_MARKDOWN
      ? node.cover
        ? nodeActions.removeCoverPhoto()
        : nodeActions.setCoverPhoto()
      : undefined;
  const secondGroupItems = viewStore.isConstrainedWidth
    ? [
        resourceActions.toggleReadMode(),
        nodeStaticActions.propertiesPane,
        nodeStaticActions.activityPane,
        nodeStaticActions.metadataPane,
        ...(coverPhotoAction ? [coverPhotoAction] : [])
      ]
    : [
        resourceActions.toggleReadMode(),
        nodeActions.toggleFullWidth(),
        nodeStaticActions.propertiesPane,
        nodeStaticActions.activityPane,
        nodeStaticActions.metadataPane,
        ...(coverPhotoAction ? [coverPhotoAction] : [])
      ];
  return [
    {
      group: "editModes",
      isToggleGroup: true,
      items: toggleGroupItems
    },
    {
      group: "all",
      items: secondGroupItems
    },
    {
      group: "shareAndExport",
      items: [
        resourceActions.copyLink(),
        ...(node.url ? [resourceActions.copyExternalLink()] : []),
        resourceActions.copyContents()
      ]
    },
    ...commonGroups
  ];
}

export function resolveVisibleActions(
  node: INode,
  params?: {
    accessMode?: AccessMode;
    isConstrainedWidth?: boolean;
  }
): IToggleItem[] {
  const nodeActions = new NodeActions(node);
  if (
    (node.contentType === NodeType.NODULAR_MARKDOWN ||
      headingNodeTypes.includes(node.contentType)) &&
    !params?.isConstrainedWidth
  ) {
    return [
      nodeActions.sideNotesPane()
      // nodeActions.showForks
    ];
  } else if (
    (node.contentType === NodeType.NODULAR_MARKDOWN ||
      headingNodeTypes.includes(node.contentType)) &&
    params?.isConstrainedWidth
  ) {
    return [
      nodeActions.linksPane(),
      nodeStaticActions.propertiesPane,
      nodeActions.sideNotesPane()
    ];
  }
  const baseActions: IToggleItem[] = [
    nodeActions.linksPane(),
    nodeStaticActions.propertiesPane,
    nodeActions.sideNotesPane()
  ];
  if (canHaveTraces.includes(node.contentType) && !params?.isConstrainedWidth) {
    baseActions.push(nodeActions.tracesPane());
  }
  return baseActions;
}

export function resolvePanelOptions(node: INode) {
  const nodeActions = new NodeActions(node);
  const overviewPanel = {
    value: ResourcePanelType.OVERVIEW,
    label: "Overview",
    icon: "overview"
  };
  const contentMode = {
    value: ResourcePanelType.CONTENT,
    label: "Content",
    icon:
      node.contentType === NodeType.NODULAR_MARKDOWN ? "markdown" : "hexagon"
  };
  if (
    node.contentType === NodeType.NODULAR_MARKDOWN ||
    headingNodeTypes.includes(node.contentType)
  ) {
    return [
      contentMode,
      nodeActions.linksPane(),
      nodeStaticActions.activityPane,
      // nodeStaticActions.propertiesPane,
      nodeActions.sideNotesPane()
    ];
  }
  const baseActions: IToggleItem[] = [
    contentMode,
    overviewPanel,
    nodeActions.linksPane(),
    nodeStaticActions.activityPane,
    nodeActions.sideNotesPane()
  ];
  // if (canHaveTraces.includes(node.contentType)) {
  //   baseActions.push(nodeActions.tracesPane());
  // }
  // baseActions.push(nodeStaticActions.propertiesPane);
  return baseActions;
}
