import type { Resource } from "@nucleum/schema/resource.enum";
import type { EmailParts } from "@nucleum/schema/account/profile.type";

export function properCase(str: string) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  // if (!str) return str;
  // return str.replace(/\w\S*/g, function (text) {
  //   return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  // });
}

export function prefixTable(id: string | number, itemType: Resource) {
  return `${itemType}:${id}`;
}

export function stripTablePrefix(id: string) {
  return id.split(":")[1];
}
export function prefix(str: string, prefix: string) {
  return `${prefix}${str}`;
}

export function isValidEmail(text: string) {
  const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,}$/;
  return emailRegex.test(text);
}

export function isValidParentDomain(text: string) {
  const domainRegex = /^(?:[a-zA-Z0-9-]{1,}\.){1,}[a-zA-Z0-9]{2,}$/;
  return domainRegex.test(text);
}

export function frameEmailFromParts(parts: EmailParts) {
  return `${parts.firstFew}...${parts.lastFew ?? ""}@${parts.emailDomain}`;
}
/**
 * Checks if a string is valid and not empty or null or any other falsy value as string. Returns the string if valid, otherwise returns undefined.
 * @param str The string to check
 * @returns The string if valid, otherwise undefined
 */
export function isValidString(str: string | undefined | null) {
  const isValid =
    str &&
    str != "" &&
    str != "null" &&
    str != "undefined" &&
    str != "NaN" &&
    str != "false" &&
    str != "0" &&
    str != "none" &&
    str != "None" &&
    str != "NONE" &&
    str != "Access Denied";
  if (isValid) return str;
  return undefined;
}

export function isValidNumber(str: string | number) {
  if (typeof str !== "string" && typeof str !== "number") return false;
  if (typeof str === "number") return Number.isFinite(str);
  const s = str.trim();
  if (s === "") return false;
  return Number.isFinite(Number(s));
}

export function isValidEnumValue(
  str: string,
  enumType: Record<string, string>
) {
  return Object.values(enumType).includes(str);
}

export function isValidDataString(str: string) {
  return isValidString(str) && !isNaN(new Date(str).getTime());
}

export function truncateString(str: string, length: number | undefined) {
  if (!length) return str;
  if (str.length > length) return str.slice(0, length) + "...";
  return str;
}

export function enumToString(val: any, isProperCase: boolean = true) {
  if (!val) return undefined;
  const str = val.toString().split("_").join(" ").split("-").join(" ");
  return isProperCase ? properCase(str) : str;
}

export function enumToCamelCase(val: unknown) {
  let output = "";
  String(val)
    .toString()
    .split("_")
    .forEach((x: string, index: number) => {
      if (index === 0) output += x.toLowerCase();
      else output += x.charAt(0).toUpperCase() + x.slice(1).toLowerCase();
    });
  return output;
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

export function textIsCode(text: string) {
  const keywords = [
    "if",
    "else",
    "for",
    "while",
    "return",
    "function",
    "class",
    "def",
    "import",
    "from",
    "as",
    "try",
    "catch",
    "throw",
    "async",
    "await",
    "const",
    "let",
    "var",
    "with",
    "raise",
    "elif",
    "public",
    "private",
    "protected",
    "static",
    "void",
    "new",
    "synchronized",
    "throws",
    "finally",
    "include",
    "define",
    "struct",
    "typedef",
    "namespace",
    "virtual",
    "inline",
    "then",
    "elif",
    "fi",
    "do",
    "done",
    "case",
    "esac",
    "module",
    "unless",
    "when",
    "do",
    "end",
    "yield",
    "elseif",
    "static",
    "package",
    "switch",
    "defer",
    "guard",
    "fun",
    "when",
    "val",
    "var"
  ];

  const keywordRegex = new RegExp(`\\b(${keywords.join("|")})\\b`, "g");
  const matches = text.match(keywordRegex);

  if (!matches) {
    return false;
  }

  const totalWords = text.split(/\s+/).length;
  const keywordDensity = matches.length / totalWords;

  const keywordThreshold = 3;
  const densityThreshold = 0.1;

  if (matches.length < keywordThreshold && totalWords > 100) {
    return false;
  }

  if (keywordDensity < densityThreshold) {
    return false;
  }

  const codePatternRegex =
    /(\{|\}|\(|\)|;|\/\/|\/\*|\*\/|#|`|=|=>|->|:=|&&|\|\||\.\.\.|->|<|>|!=|==|===|!==|<<|>>|%|&|\||\^|\?)/;
  const hasCodePattern = codePatternRegex.test(text);

  const stringPatternRegex = /(['"`].*?['"`]|["`].*?["`])/;
  const hasStringPattern = stringPatternRegex.test(text);

  const indentationPatternRegex = /^\s{2,}|\t/;
  const hasIndentation = indentationPatternRegex.test(text);

  const prosePatternRegex = /\b(the|a|an|and|but|or|for|nor|so|yet)\b/i;
  const hasProseElements = prosePatternRegex.test(text);

  if (hasProseElements) {
    return false;
  }

  const isCodeContext = hasCodePattern || hasStringPattern || hasIndentation;

  return isCodeContext;
}
