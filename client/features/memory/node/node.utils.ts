import { logger } from "@nucleum/client/runtime/logging/logger";
import type { IFile } from "@nucleum/features/files/file.type";
import { generateResourceId } from "@nucleum/datafn/id.utils";
import { Resource } from "@nucleum/datafn/resource.enum";
import { isRecordId } from "@nucleum/datafn/resource.utils";
import type { IBlock } from "@nucleum/features/memory/markdown/md.type";
import {
  NodeType,
  type INode,
  type ITwitterProfileBody,
  type ITextClipBody,
  type IVideoTimestampClip,
  type ITwitterProfile,
  type INodeThumb,
  type INodeStructure,
  webNodeTypeList,
  socialPostNodeTypeList,
  socialProfileNodeTypeList,
  socialProfileWithImageUnavailable
} from "@nucleum/features/memory/node/node.type";
import type { IRecordId } from "@21n/types/data.type";
import { TimeFormat } from "@21n/types/time.type";
import { getGeoLocation } from "@21n/utils/browser.utils";
import { formatSeconds } from "@21n/utils/time.utils";
import {
  enumToString,
  isValidString,
  properCase
} from "@21n/shared-utils/text.utils";
import { isValidUrl } from "@21n/shared-utils/utils";
import { resolveUrlData } from "@nucleum/features/memory/node/url.utils";

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function hasStringProperty<K extends string>(
  value: unknown,
  key: K
): value is Record<K, string> {
  return isObject(value) && typeof value[key] === "string";
}

/** Data shape required to resolve a node favicon without requiring a full node record. */
export type INodeFaviconSource = {
  contentType: NodeType;
  body?: unknown;
  metadata?: unknown;
  parent?: unknown;
  url?: string;
};

function hasNumberProperty<K extends string>(
  value: unknown,
  key: K
): value is Record<K, number> {
  return isObject(value) && typeof value[key] === "number";
}

function hasProperty<K extends string>(
  value: unknown,
  key: K
): value is Record<K, unknown> {
  return isObject(value) && key in value;
}

function resolveFilePreviewValue(
  value: unknown
): IFile | IRecordId | undefined {
  if (typeof value === "string") return value;
  if (isObject(value)) return value as unknown as IFile;
  return undefined;
}

export function resolveContentPreview(node: INode | INodeThumb) {
  const { body, contentType, metadata } = node;
  logger.log({ at: "contentPreview", body, contentType });

  if (contentType === NodeType.TWEET && hasStringProperty(body, "content")) {
    if (body.content) return body.content;
    else if (hasStringProperty(metadata, "ogTitle")) return metadata.ogTitle;
  } else if (
    contentType === NodeType.YOUTUBE_VIDEO ||
    contentType === NodeType.YOUTUBE_SHORT
  ) {
    if (hasStringProperty(body, "title") && isValidString(body.title))
      return body.title;
    if (hasStringProperty(metadata, "ogTitle")) return metadata.ogTitle;
    if (hasStringProperty(metadata, "title")) return metadata.title;
  } else if (socialPostNodeTypeList.has(contentType)) {
    if (node.text && typeof node.text === "string") return node.text;
    if (node.label && typeof node.label === "string") return node.label;
    if (hasStringProperty(metadata, "ogTitle")) return metadata.ogTitle;
    if (hasStringProperty(metadata, "title")) return metadata.title;
  } else if (contentType === NodeType.TWITTER_PROFILE) {
    if (hasStringProperty(body, "bio")) return body.bio;
    if (!node.url) return "";

    const ogImageUrl = resolveUrlData(node.url)?.ogImage;
    return ogImageUrl ?? "";
  } else if (
    contentType === NodeType.WEB_TEXT_BOOKMARK &&
    hasStringProperty(body, "text")
  ) {
    return body.text;
  } else if (node.mdText && typeof node.mdText === "string") {
    return node.mdText;
  } else if (node.text && typeof node.text === "string") {
    return node.text;
  } else if (
    contentType === NodeType.KINDLE_HIGHLIGHT &&
    hasStringProperty(body, "text")
  ) {
    return body.text;
  }
  return undefined;
}

