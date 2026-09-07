import {
  type IBlockInterface,
  type IMarkdownStore,
  type IBlock,
  type IEscapeShortcut,
  type IListBlockBody,
  type IBlockBody,
  InlineType
} from "@nucleum/features/memory/markdown/md.type";
import {
  type INode,
  type IActiveNode,
  NodeType,
  simpleTextNodeTypeList,
  headingNodeTypes,
  type INodeStructure,
  type ListNodeType,
  type SimpleTextNodeType
} from "@nucleum/features/memory/node/node.type";
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

function encapsulateInlinePattern(
  keyword: string,
  content: string,
  isEncapsulate = false
) {
  if (!isEncapsulate) return content;
  return `<span class='hidden'>${keyword}</span> ${content} <span class='hidden'>${keyword}</span>`;
}

export const inlineStylingPatterns = [
  {
    regex: /(?<!\*)\*([^\*]+?)\*(?!\*)/g,
    replacement: encapsulateInlinePattern("*", "<i>$1</i>")
  },
  {
    regex: /\*\*([^\*]+?)\*\*/g,
    replacement: encapsulateInlinePattern("**", "<b>$1</b>")
  },
  {
    // regex: /_((?:\s*\S)+?)_/g,
    regex: /__(.*?)__/g,
    replacement: encapsulateInlinePattern("__", "<u>$1</u>")
  },
  {
    regex: /~~((?:\S|\s\S)+?)~~/g,
    replacement: encapsulateInlinePattern("~~", "$1")
    // '<span class="line-through">$1</span>'
  },
  {
    regex: /`([^`]+)`(?!`)/g,
    // replacement: encapsulateInlinePattern("`", "<code>$1</code>")
    replacement: encapsulateInlinePattern(
      "`",
      "<span class='bg-aps2 px-0.5 text-b2 font-mono'>$1</span>"
    )
  }
  // {
  //   regex: /#\[((?:\S|\s\S)+?)\]\(([^)]+?)\)/g,
  //   replacement: '<span style="color:$2">$1</span>'
  // }
];

export const inlineLinkPatterns = [
  {
    type: InlineType.MENTION,
    regex: /\[(.*?)\]\(resource=(.*?)\)/g,
    replacement:
      '<placeholder class="inline-mention" data-record-id="$2" data-label="$1" > $1 </placeholder>'
  },
  {
    type: InlineType.LINK,
    regex: /\[(.*?)\]\(https?:\/\/(.*?)\)/g,
    replacement:
      '<placeholder class="inline-link text-aps1 underline hover:bg-aps3 px-0.5 rounded-md cursor-pointer" data-href="https://$2" data-label="$1" >$1</placeholder>'
  }
];

export const symbolPatterns = [
  { regex: /←&gt;/g, replacement: "↔" },
  { regex: /-&gt;/g, replacement: "→" },
  { regex: /&lt;-/g, replacement: "←" },
  { regex: /&lt;=/g, replacement: "≤" },
  { regex: /&gt;=/g, replacement: "≥" },
  { regex: /=&gt;/g, replacement: "⇒" }
];

/**
 * Escapes HTML characters to prevent XSS attacks
 * @param text Text to escape
 * @returns Escaped text
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;"
  };
  return text.replace(/[&<>"'\/]/g, (match) => htmlEscapes[match] || match);
}

/**
 * Renders markdown as html with proper sanitization. It replaces symbols, inline styles and spaces with html entities.
 * All user content is escaped to prevent XSS attacks.
 *
 * In cases of search results, where parts of the text are highlighted, plain text spaces are not rendered correctly. To avoid this, spaces are rendered as &nbsp; when isIncludeSpaces is true.
 *
 * @param text
 * @param params
 * @returns
 */
