import { InlineType } from "./inline.type";

/** Encapsulate inline pattern for shared inline Markdown presentation. */
function encapsulateInlinePattern(
  keyword: string,
  content: string,
  isEncapsulate = false
) {
  if (!isEncapsulate) return content;
  return `<span class='hidden'>${keyword}</span> ${content} <span class='hidden'>${keyword}</span>`;
}

/** Inline styling patterns for shared inline Markdown presentation. */
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
    regex: /__(.*?)__/g,
    replacement: encapsulateInlinePattern("__", "<u>$1</u>")
  },
  {
    regex: /~~((?:\S|\s\S)+?)~~/g,
    replacement: encapsulateInlinePattern("~~", "$1")
  },
  {
    regex: /`([^`]+)`(?!`)/g,
    replacement: encapsulateInlinePattern(
      "`",
      "<span class='bg-aps2 px-0.5 text-b2 font-mono'>$1</span>"
    )
  }
];

/** Inline link patterns for shared inline Markdown presentation. */
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

/** Symbol patterns for shared inline Markdown presentation. */
export const symbolPatterns = [
  { regex: /←&gt;/g, replacement: "↔" },
  { regex: /-&gt;/g, replacement: "→" },
  { regex: /&lt;-/g, replacement: "←" },
  { regex: /&lt;=/g, replacement: "≤" },
  { regex: /&gt;=/g, replacement: "≥" },
  { regex: /=&gt;/g, replacement: "⇒" }
];

/** Escapes HTML delimiters in heading and quote content. */
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

/** Renders the established Markdown display syntax without depending on editor state. */
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
  if (params?.isIncludeSpaces) parsedText = parsedText.replace(/ /g, "&nbsp;");
  return parsedText;
}

/**  match pattern for shared inline Markdown presentation. */
type MatchPattern = {
  match: RegExpExecArray;
  pattern: {
    regex: RegExp;
    replacement: string;
  };
};

/** Find inline styling patterns for shared inline Markdown presentation. */
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

/** Find symbol patterns for shared inline Markdown presentation. */
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

/** Replace inline style patterns for shared inline Markdown presentation. */
export function replaceInlineStylePatterns(text: string) {
  let html = text;
  inlineStylingPatterns.forEach((pattern) => {
    html = html.replace(pattern.regex, pattern.replacement);
  });
  return html;
}

/** Replace inline link patterns for shared inline Markdown presentation. */
export function replaceInlineLinkPatterns(text: string) {
  let html = text;
  inlineLinkPatterns.forEach((pattern) => {
    html = html.replace(pattern.regex, pattern.replacement);
  });
  return html;
}

/** Replace symbol patterns for shared inline Markdown presentation. */
export function replaceSymbolPatterns(text: string) {
  let html = text;
  symbolPatterns.forEach((pattern) => {
    html = html.replace(pattern.regex, pattern.replacement);
  });
  return html;
}

/** Html to markdown patterns for shared inline Markdown presentation. */
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

/** Replace nested spans for shared inline Markdown presentation. */
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

/** Remove html comments for shared inline Markdown presentation. */
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

/** Remove tooltip elements for shared inline Markdown presentation. */
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

/** Extract inline markdown from html for shared inline Markdown presentation. */
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

/** Resolve plain text for shared inline Markdown presentation. */
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

/** Create position mapping for shared inline Markdown presentation. */
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

/** Resolve markdown offset for shared inline Markdown presentation. */
function resolveMarkdownOffset(plainOffset: number, mapping: number[]): number {
  if (!mapping.length) return 0;
  if (plainOffset < 0) return 0;
  if (plainOffset >= mapping.length)
    return mapping[mapping.length - 1] + 1 || 0;
  return mapping[plainOffset];
}

/** Resolve plain offset for md end for shared inline Markdown presentation. */
export function resolvePlainOffsetForMdEnd(markdown: string) {
  const { plainText } = createPositionMapping(markdown);
  return plainText.length;
}

/** Split markdown at plain offset for shared inline Markdown presentation. */
export function splitMarkdownAtPlainOffset(
  markdown: string,
  plainOffset: number
): {
  before: string;
  after: string;
} {
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