export function getMarkdownSymbolPrepended(block: IBlock) {
  switch (block.contentType) {
    case NodeType.SIMPLE_TEXT:
      block.body = block.body.replaceAll(/\n/g, "  \n");
      block.body = block.body.replaceAll("<div><br></div>", "  \n");
      block.body = block.body.replaceAll(/<br>/g, "  \n");
      block.body = block.body.replaceAll(
        /<span class="bg-aps2 px-0.5 text-b2 font-mono">(.*?)<\/span>/g,
        "`$1`"
      );
      block.body = block.body.replaceAll(/<i>(.*?)<\/i>/g, "*$1*");
      block.body = block.body.replaceAll(/<b>(.*?)<\/b>/g, "**$1**");
      block.body = block.body.replaceAll(
        /<span id="[^"]*">(.*?)<\/span>/g,
        "$1"
      );
      block.body = block.body.replaceAll(/<span>(.*?)<\/span>/g, "$1");
      block.body = block.body.replaceAll(/<div>(.*?)<\/div>/g, "\n $1");
      //todo - add remaining inline style patterns
      return block.body;
    case NodeType.HEADING1:
      return `# ${block.label ?? block.body}`;
    case NodeType.HEADING2:
      return `## ${block.label ?? block.body}`;
    case NodeType.HEADING3:
      return `### ${block.label ?? block.body}`;
    case NodeType.HEADING4:
      return `#### ${block.label ?? block.body}`;
    case NodeType.HEADING5:
      return `##### ${block.label ?? block.body}`;
    case NodeType.DOUBLE_DIVIDER:
      return `---`;
    case NodeType.DIVIDER:
      return `===`;
    case NodeType.QUOTE:
      return `> ${block.body}`;
    case NodeType.LIST:
    case NodeType.ORDERED_LIST:
    case NodeType.CHECKLIST:
      return `- ${block.body.text}`;
    case NodeType.CALLOUT:
    case NodeType.CODE:
      return block.body.text;
  }
}
export function generateMarkdownText(
  blocks: IBlock[],
  params?: { isIncludeNonSearchBlocks: boolean }
) {
  const filteredBlocks = params?.isIncludeNonSearchBlocks
    ? blocks
    : blocks.filter((b) => b.contentType !== NodeType.CODE);
  return filteredBlocks.map((b) => getMarkdownSymbolPrepended(b)).join("\n");
}

const nodeIconMap = new Map<NodeType, string>([
  [NodeType.IMAGE, "ph:image-light"],
  [NodeType.WEB_SCREENSHOT, "crop"],
  [NodeType.NODULAR_MARKDOWN, "markdown"],
  [NodeType.WEB_TEXT_BOOKMARK, "highlighter-circle"],
  [NodeType.WEB_PAGE, "ph:globe-light"],
  [NodeType.PDF, "file-pdf"],
  [NodeType.AUDIO, "music-note"],
  [NodeType.VIDEO, "video"],
  [NodeType.FILE, "ph:file-light"],
  [NodeType.YOUTUBE_VIDEO, "logos:youtube-icon"],
  [NodeType.YOUTUBE_SHORT, "logos:youtube-icon"],
  [NodeType.YOUTUBE_CHANNEL, "logos:youtube-icon"],
  [NodeType.YOUTUBE_BOOKMARK, "logos:youtube-icon"],
  [NodeType.TWEET, "twitter"],
  [NodeType.TWITTER_PROFILE, "twitter"],
  [NodeType.KINDLE_BOOK, "amazon-logo"],
  [NodeType.KINDLE_HIGHLIGHT, "ph:bookmark-simple-light"],
  [NodeType.CODE, "ph:code-light"],
  [NodeType.GIST, "ph:code-light"],
  [NodeType.BLUESKY_POST, "logos:bluesky"],
  [NodeType.BLUESKY_PROFILE, "logos:bluesky"],
  [NodeType.THREADS_POST, "ph:threads-logo"],
  [NodeType.THREADS_PROFILE, "ph:threads-logo"],
  [NodeType.INSTAGRAM_POST, "skill-icons:instagram"],
  [NodeType.INSTAGRAM_REEL, "skill-icons:instagram"],
  [NodeType.INSTAGRAM_PROFILE, "skill-icons:instagram"],
  [NodeType.LINKEDIN_POST, "logos:linkedin-icon"],
  [NodeType.LINKEDIN_PROFILE, "logos:linkedin-icon"],
  [NodeType.FACEBOOK_POST, "logos:facebook"],
  [NodeType.FACEBOOK_PROFILE, "logos:facebook"],
  [NodeType.MASTODON_POST, "logos:mastodon-icon"],
  [NodeType.MASTODON_PROFILE, "logos:mastodon-icon"],
  [NodeType.REDDIT_POST, "logos:reddit-icon"],
  [NodeType.REDDIT_PROFILE, "logos:reddit-icon"]
]);