export function renderMdAsHtml(
  text: string,
  params?: {
    isIncludeSpaces?: boolean;
    isPageRender?: boolean;
  }
) {
  let parsedText = text;
  parsedText = replaceSymbolPatterns(parsedText);
  parsedText = replaceInlineStylePatterns(parsedText);

  // Escape HTML in heading content to prevent XSS
  parsedText = parsedText.replace(
    /^#### (.*)$/gm,
    (match, content) => `<h4 class="text-h4">${escapeHtml(content)}</h4>`
  );
  parsedText = parsedText.replace(
    /^### (.*)$/gm,
    (match, content) =>
      `<h3 class="${params?.isPageRender ? "text-h3" : "text-h4"}">${escapeHtml(content)}</h3>`
  );
  parsedText = parsedText.replace(
    /^## (.*)$/gm,
    (match, content) =>
      `<h2 class="${params?.isPageRender ? "text-h2" : "text-h4"}">${escapeHtml(content)}</h2>`
  );
  parsedText = parsedText.replace(
    /^# (.*)$/gm,
    (match, content) =>
      `<h1 class="${params?.isPageRender ? "text-h1" : "text-h4"}">${escapeHtml(content)}</h1>`
  );

  parsedText = parsedText.replace(
    /^> (.*)$/gm,
    (match, content) => `<blockquote>${escapeHtml(content)}</blockquote>`
  );

  parsedText = parsedText.replace(/^---\s*$/gm, "<hr>");
  parsedText = parsedText.replace(/^===\s*$/gm, "<hr>");

  parsedText = parsedText.replace(
    /((^|\n)\s*[-*] .*(\n\s*[-*] .*)*)/gm,
    function (match: string) {
      const items = match
        .split(/\n/)
        .filter((line: string) => /^\s*[-*] /.test(line));
      if (items.length === 0) return match;
      const lis = items
        .map(
          (line: string) =>
            `<li class="md-list-item">${line.replace(/^\s*[-*] /, "")}</li>`
        )
        .join("");
      return `<ul>${lis}</ul>`;
    }
  );
  parsedText = parsedText.replace(/\n/g, "<br>");
  parsedText = replaceInlineLinkPatterns(parsedText);
  // parsedText = parsedText.replace(
  //   /\[(.*?)\]\(resource=(.*?)\)/g,
  //   '<a class="mention text-aps1 underline-dotted-primary" id="$2" href="?pop=$2">$1</a>'
  // );
  // parsedText = parsedText.replace(
  //   /\[(.*?)\]\(https?:\/\/(.*?)\)/g,
  //   '<a class="text-aps1 underline-dotted-primary" href="https://$2" target="_blank" rel="noopener noreferrer">$1</a>'
  // );
  if (params?.isIncludeSpaces) parsedText = parsedText.replace(/ /g, "&nbsp;");
  return parsedText;
}
type MatchPattern = {
  match: RegExpExecArray;
  pattern: { regex: RegExp; replacement: string };
};
/**
 * Finds all inline styling patterns in a given text and returns the matches. If no matches are found, an empty array is returned.
 * @param text Text to find inline styling patterns
 * @returns matches of inline styling patterns
 */
export function findInlineStylingPatterns(text: string) {
  let matches: MatchPattern[] = [];
  inlineStylingPatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      matches.push({ match, pattern });
    }
  });
  return matches;
}

export function findSymbolPatterns(text: string) {
  let matches: RegExpExecArray[] = [];
  symbolPatterns.forEach((pattern) => {
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      matches.push(match);
    }
  });
  return matches;
}

export function replaceInlineStylePatterns(text: string) {
  let html = text;
  inlineStylingPatterns.forEach((pattern) => {
    html = html.replace(pattern.regex, pattern.replacement);
  });
  return html;
}

export function replaceInlineLinkPatterns(text: string) {
  let html = text;
  inlineLinkPatterns.forEach((pattern) => {
    html = html.replace(pattern.regex, pattern.replacement);
  });
  return html;
}

export function replaceSymbolPatterns(text: string) {
  let html = text;
  symbolPatterns.forEach((pattern) => {
    html = html.replace(pattern.regex, pattern.replacement);
  });
  return html;
}

export function isEmptyMd(md: IBlock[]) {
  return (
    md?.length === 0 ||
    (md?.length === 1 && "body" in md[0] && md[0].body === "")
  );
}

