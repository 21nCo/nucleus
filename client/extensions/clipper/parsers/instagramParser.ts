import type { OmitForCapture } from "@nucleum/datafn/resource.type";
import { type IInstagramPost, type IInstagramReel, type IInstagramProfile } from "@nucleum/features/memory/node/node.type";
import { NodeType } from "@nucleum/schema/legacy/node-type.enum";
import {
  createUrlFilter,
  isHostnameMatch
} from "@nucleum/features/memory/node/url.utils";
import { generateRandomIdv2 } from "@21n/shared-utils/crypto.utils";
import type {
  ISocialPost,
  ISocialPostBase
} from "@nucleum/extensions/clipper/clipper.type";
import { findAncestorOrSelf } from "@nucleum/extensions/clipper/parsers/shared/domUtils";

function resolveInstagramContentType(url: string): NodeType {
  return /\/reel\//.test(url)
    ? NodeType.INSTAGRAM_REEL
    : NodeType.INSTAGRAM_POST;
}

function extractInstagramPostId(url: string): string {
  return (
    url.match(/\/(?:p|reel)\/([A-Za-z0-9_-]+)/)?.[1] ??
    `unknown_${generateRandomIdv2()}`
  );
}

export function extractInstagramProfileFromPage(): OmitForCapture<IInstagramProfile> {
  const url = window.location.href;
  const username = url.split("/").filter(Boolean).pop() || "";

  const displayNameElement = document.querySelector('h2[dir="auto"]');
  const displayName = displayNameElement?.textContent?.trim() || username;

  let handle = username;

  let bio = "";
  const bioElements = document.querySelectorAll(
    'span[dir="auto"], div[dir="auto"]'
  );
  for (const element of bioElements) {
    const text = element.textContent?.trim() || "";
    if (
      text.length > 20 &&
      text.length < 300 &&
      !text.includes("posts") &&
      !text.includes("followers") &&
      !text.includes("following") &&
      !text.includes("Following") &&
      !text.includes("Message") &&
      text !== displayName &&
      text !== handle &&
      !text.match(/^\d+$/)
    ) {
      if (!bio || text.length > bio.length) {
        bio = text;
      }
    }
  }

  const avatarElement = document.querySelector(
    'img[alt*="profile picture"]'
  ) as HTMLImageElement;
  const profileImageUrl = avatarElement?.src || "";

  const isVerified = !!document.querySelector('svg[aria-label="Verified"]');

  let followersCount = "0";
  const followersLinks = document.querySelectorAll('a[href*="/followers/"]');
  for (const link of followersLinks) {
    const followersSpan = link.querySelector("span");
    if (
      followersSpan?.textContent?.includes("K") ||
      followersSpan?.textContent?.includes("M") ||
      followersSpan?.textContent?.match(/\d/)
    ) {
      const followersText = followersSpan.textContent.trim();
      followersCount = followersText.replace(/[^0-9KM.,]/g, "");
      break;
    }
  }

  let postsCount = "0";
  const postsElements = document.querySelectorAll("span");
  for (const span of postsElements) {
    const text = span.textContent?.trim() || "";
    if (text.includes("posts") && text.match(/\d/)) {
      const numericMatch = text.match(/([0-9,]+)/);
      if (numericMatch) {
        postsCount = numericMatch[1].replace(/,/g, "");
        break;
      }
    }
  }

  const igWebsites = [
    "instagram.com",
    "threads.com",
    "facebook.com",
    "meta.com",
    "meta.ai"
  ];
  const websiteUrlFilter = createUrlFilter(
    igWebsites.filter((domain) => domain !== "instagram.com")
  );
  const websiteLinks = Array.from(document.querySelectorAll('a[href^="http"]'))
    .map((link) => (link as HTMLAnchorElement).href)
    .filter((url) => {
      if (isHostnameMatch(url, "l.instagram.com")) return true;
      return websiteUrlFilter(url);
    });
  const websiteUrl = websiteLinks.length > 0 ? websiteLinks[0] : "";

  const label = displayName || handle;
  const text = `${label}\n@${handle}\n${bio}`.trim();

  return {
    url,
    label,
    text,
    body: {
      username: handle,
      bio,
      profileImageUrl
    },
    metadata: {
      displayName,
      followersCount,
      postsCount,
      websiteUrl,
      isVerified
    },
    contentType: NodeType.INSTAGRAM_PROFILE
  };
}

export function extractInstagramPostFromInlineClip(
  element: Element
): ISocialPost<IInstagramPost | IInstagramReel, IInstagramProfile> | undefined {
  const postArticle = findAncestorOrSelf(element, "article");
  if (!postArticle) return;
  const isPostPage = /\/(?:p|reel)\//.test(window.location.pathname);
  const data = parseInstagramPost(postArticle);
  if (!data) return;
  return { ...data, isPostPage };
}