export function resolveNodeIcon(contentType: NodeType, url?: string) {
  if (nodeIconMap.has(contentType)) {
    if (contentType === NodeType.WEB_PAGE && url && isValidUrl(url)) {
      return resolveFallbackIconForUrl(url);
    }
    return nodeIconMap.get(contentType);
  }
  if (url && isValidUrl(url)) return resolveFallbackIconForUrl(url);
  else return "book";
}

export function resolveFallbackIconForUrl(url: string | undefined) {
  let hostPart;
  try {
    if (!url) return "globe";
    hostPart = new URL(url).host;
  } catch (e) {
    logger.error({ at: "resolveFallbackIconForUrl", e });
    return "globe";
  }
  if (hostPart === "replit.com" || hostPart.endsWith(".replit.com"))
    return "logos:replit-icon";
  if (hostPart === "github.com" || hostPart.endsWith(".github.com"))
    return "ph:github-logo";
  if (hostPart === "gitlab.com" || hostPart.endsWith(".gitlab.com"))
    return "logos:gitlab";
  if (hostPart === "pinterest.com" || hostPart.endsWith(".pinterest.com"))
    return "logos:pinterest-icon";
  if (hostPart === "youtube.com" || hostPart.endsWith(".youtube.com"))
    return nodeIconMap.get(NodeType.YOUTUBE_VIDEO);
  if (
    hostPart === "twitter.com" ||
    hostPart.endsWith(".twitter.com") ||
    hostPart === "x.com" ||
    hostPart.endsWith(".x.com")
  )
    return nodeIconMap.get(NodeType.TWEET);
  const linkedinHosts = ["linkedin.com", "linkedin.net"];
  const threadsHosts = ["threads.com", "threads.net"];
  const mastodonHosts = [
    "mastodon.social",
    "mastodon.online",
    "mastodon.world",
    "mas.to"
  ];
  const facebookHosts = ["facebook.com", "facebook.net", "fb.com"];
  const redditHosts = ["reddit.com", "reddit.net"];
  const bskyHosts = ["bsky.app"];
  const instagramHosts = ["instagram.com", "instagr.am"];

  if (instagramHosts.some((h) => hostPart === h || hostPart.endsWith(`.${h}`)))
    return nodeIconMap.get(NodeType.INSTAGRAM_POST);
  if (linkedinHosts.some((h) => hostPart === h || hostPart.endsWith(`.${h}`)))
    return nodeIconMap.get(NodeType.LINKEDIN_POST);
  if (threadsHosts.some((h) => hostPart === h || hostPart.endsWith(`.${h}`)))
    return nodeIconMap.get(NodeType.THREADS_POST);
  if (mastodonHosts.some((h) => hostPart === h || hostPart.endsWith(`.${h}`)))
    return nodeIconMap.get(NodeType.MASTODON_POST);
  if (facebookHosts.some((h) => hostPart === h || hostPart.endsWith(`.${h}`)))
    return nodeIconMap.get(NodeType.FACEBOOK_POST);
  if (redditHosts.some((h) => hostPart === h || hostPart.endsWith(`.${h}`)))
    return nodeIconMap.get(NodeType.REDDIT_POST);
  if (bskyHosts.some((h) => hostPart === h || hostPart.endsWith(`.${h}`)))
    return nodeIconMap.get(NodeType.BLUESKY_POST);
  if (hostPart === "quora.com" || hostPart.endsWith(".quora.com"))
    return "logos:quora";
  if (hostPart === "wikipedia.org" || hostPart.endsWith(".wikipedia.org"))
    return "simple-icons:wikipedia";
  if (hostPart === "medium.com" || hostPart.endsWith(".medium.com"))
    return "logos:medium-icon";
  if (
    hostPart === "stackoverflow.com" ||
    hostPart.endsWith(".stackoverflow.com")
  )
    return "logos:stackoverflow-icon";
  if (hostPart === "dev.to" || hostPart.endsWith(".dev.to"))
    return "ph:dev-to-logo";
  if (hostPart === "drive.google.com" || hostPart.endsWith(".drive.google.com"))
    return "logos:google-drive";
  return "globe";
}