export const htmlToMarkdownPatterns = [
  {
    regex: /<i>(.*?)<\/i>/g,
    replacement: "*$1*"
  },
  {
    regex: /<b>(.*?)<\/b>/g,
    replacement: "**$1**"
  },
  {
    regex: /<u>(.*?)<\/u>/g,
    replacement: "__$1__"
  },
  {
    regex: /<s>(.*?)<\/s>/g,
    replacement: "~~$1~~"
  },
  {
    regex:
      /<span class=["']bg-aps2 px-0.5 text-b2 font-mono["']>(.*?)<\/span>/g,
    replacement: "`$1`"
  },
  {
    regex:
      /<a[^>]*inline-mention.*?data-record-id="([^"]*)".*?data-label="([^"]*)".*?>.*?<\/a>/gs,
    replacement: (match: string, id: string, label: string) => {
      return `[${label}](resource=${id})`;
    }
  },
  {
    regex: /<a[^>]*inline-link[^>]*?href="([^"]*)"[^>]*?>([\s\S]*?)<\/a>/g,
    replacement: (match: string, url: string, label: string) => {
      return `[${label}](${url.startsWith("http") ? url : "https://" + url})`;
    }
  }
];

function replaceNestedSpans(html: string): string {
  const spanRegex = /<span[^>]*>(.*?)<\/span>/gs;
  let replacedHtml = html;
  let previousHtml = "";
  while (previousHtml !== replacedHtml) {
    previousHtml = replacedHtml;
    replacedHtml = replacedHtml.replace(spanRegex, (_, group1) =>
      group1.replace(/&nbsp;/g, " ")
    );
  }
  return replacedHtml;
}

function removeHtmlComments(html: string): string {
  const commentRegex = /<!--(.*?)-->/gs;
  let replacedHtml = html;
  let previousHtml = "";
  while (previousHtml !== replacedHtml) {
    previousHtml = replacedHtml;
    replacedHtml = replacedHtml.replace(commentRegex, "");
  }
  return replacedHtml;
}

function removeTooltipElements(html: string): string {
  const tooltipElementRegex =
    /<(\w+)[^>]*class="[^"]*tooltip[^"]*">[\s\S]*?<\/\1>/gs;
  let replacedHtml = html;
  let previousHtml = "";
  while (previousHtml !== replacedHtml) {
    previousHtml = replacedHtml;
    replacedHtml = replacedHtml.replace(tooltipElementRegex, "");
  }
  return replacedHtml;
}

export function extractInlineMarkdownFromHtml(html: any) {
  let markdown = html;
  htmlToMarkdownPatterns.forEach((pattern) => {
    markdown = markdown.replaceAll(pattern.regex, pattern.replacement);
  });
  markdown = replaceNestedSpans(markdown);
  markdown = removeHtmlComments(markdown);
  markdown = removeTooltipElements(markdown);
  return markdown;
}