function parseInstagramPost(
  root: Element
):
  | ISocialPostBase<IInstagramPost | IInstagramReel, IInstagramProfile>
  | undefined {
  const textElement = root.querySelector(
    '[data-lexical-text="true"]'
  ) as HTMLElement;
  let text = textElement?.innerText?.trim() ?? "";

  if (!text || text === "") {
    const fallbackTextElement = root.querySelector(
      'div[style*="display: inline"]'
    ) as HTMLElement;
    text = fallbackTextElement?.innerText?.trim() ?? "";
  }
  const timeElement = root.querySelector("time");
  const postedAtStr =
    timeElement?.getAttribute("datetime") ??
    timeElement?.textContent?.trim() ??
    "";
  const authorLink = root.querySelector('a[href*="/"]') as HTMLAnchorElement;

  const profileImageElement = root.querySelector(
    'img[alt*="profile picture"]'
  ) as HTMLImageElement;
  const profileImageUrl = profileImageElement?.src ?? "";

  const isVerified = !!root.querySelector('svg[aria-label="Verified"]');
  const postLink = root.querySelector(
    'a[href*="/p/"], a[href*="/reel/"]'
  ) as HTMLAnchorElement;
  const postUrl = postLink?.href ?? window.location.href;
  const contentType = resolveInstagramContentType(postUrl);
  const postId = extractInstagramPostId(postUrl);

  let authorHandle = "unknown";
  if (authorLink?.href) {
    const usernameMatch = authorLink.href.match(
      /(?:instagram\.com\/|\/)([^/?]+)\/?$/
    );
    if (
      usernameMatch &&
      usernameMatch[1] !== "www.instagram.com" &&
      usernameMatch[1] !== "instagram.com"
    ) {
      authorHandle = usernameMatch[1];
    } else {
      const pathname = new URL(authorLink.href).pathname;
      const pathSegments = pathname.split("/").filter(Boolean);
      if (pathSegments.length > 0) {
        authorHandle = pathSegments[pathSegments.length - 1];
      }
    }
  }
  const authorUrl = authorLink
    ? new URL(authorLink.href, window.location.origin).toString()
    : undefined;

  const likesElement = root.querySelector(
    'a[href*="/liked_by/"], a[href$="/liked_by"]'
  );
  const likesText = likesElement?.textContent?.trim();
  const likes = likesText?.replace(/[^0-9,]/g, "") ?? "0";

  const urlFilter = createUrlFilter(
    ["instagram.com"],
    ["/p/", "/reel/"],
    window.location.href
  );
  const links = Array.from(root.querySelectorAll('a[href^="http"]'))
    .map((a: any) => a.href)
    .filter(urlFilter);

  const videoElement = root.querySelector("video");
  const imageElements = root.querySelectorAll(
    'img:not([alt*="profile picture"])'
  );
  const media: string[] = [];

  if (videoElement?.src) {
    media.push(videoElement.src);
  }

  imageElements.forEach((img) => {
    const imgElement = img as HTMLImageElement;
    if (
      imgElement.src &&
      !imgElement.alt?.includes("profile") &&
      isHostnameMatch(imgElement.src, "fbcdn.net")
    ) {
      media.push(imgElement.src);
    }
  });

  const data: OmitForCapture<IInstagramPost | IInstagramReel> = {
    contentType,
    label: "",
    text,
    body: {
      postedAt:
        postedAtStr && !isNaN(new Date(postedAtStr).getTime())
          ? new Date(postedAtStr).getTime()
          : 0,
      links
    },
    metadata: {
      postId,
      username: authorHandle,
      postedAt: postedAtStr,
      media,
      likes,
      isVerified
    },
    url: postUrl
  };

  const parent: OmitForCapture<IInstagramProfile> = {
    contentType: NodeType.INSTAGRAM_PROFILE,
    label: authorHandle,
    text: `@${authorHandle}`,
    body: {
      username: authorHandle,
      profileImageUrl
    },
    url: authorUrl ?? ""
  };

  return {
    data,
    parent
  };
}