export function resolveNodeContentLabel(contentType: NodeType) {
  switch (contentType) {
    case NodeType.NODULAR_MARKDOWN:
      return "Markdown";
    case NodeType.SIMPLE_TEXT:
      return "Text";
    case NodeType.WEB_TEXT_BOOKMARK:
      return "Web Text clip";
    case NodeType.WEB_SCREENSHOT:
      return "Web Screenshot";
    case NodeType.YOUTUBE_BOOKMARK:
      return "Youtube Clip";
    case NodeType.TWEET:
      return "X Post";
    case NodeType.TWITTER_PROFILE:
      return "X Profile";
    default:
      return properCase(enumToString(contentType));
  }
}

export function resolveFilePreview(
  node: INode | INodeThumb
): IFile | IRecordId | undefined {
  const { contentType, body, file, metadata, previewImage } = node;
  if (previewImage) {
    return previewImage;
  } else if (
    contentType === NodeType.IMAGE ||
    contentType === NodeType.FILE ||
    contentType === NodeType.VIDEO
  ) {
    return file;
  } else if (contentType === NodeType.WEB_SCREENSHOT) {
    if (hasProperty(body, "file")) return resolveFilePreviewValue(body.file);
  } else if (contentType === NodeType.YOUTUBE_BOOKMARK) {
    if (hasProperty(body, "thumbnail"))
      return resolveFilePreviewValue(body.thumbnail);
  } else if (contentType === NodeType.AUDIO) {
    if (isObject(file) && hasStringProperty(file, "thumbnailUrl")) return file;
    if (hasProperty(metadata, "picture")) {
      return resolveFilePreviewValue(metadata.picture);
    }
  } else if (
    contentType === NodeType.WEB_PAGE &&
    !hasStringProperty(metadata, "ogImage") &&
    !hasStringProperty(metadata, "screenshotUrl")
  ) {
    if (hasProperty(metadata, "screenshotFile")) {
      return resolveFilePreviewValue(metadata.screenshotFile);
    }
  } else if (
    contentType === NodeType.PDF &&
    isObject(file) &&
    hasStringProperty(file, "thumbnailUrl")
  ) {
    return file;
  }
  return undefined;
}

export function resolveUrlPreview(node: INode | INodeThumb) {
  const { contentType, body, metadata } = node;
  if (contentType === NodeType.WEB_PAGE) {
    if (hasStringProperty(metadata, "ogImage")) return metadata.ogImage;
    if (hasStringProperty(metadata, "screenshotUrl"))
      return metadata.screenshotUrl;
  } else if (
    contentType === NodeType.YOUTUBE_VIDEO ||
    contentType === NodeType.YOUTUBE_SHORT ||
    contentType === NodeType.YOUTUBE_CHANNEL
  ) {
    if (hasStringProperty(metadata, "ogImage")) return metadata.ogImage;
    if (hasStringProperty(metadata, "thumbnailUrl"))
      return metadata.thumbnailUrl;
  } else if (socialProfileNodeTypeList.has(contentType)) {
    if (socialProfileWithImageUnavailable.has(contentType)) {
      if (contentType === NodeType.INSTAGRAM_PROFILE)
        return "https://instagram.com";
      else if (contentType === NodeType.THREADS_PROFILE)
        return "https://threads.com";
    }
    if (hasStringProperty(body, "profileImageUrl")) return body.profileImageUrl;
  } else if (contentType === NodeType.KINDLE_BOOK) {
    if (hasStringProperty(body, "imageUrl")) return body.imageUrl;
  }
  return undefined;
}

