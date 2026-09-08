import { type IBlockInterface, type IMarkdownStore, type IBlock, type IEscapeShortcut, type IListBlockBody, type IBlockBody } from "@nucleum/features/memory/markdown/md.type";
import { type INode, type IActiveNode, simpleTextNodeTypeList, headingNodeTypes, type INodeStructure, type ListNodeType, type SimpleTextNodeType } from "@nucleum/features/memory/node/node.type";
import { NodeType } from "@nucleum/schema/legacy/node-type.enum";
import { generateRandomIdv2 } from "@21n/shared-utils/crypto.utils";

type NestedActiveNode = Omit<IActiveNode, "children"> & {
  children?: NestedActiveNode[];
};

type BlockWithChildren = IBlockInterface & {
  children?: BlockWithChildren[];
};

/**
 * Recursively extracts all children of a node and its children. Useful for converting a nested structure of node into a flat array.
 * @param md Node markdown with children in each node
 * @returns children of the node and all its children
 */
export function recursivelyExtractAllChildrenIntoArray(md: IActiveNode) {
  try {
    return collectChildren(md as NestedActiveNode);
  } catch (e) {
    return [];
  }
}

/**
 * @deprecated - no longer used
 * @param blocks
 * @param childrenHierarchy
 * @returns
 */
export function recursivelyFormParentFromChildren(
  blocks: IBlockInterface[],
  childrenHierarchy: string[] | undefined
) {
  let children: BlockWithChildren[] = [];
  if (childrenHierarchy && childrenHierarchy.length > 0) {
    childrenHierarchy.forEach((childId) => {
      const child = blocks.find((b) => b.id === childId);
      if (child) {
        const newChild: BlockWithChildren = {
          ...child,
          children: recursivelyFormParentFromChildren(
            blocks,
            child.childrenHierarchy
          )
        };
        children.push(newChild);
      }
    });
  }
  return children;
}
/**
 * @deprecated
 * @param store
 * @param contextBlockId
 * @param newBlock
 * @param isStructuralBlock
 * @returns
 */
export function handleNodeMarkdownChildHierarchyChanges(
  store: IMarkdownStore,
  contextBlockId: string,
  newBlock: IBlockInterface,
  isStructuralBlock: boolean
) {
  if (!store.params?.isNodular) return store;
  const parent = store.blocks.find((b) =>
    b.childrenHierarchy?.includes(contextBlockId)
  );
  if (parent && parent.childrenHierarchy) {
    const previousSiblingIndexInParentContext =
      parent.childrenHierarchy.findIndex((c) => c === contextBlockId);
    parent.childrenHierarchy = [
      ...parent.childrenHierarchy.slice(
        0,
        isStructuralBlock
          ? previousSiblingIndexInParentContext
          : previousSiblingIndexInParentContext + 1
      ),
      newBlock.id,
      ...parent.childrenHierarchy.slice(
        isStructuralBlock
          ? previousSiblingIndexInParentContext
          : previousSiblingIndexInParentContext + 1
      )
    ];
  }
  return store;
}

export function isEmptyMd(md: IBlock[]) {
  return (
    md?.length === 0 ||
    (md?.length === 1 && "body" in md[0] && md[0].body === "")
  );
}

function getEscapeShortcuts(nodeContentType: NodeType) {
  const textEscapeShortcuts: IEscapeShortcut[] = [
    { shortcut: '" ', type: NodeType.QUOTE },
    { shortcut: "“ ", type: NodeType.QUOTE },
    { shortcut: "> ", type: NodeType.QUOTE },
    { shortcut: "&gt; ", type: NodeType.QUOTE },
    { shortcut: "! ", type: NodeType.CALLOUT },
    { shortcut: "```", type: NodeType.CODE }
  ];
  if (nodeContentType !== NodeType.HEADING4) {
    textEscapeShortcuts.unshift({
      shortcut: "#### ",
      type: NodeType.HEADING4
    });
  }
  if (![NodeType.HEADING3, NodeType.HEADING4].includes(nodeContentType)) {
    textEscapeShortcuts.unshift({
      shortcut: "### ",
      type: NodeType.HEADING3
    });
  }
  if (
    ![NodeType.HEADING2, NodeType.HEADING3, NodeType.HEADING4].includes(
      nodeContentType
    )
  ) {
    textEscapeShortcuts.unshift({
      shortcut: "## ",
      type: NodeType.HEADING2
    });
  }
  if (
    ![
      NodeType.HEADING1,
      NodeType.HEADING2,
      NodeType.HEADING3,
      NodeType.HEADING4
    ].includes(nodeContentType)
  ) {
    textEscapeShortcuts.unshift({
      shortcut: "# ",
      type: NodeType.HEADING1
    });
  }

  const structuralEscapeShortcuts: IEscapeShortcut[] = [
    { shortcut: "---", type: NodeType.DIVIDER },
    { shortcut: "===", type: NodeType.DOUBLE_DIVIDER }
  ];

  const listEscapeShortcuts: IEscapeShortcut[] = [
    { shortcut: "* ", type: NodeType.LIST, indentable: true },
    { shortcut: "- ", type: NodeType.LIST, indentable: true },
    { shortcut: "+ ", type: NodeType.CHECKLIST, indentable: true },
    { shortcut: "[ ] ", type: NodeType.CHECKLIST, indentable: true },
    { shortcut: "[] ", type: NodeType.CHECKLIST, indentable: true },
    {
      shortcut: "[x] ",
      type: NodeType.CHECKLIST,
      indentable: true,
      isChecked: true
    },
    { shortcut: "- [ ]  ", type: NodeType.CHECKLIST, indentable: true },
    {
      shortcut: "- [x]  ",
      type: NodeType.CHECKLIST,
      indentable: true,
      isChecked: true
    },
    {
      shortcut: /^\d+\.\s.*/,
      type: NodeType.ORDERED_LIST,
      indentable: true,
      isRegex: true
    }
  ];

  return {
    textEscapeShortcuts,
    structuralEscapeShortcuts,
    listEscapeShortcuts
  };
}