export function extractInstagramPostFromPage():
  | ISocialPost<IInstagramPost | IInstagramReel, IInstagramProfile>
  | undefined {
  const contentType = resolveInstagramContentType(window.location.href);
  const postIdMatch = window.location.pathname.match(/\/(?:p|reel)\/([^/]+)/);
  if (!postIdMatch) return;
  const postId = postIdMatch[1];
  const mainContainer = document.querySelector("main");
  const articleContainer = mainContainer
    ?.querySelector("div")
    ?.querySelector("div");
  if (!mainContainer || !articleContainer) {
    return {
      data: {
        contentType,
        label: "",
        text: "",
        body: {
          postedAt: 0
        },
        metadata: {
          postId: postId ?? extractInstagramPostId(window.location.href),
          username: "unknown"
        },
        url: window.location.href
      },
      parent: {
        contentType: NodeType.INSTAGRAM_PROFILE,
        label: "",
        text: "",
        body: {
          username: "unknown",
          profileImageUrl: ""
        },
        url: window.location.href
      }
    };
  }
  return parseInstagramPostFromPage(articleContainer);
}

export function parseInstagramPostFromPage(
  root: Element
):
  | ISocialPostBase<IInstagramPost | IInstagramReel, IInstagramProfile>
  | undefined {
  const textElements = root.querySelectorAll(
    'span[style*="line-height: 18px"]'
  );
  let text = "";

  for (const element of textElements) {
    const elementText = element.textContent?.trim() ?? "";
    if (
      elementText.length > text.length &&
      elementText.length > 15 &&
      !elementText.includes("likes") &&
      !elementText.includes("ago") &&
      !elementText.includes("•") &&
      !elementText.match(/^\d+[smhd]$/) &&
      !elementText.match(/^@\w+$/)
    ) {
      text = elementText;
    }
  }

  const timeElement = root.querySelector("time");
  const postedAtStr =
    timeElement?.getAttribute("datetime") ??
    timeElement?.textContent?.trim() ??
    "";

  let authorName = "";
  let authorHandle = "";
  const profileLinks = root.querySelectorAll('a[href*="/"]');
  for (const link of profileLinks) {
    const href = (link as HTMLAnchorElement).href;
    const usernameMatch = href.match(/instagram\.com\/([^/?]+)/);
    if (usernameMatch && usernameMatch[1] !== "p") {
      authorHandle = usernameMatch[1];
      authorName = authorHandle;
      break;
    }
  }

  const profileImageElement = root.querySelector(
    'img[alt*="profile picture"]'
  ) as HTMLImageElement;
  const profileImageUrl = profileImageElement?.src ?? "";

  const isVerified = !!root.querySelector('svg[aria-label="Verified"]');

  const postUrl = window.location.href;
  const contentType = resolveInstagramContentType(postUrl);
  const postId = extractInstagramPostId(postUrl);

  const authorUrl = `https://www.instagram.com/${authorHandle}/`;

  let likes = "0";
  const likesElements = root.querySelectorAll("span");
  for (const span of likesElements) {
    const spanText = span.textContent?.trim() ?? "";
    if (spanText.includes("likes") && spanText.match(/\d/)) {
      const numericMatch = spanText.match(/([0-9,]+)/);
      if (numericMatch) {
        likes = numericMatch[1].replace(/,/g, "");
      }
      break;
    }
  }

  const urlFilter = createUrlFilter(
    ["instagram.com"],
    ["/p/", "/reel/"],
    window.location.href
  );
  const links = Array.from(root.querySelectorAll('a[href^="http"]'))
    .map((a: any) => a.href)
    .filter(urlFilter);

  const media: string[] = [];

  const videoElements = root.querySelectorAll("video");
  videoElements.forEach((video) => {
    if (video.src && !video.src.startsWith("blob:")) {
      media.push(video.src);
    }
  });

  const imageElements = root.querySelectorAll(
    'img:not([alt*="profile picture"]):not([alt*="avatar"])'
  );
  imageElements.forEach((img) => {
    const imgElement = img as HTMLImageElement;
    if (
      imgElement.src &&
      isHostnameMatch(imgElement.src, "fbcdn.net") &&
      !imgElement.alt?.toLowerCase().includes("profile") &&
      !imgElement.alt?.toLowerCase().includes("avatar")
    ) {
      media.push(imgElement.src);
    }
  });

  const data: OmitForCapture<IInstagramPost | IInstagramReel> = {
    contentType,
    label: "",
    text,
    body: {
      postedAt:
        postedAtStr && !isNaN(new Date(postedAtStr).getTime())
          ? new Date(postedAtStr).getTime()
          : 0,
      links
    },
    metadata: {
      postId,
      username: authorHandle,
      postedAt: postedAtStr,
      media,
      likes,
      isVerified
    },
    url: postUrl
  };

  const parent: OmitForCapture<IInstagramProfile> = {
    contentType: NodeType.INSTAGRAM_PROFILE,
    label: authorName || authorHandle,
    text: `${authorName || authorHandle} @${authorHandle}`,
    body: {
      username: authorHandle,
      profileImageUrl
    },
    url: authorUrl
  };

  return {
    data,
    parent
  };
}