/**
 * If the image preview should contain instead of cover - cases like kindle books which are blurred if cover
 */
export function resolveIfImageShouldContain(contentType: NodeType) {
  return contentType === NodeType.KINDLE_BOOK;
}

export function resolveNodeLabelString(item: INodeThumb): string {
  if (typeof item?.label === "string" && isValidString(item.label))
    return item.label;
  const label = resolveNodeLabel(item);
  if (typeof label === "string")
    return isValidString(label) ? label : "Untitled";
  if (
    label &&
    typeof label === "object" &&
    "text" in label &&
    typeof label.text === "string"
  ) {
    return label.text;
  }
  return "Untitled";
}

export function resolveNodeLabel(item: INodeThumb) {
  if (!item) return "";

  const resolvedParent =
    typeof item.parent === "object" &&
    item.parent !== null &&
    !Array.isArray(item.parent) &&
    !isRecordId(item.parent)
      ? (item.parent as INode)
      : undefined;

  const hasResolvedParent = Boolean(resolvedParent);

  if (item.label && !hasResolvedParent) return item.label;

  let parent: INode | undefined = resolvedParent;
  const defaultLabels = {
    [NodeType.WEB_TEXT_BOOKMARK]:
      "Clipped Text - " + (item.body as ITextClipBody)?.text,
    [NodeType.YOUTUBE_BOOKMARK]:
      "Video timestamp - " +
      resolveVideoTimeStampStr(item.body as IVideoTimestampClip["body"]),
    [NodeType.WEB_SCREENSHOT]: "Web screenshot",
    [NodeType.TWEET]: "Unknown tweet",
    [NodeType.KINDLE_HIGHLIGHT]: "Kindle highlight"
  };

  if (socialPostNodeTypeList.has(item.contentType)) {
    const twitterParent = parent as ITwitterProfile | undefined;
    const twitterProfileLabel = isValidString(
      twitterParent?.label ?? twitterParent?.body?.name
    )
      ? ((twitterParent?.label ?? twitterParent?.body?.name) as string)
      : "Unknown";
    const prefix = enumToString(item.contentType);
    return {
      label: ` ${item.label ? item.label + " - " : ""} ${prefix} by: `,
      parent: { id: twitterParent?.id, label: twitterProfileLabel },
      text: item.body?.content ?? item.text ?? `Tweet: ${twitterProfileLabel}`
    };
  }

  switch (item.contentType) {
    case NodeType.WEB_TEXT_BOOKMARK:
    case NodeType.WEB_SCREENSHOT:
    case NodeType.KINDLE_HIGHLIGHT:
      if (!parent?.label) return item.label ?? defaultLabels[item.contentType];
      const weburl = item.url?.split("://").pop()?.split("/")[0];
      return {
        label: item.label ? item.label + " - " : "Clipped from - ",
        parent: {
          id: parent.id,
          label: parent.label ?? ""
        },
        text:
          (hasStringProperty(item.body, "text") ? item.body.text : undefined) ??
          item.text ??
          `Clip: ${parent?.label ?? weburl}`
      };
    case NodeType.YOUTUBE_BOOKMARK:
      if (!hasNumberProperty(item.body, "timestamp"))
        return item.label ?? "At - 00:00";
      const timestamp = formatSeconds(item.body.timestamp, TimeFormat.CLOCK);
      if (!parent?.label)
        return item.label
          ? item.label + " - " + timestamp
          : `At - ${timestamp}`;
      return {
        label: `${item.label ? item.label + " - " : "At "}${timestamp}: `,
        parent: {
          id: parent.id,
          label: parent.label ?? ""
        },
        text: timestamp
      };
    case NodeType.TWITTER_PROFILE:
      const twitterProfile = item as ITwitterProfile;
      return (
        twitterProfile.metadata?.ogTitle ||
        twitterProfile.label ||
        ((twitterProfile.body as ITwitterProfileBody).name
          ? twitterProfile.body.name + " X profile"
          : "Unknown X profile")
      );
    default:
      return "";
  }

  function resolveVideoTimeStampStr(body: IVideoTimestampClip["body"]) {
    if (!body || typeof body.timestamp !== "number") return "00:00";
    return formatSeconds(body.timestamp, TimeFormat.CLOCK);
  }
}