export function performEscShortcuts(
  nodeContentType: NodeType,
  text: string
): {
  shortcut: string;
  type: NodeType;
  indentLevel?: number;
  isFullReplace?: boolean;
  listOrder?: number;
  isChecked?: boolean;
} | null {
  const {
    textEscapeShortcuts,
    structuralEscapeShortcuts,
    listEscapeShortcuts
  } = getEscapeShortcuts(nodeContentType);

  let shortcut: string | undefined = undefined;
  let type: NodeType | undefined = undefined;
  let indentLevel: number | undefined = undefined;
  let listOrder: number | undefined = undefined;
  let isCheckedVal: boolean | undefined = undefined;

  [...textEscapeShortcuts, ...listEscapeShortcuts].forEach(
    ({ shortcut: short, type: t, indentable, isRegex, isChecked }) => {
      indentLevel = getIndentationLevel(text);
      const trimmedText = text.trimStart();
      const _text = indentable ? trimmedText : text;
      if (isRegex) {
        if (trimmedText.match(short)) {
          shortcut = trimmedText.match(/^\d+\.\s/)?.[0] || "";
          listOrder = parseInt(shortcut.match(/^\d+/)?.[0] || "1", 10);
          type = t;
        }
      } else if (typeof short === "string" && _text.startsWith(short)) {
        shortcut = short;
        type = t;
        isCheckedVal = isChecked ?? false;
      }
    }
  );
  if (shortcut && type) {
    return {
      shortcut,
      type,
      indentLevel,
      listOrder,
      isChecked: isCheckedVal
    };
  }

  structuralEscapeShortcuts.forEach(({ shortcut: short, type: t }) => {
    if (text === short) {
      shortcut = short;
      type = t;
    }
  });
  if (shortcut && type) {
    return { shortcut, type, isFullReplace: true };
  }

  return null;

  function getIndentationLevel(text: string): number {
    const leadingWhitespace = text.match(/^(\s*)/)?.[1] || "";
    const tabCount = (leadingWhitespace.match(/\t/g) || []).length;
    const spaceCount = leadingWhitespace.replace(/\t/g, "").length;
    const spaceIndents = Math.floor(spaceCount / 4);
    return tabCount + spaceIndents;
  }
}

/**
 *
 * Note: removed generateResourceId() for generating id to keep this utility independent from app data modules.
 * @param text
 * @param nodeContentType
 * @returns
 */
export function textToMdBlocks(
  text: string,
  nodeContentType?: NodeType
): IBlock[] {
  const spans = text.split("\n");

  const blocks: IBlock[] = spans.map((x) => {
    const escResult = performEscShortcuts(
      nodeContentType ?? NodeType.NODULAR_MARKDOWN,
      x
    );
    const id = `node:${generateRandomIdv2()}`;
    if (!escResult) {
      return {
        id,
        contentType: NodeType.SIMPLE_TEXT,
        body: x
      };
    }
    const { shortcut, type, isFullReplace, indentLevel, listOrder, isChecked } =
      escResult;
    if (isFullReplace && isStructuralBlockType(type)) {
      return createBlock(id, type, "");
    }
    x = x.replace(shortcut, "");
    if (isHeadingBlockType(type)) {
      return createBlock(id, type, x, x);
    } else if (isSimpleTextBlockType(type)) {
      return createBlock(id, type, x);
    }
    if (indentLevel || listOrder || isChecked) {
      return createBlock(id, type as IBlock["contentType"], {
        ...(resolveDefaultBodyForBlock(
          type,
          x.trimStart()
        ) as IListBlockBody),
        indent: indentLevel,
        order: listOrder,
        checked: isChecked
      });
    }
    return createBlock(
      id,
      type as IBlock["contentType"],
      resolveDefaultBodyForBlock(type, x)
    );
  });
  return blocks;
}