export function resolvePlainText(mdString: string) {
  return mdString
    .replace(/!\[[^\]]*\]\([^\)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/#+\s*(.*)/g, "$1")
    .replace(/^>\s*(.*)/gm, "$1")
    .replace(/^[\-\*\+]\s+(.*)/gm, "$1")
    .replace(/^\d+\.\s+(.*)/gm, "$1")
    .replace(/^(-{3,}|\*{3,}|_{3,})$/gm, "")
    .replace(/([#>*_~`]+)/g, "")
    .trim();
}

/**
 *
 * Validation cases
 * 1. & symbol
 * 2. mention, inline link
 *
 *
 * Notes:
 * For `link` pattern and mention case - 2 characters are added to the mapping array to account for hexagon symbol and space between hexagon symbol and text.
 *
 * @param markdown
 * @returns
 */
function createPositionMapping(markdown: string): {
  plainText: string;
  mapping: number[];
} {
  let plainText = "";
  let mapping: number[] = [];
  let markdownIndex = 0;
  let plainIndex = 0;

  const patterns = [
    {
      type: "html-entity",
      regex: /^&(?:amp|lt|gt|quot|apos|dash|ndash|#\d+);/,
      length: (matchStr: string) => matchStr.length,
      transform: (matchStr: string) => {
        switch (matchStr) {
          case "&amp;":
            return "&";
          case "&lt;":
            return "<";
          case "&gt;":
            return ">";
          case "&quot;":
            return '"';
          case "&apos;":
            return "'";
          case "&dash;":
          case "&ndash;":
            return "–";
          default: {
            const numericMatch = matchStr.match(/^&#(\d+);$/);
            if (numericMatch) {
              return String.fromCharCode(parseInt(numericMatch[1], 10));
            }
            return matchStr;
          }
        }
      }
    },
    { type: "formatting", regex: /^(?:\*\*|__)/, length: 2 },
    {
      type: "formatting",
      regex: /^(?:\*|_|~~)/,
      length: (matchStr: string) => matchStr.length
    },
    { type: "formatting", regex: /^`/, length: 1 },
    {
      type: "link",
      regex: /^\[([^\]]+)\]\([^\)]+\)/,
      length: (matchStr: string) => matchStr.length,
      extract: (matchStr: string) => matchStr.match(/^\[([^\]]+)\]/)?.[1] || ""
    },
    { type: "any-other", regex: /^./, length: 1 }
  ];

  const length = markdown.length;
  while (markdownIndex < length) {
    let matched = false;

    for (const pattern of patterns) {
      const substring = markdown.substring(markdownIndex);
      const match = substring.match(pattern.regex);
      if (match) {
        const matchText = match[0];
        const matchLength =
          typeof pattern.length === "function"
            ? pattern.length(matchText)
            : pattern.length;

        if (pattern.type === "html-entity") {
          const transformed = pattern.transform!(matchText);
          plainText += transformed;
          for (let i = 0; i < transformed.length; i++) {
            mapping[plainIndex++] = markdownIndex + matchLength - 1;
          }
        } else if (pattern.type === "link") {
          const linkText = pattern.extract ? pattern.extract(matchText) : "";
          if (matchText.includes("resource=")) {
            plainText += "⬡ ";
            mapping[plainIndex++] = markdownIndex + 1;
            mapping[plainIndex++] = markdownIndex + 2;
          }
          for (let i = 0; i < linkText.length; i++) {
            plainText += linkText[i];
            mapping[plainIndex++] = markdownIndex + 1 + i;
          }
        } else if (pattern.type === "newline") {
          plainText += "\n";
          mapping[plainIndex++] = markdownIndex;
        } else if (pattern.type === "any-other") {
          plainText += matchText;
          mapping[plainIndex++] = markdownIndex;
        }
        markdownIndex += matchLength;
        matched = true;
        break;
      }
    }

    if (!matched) {
      markdownIndex++;
    }
  }

  return { plainText, mapping };
}

function resolveMarkdownOffset(plainOffset: number, mapping: number[]): number {
  if (!mapping.length) return 0;

  if (plainOffset < 0) return 0;
  if (plainOffset >= mapping.length)
    return mapping[mapping.length - 1] + 1 || 0;

  return mapping[plainOffset];
}

export function resolvePlainOffsetForMdEnd(markdown: string) {
  const { plainText } = createPositionMapping(markdown);
  return plainText.length;
}

export function splitMarkdownAtPlainOffset(
  markdown: string,
  plainOffset: number
): { before: string; after: string } {
  if (!markdown) return { before: "", after: "" };

  const { plainText, mapping } = createPositionMapping(markdown);
  plainOffset = Math.max(0, Math.min(plainText.length, plainOffset));
  const markdownOffset = resolveMarkdownOffset(plainOffset, mapping);
  const before = markdown.substring(0, markdownOffset);
  const after = markdown.substring(markdownOffset);
  if (before.endsWith("**")) {
    return { before: before.slice(0, -2), after: "**" + after };
  }
  if (before.endsWith("__")) {
    return { before: before.slice(0, -2), after: "__" + after };
  }
  if (before.endsWith("[[")) {
    return { before: before.slice(0, -2), after: "[[" + after };
  }
  if (
    before[before.length - 1] === "*" ||
    before[before.length - 1] === "_" ||
    before[before.length - 1] === "~" ||
    before[before.length - 1] === "`" ||
    before[before.length - 1] === "["
  ) {
    const lastChar = before[before.length - 1];
    return {
      before: before.slice(0, -1),
      after: lastChar + after
    };
  }

  return { before, after };
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