/** Resolves the best favicon-like image URL for web and social node thumbnails. */
export function resolveNodeFavicon(node: INodeFaviconSource) {
  try {
    if (
      socialProfileNodeTypeList.has(node.contentType) &&
      !socialProfileWithImageUnavailable.has(node.contentType) &&
      hasStringProperty(node.body, "profileImageUrl")
    ) {
      return node.body.profileImageUrl;
    } else if (
      node.contentType === NodeType.KINDLE_BOOK &&
      hasStringProperty(node.body, "imageUrl")
    ) {
      return node.body.imageUrl;
    } else if (hasStringProperty(node.metadata, "faviconLink")) {
      return node.metadata.faviconLink;
    }

    if (!("url" in node) || !node.url || !node.url.includes("https://")) return;
    let favicon = resolveUrlData(node.url)?.faviconUrl;
    if (favicon) return favicon;
  } catch (e) {
    logger.error({ at: "resolveNodeFavicon", e });
    return;
  }
}

export function resolveFileIcon(file: IFile) {
  if (!file || (!file.type && !file.label)) return;
  if (file.type?.includes("zip") || file.label?.endsWith(".zip"))
    return "ph:file-zip-light";
  if (
    file.type?.includes("excel") ||
    file.label?.endsWith(".xlsx") ||
    file.label?.endsWith(".xls")
  )
    return "ph:file-xls-light";
  if (
    file.type?.includes("word") ||
    file.label?.endsWith(".docx") ||
    file.label?.endsWith(".doc")
  )
    return "ph:file-doc-light";
  if (file.type?.includes("powerpoint") || file.label?.endsWith(".pptx"))
    return "ph:file-ppt-light";

  if (file.type?.includes("csv") || file.label?.endsWith(".csv"))
    return "ph:file-csv-light";

  if (file.type?.includes("html") || file.label?.endsWith(".html"))
    return "ph:file-html-light";

  if (file.type?.includes("text") || file.label?.endsWith(".txt"))
    return "ph:file-txt-light";

  return "ph:file-light";
}

/**
 * Disabling for tweets for now as the favicon is not present in tweet node metadata anymore.
 * @param node
 * @returns
 */
export function resolveNodeGraphFill(node: INode) {
  if (
    // node.contentType === NodeType.TWEET ||
    node.contentType === NodeType.TWITTER_PROFILE
  )
    return "black";
}

export function resolveNodeSubTypesForSwitcher() {
  const nodeTypes = [
    NodeType.NODULAR_MARKDOWN,
    NodeType.PDF,
    NodeType.IMAGE,
    NodeType.AUDIO,
    NodeType.VIDEO,
    ...webNodeTypeList
  ].map((x) => {
    return {
      label: resolveNodeContentLabel(x),
      value: x.toLowerCase(),
      icon: resolveNodeIcon(x)
    };
  });
  return nodeTypes;
}

export function resolveHeadingParent(
  id: IRecordId,
  structure: INodeStructure[],
  scopedParent: IRecordId[]
) {
  try {
    const hierarchy = structure
      .slice(
        0,
        structure.findIndex((x) => x.id === id)
      )
      .filter((x) => {
        const currentFactor = structure.find((s) => s.id === id)?.factor;
        return currentFactor !== undefined && x.factor < currentFactor;
      })
      .reverse()
      .reduce((acc, curr) => {
        const existingForFactor = acc.find((x) => x.factor === curr.factor);
        if (!existingForFactor) {
          acc.push(curr);
        }
        return acc;
      }, [] as INodeStructure[])
      .sort((a, b) => a.factor - b.factor)
      .map((x) => x.id);
    return [...scopedParent, ...hierarchy];
  } catch (e) {
    logger.error({ at: "resolveHeadingParent", e });
    return scopedParent;
  }
}