/**
 * Resolves default body for non simple node types
 * @param text
 * @param toType
 */
export function resolveDefaultBodyForBlock(
  toType: NodeType,
  text: string
): IBlockBody {
  switch (toType) {
    case NodeType.LIST:
    case NodeType.ORDERED_LIST:
    case NodeType.CHECKLIST:
      return { indent: 0, text, order: 1 };
    case NodeType.CODE:
    case NodeType.CALLOUT:
      return { text };
    case NodeType.SIMPLE_TEXT:
      return text;
    default:
      return { text };
  }
}

/**
 * Extracts the structure of the children blocks from the markdown.
 * @param blocks
 */
export function extractStructureForChildren(
  blocks: IBlock[]
): INodeStructure[] {
  let structure: INodeStructure[] = [];
  let collapsedHierarchy: INodeStructure[] = [];
  structure = blocks.map((block) => {
    return {
      id: block.id,
      factor: resolveFactor(block.contentType as NodeType),
      children: []
    };
  });
  let leftovers: INodeStructure[] = [...structure];
  [5, 4, 3, 2, 1].forEach((level) => {
    const levelBlocks = leftovers.filter((block) => block.factor === level);
    if (levelBlocks.length === 0) return;
    levelBlocks.forEach((block) => {
      const index = leftovers.findIndex((b) => b.id === block.id);
      const stopIndex = leftovers.findIndex(
        (b, i) => i > index && b.factor <= block.factor
      );
      if (stopIndex === -1) {
        block.children = leftovers.slice(index + 1).map((x) => x.id);
        leftovers = leftovers.filter((b) => !block.children.includes(b.id));
        return;
      }
      const children = leftovers.slice(index + 1, stopIndex);
      block.children = children.map((x) => x.id);
      leftovers = leftovers.filter((b) => !block.children.includes(b.id));
    });
    collapsedHierarchy = [...collapsedHierarchy, ...levelBlocks];
  });
  collapsedHierarchy.forEach((block) => {
    const item = structure.find((x) => x.id === block.id);
    if (item) item.children = block.children;
  });
  // logger.log({ collapsedHierarchy, structure });
  return structure;

  function resolveFactor(blockType: NodeType) {
    switch (blockType) {
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
        return 100;
    }
  }
}

/**
 * Extracts the root structure of the markdown from the children structure.
 */
export function extractRootStructure(
  structure: INodeStructure[],
  hierarchyFactorLimit: number
) {
  let rootBlocks: INodeStructure[] = [];
  let firstHeadingHit = false;
  structure.forEach((block) => {
    if (!firstHeadingHit && block.factor <= hierarchyFactorLimit) {
      firstHeadingHit = true;
      rootBlocks.push(block);
    } else if (!firstHeadingHit) rootBlocks.push(block);
    else if (block.factor > hierarchyFactorLimit) return;
    else {
      const lowestFactor = Math.min(
        ...rootBlocks.map((x: INodeStructure) => x.factor)
      );
      if (block.factor <= lowestFactor) {
        rootBlocks.push(block);
      }
    }
  });
  return rootBlocks;
}

function isHeadingBlockType(type: NodeType): type is SimpleTextNodeType {
  return headingNodeTypes.includes(type);
}

function isSimpleTextBlockType(type: NodeType): type is SimpleTextNodeType {
  return simpleTextNodeTypeList.includes(type);
}

function isStructuralBlockType(
  type: NodeType
): type is NodeType.DIVIDER | NodeType.DOUBLE_DIVIDER {
  return type === NodeType.DIVIDER || type === NodeType.DOUBLE_DIVIDER;
}

function createBlock(
  id: string,
  contentType: IBlock["contentType"],
  body: IBlockBody,
  label?: string
): IBlock {
  if (label) {
    return { id, contentType, body, label } as IBlock;
  }
  return { id, contentType, body } as IBlock;
}

function collectChildren(node: NestedActiveNode): IBlockInterface[] {
  const children: IBlockInterface[] = [];

  if (node.children && node.children.length > 0) {
    node.children.forEach((child) => {
      children.push(child);
      children.push(...collectChildren(child));
    });
  }

  return children;
}