export function generateNodeIdPrefixed(contentType: NodeType, id: string) {
  return generateResourceId(Resource.node, {
    prefix: contentType.split("_").join("").toLowerCase(),
    id
  });
}

/**
 * Content type priority list for sorting nodes by importance (descending order)
 * Higher priority content types appear first in results
 */
const contentTypePriority: NodeType[] = [
  NodeType.NODULAR_MARKDOWN,
  NodeType.NON_NODULAR_MARKDOWN,
  NodeType.PDF,
  NodeType.IMAGE,
  NodeType.VIDEO,
  NodeType.AUDIO,
  NodeType.FILE,

  // Web pages and external content
  NodeType.WEB_PAGE,
  NodeType.GIST,

  // Social media posts (high engagement content)
  NodeType.TWEET,
  NodeType.LINKEDIN_POST,
  NodeType.BLUESKY_POST,
  NodeType.THREADS_POST,
  NodeType.INSTAGRAM_POST,
  NodeType.INSTAGRAM_REEL,
  NodeType.REDDIT_POST,
  NodeType.FACEBOOK_POST,
  NodeType.MASTODON_POST,

  // Video content
  NodeType.YOUTUBE_VIDEO,
  NodeType.YOUTUBE_SHORT,
  NodeType.COURSERA_VIDEO,
  NodeType.UDEMY_VIDEO,
  NodeType.EDX_VIDEO,
  NodeType.SKILLSHARE_VIDEO,
  NodeType.VIMEO_VIDEO,
  NodeType.TED_VIDEO,
  NodeType.KHAN_VIDEO,
  NodeType.TWITCH_STREAM,
  NodeType.RUMBLE_VIDEO,
  NodeType.INSTRUCTURE_VIDEO,
  NodeType.MOODLE_VIDEO,

  // Bookmarks and highlights
  NodeType.KINDLE_BOOK,
  NodeType.KINDLE_HIGHLIGHT,
  NodeType.WEB_TEXT_BOOKMARK,
  NodeType.PDF_BOOKMARK,
  NodeType.AUDIO_BOOKMARK,
  NodeType.VIDEO_BOOKMARK,
  NodeType.YOUTUBE_BOOKMARK,
  NodeType.WEB_VIDEO_BOOKMARK,
  NodeType.WEB_SCREENSHOT,

  // Social profiles
  NodeType.TWITTER_PROFILE,
  NodeType.LINKEDIN_PROFILE,
  NodeType.YOUTUBE_CHANNEL,
  NodeType.GITHUB_PROFILE,
  NodeType.BLUESKY_PROFILE,
  NodeType.THREADS_PROFILE,
  NodeType.INSTAGRAM_PROFILE,
  NodeType.REDDIT_PROFILE,
  NodeType.FACEBOOK_PROFILE,
  NodeType.MASTODON_PROFILE,

  // Text content types
  NodeType.HEADING1,
  NodeType.HEADING2,
  NodeType.HEADING3,
  NodeType.HEADING4,
  NodeType.HEADING5,
  NodeType.SIMPLE_TEXT,
  NodeType.QUOTE,
  NodeType.CODE,
  NodeType.CALLOUT
];

/**
 * Sort nodes by contentType priority in descending order
 * Nodes with higher priority content types appear first
 *
 * @param a First node to compare
 * @param b Second node to compare
 * @returns Comparison result for sorting
 */
export const contentTypeSort = (a: any, b: any) => {
  if (!a?.contentType || !b?.contentType) {
    if (!a?.contentType && !b?.contentType) return 0;
    if (!a?.contentType) return 1;
    if (!b?.contentType) return -1;
  }

  const aPriority = contentTypePriority.indexOf(a.contentType);
  const bPriority = contentTypePriority.indexOf(b.contentType);
  const aIndex = aPriority === -1 ? contentTypePriority.length : aPriority;
  const bIndex = bPriority === -1 ? contentTypePriority.length : bPriority;

  return aIndex - bIndex;
};
