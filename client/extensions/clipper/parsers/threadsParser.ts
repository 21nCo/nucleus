import type { OmitForCapture } from "@nucleum/datafn/resource.type";
import {
  NodeType,
  type IThreadsPost,
  type IThreadsProfile
} from "@nucleum/features/memory/node/node.type";
import { createUrlFilter } from "@nucleum/features/memory/node/url.utils";
import { generateRandomIdv2 } from "@21n/shared-utils/crypto.utils";
import { csuiSelector } from "@nucleum/extensions/clipper/clipper.constants";
import type {
  ISocialPost,
  ISocialPostBase
} from "@nucleum/extensions/clipper/clipper.type";
import {
  findAncestorOrSelf,
  resolveParentNLevel
} from "@nucleum/extensions/clipper/parsers/shared/domUtils";

export function extractThreadsPostFromPage():
  | ISocialPost<IThreadsPost, IThreadsProfile>
  | undefined {
  const postId = window.location.pathname.split("/post/")[1];
  if (!postId) return;
  const regex = new RegExp(postId, "i");
  const allLinks = document.querySelectorAll("a");
  const element = Array.from(allLinks).find(
    (link) =>
      regex.test(link.getAttribute("href")) && link.ariaLabel !== "Column title"
  );
  if (!element) return;
  const root = resolveParentNLevel(7, element);
  const clipButtonElement = root?.querySelector(csuiSelector);
  if (!clipButtonElement) return;
  return parseThreadsPost(clipButtonElement);
}

export function extractThreadsPostFromInlineClip(
  element: Element
): ISocialPost<IThreadsPost, IThreadsProfile> | undefined {
  const isPostPage = window.location.pathname.includes("/post/");
  const data = parseThreadsPost(element);
  if (!data) return;
  return { ...data, isPostPage };
}

function parseThreadsPost(
  element: Element
): ISocialPostBase<IThreadsPost, IThreadsProfile> | undefined {
  const csui = findAncestorOrSelf(element, csuiSelector);
  const root = resolveParentNLevel(5, csui);
  const contentElements = csui?.parentElement?.parentElement
    ? Array.from(
        csui.parentElement.parentElement.parentElement?.children ?? []
      ).filter((el) => el !== csui.parentElement.parentElement)
    : undefined;
  if (!root) return;
  // Extract text content
  const textElements = root.querySelectorAll('[data-lexical-text="true"]');
  let text = "";
  textElements.forEach((el) => {
    if (el.textContent?.trim()) {
      text += el.textContent.trim() + " ";
    }
  });
  text = text.trim();
  if (!text) {
    const textContentElement = contentElements?.find(
      (x) => !x.querySelector("img") && !x.querySelector("svg")
    );
    text = textContentElement?.textContent?.trim() ?? "";
  }
  const imageContentElement = contentElements?.find((x) =>
    x.querySelector("img")
  );
  let imageUrls: string[] = [];
  if (imageContentElement) {
    imageUrls =
      Array.from(
        (imageContentElement as HTMLDivElement).querySelectorAll("img")
      )
        ?.map((img) => img.src)
        ?.filter(Boolean) ?? [];
  }
  const timeEl = root.querySelector("time");
  const authorLink = root.querySelector('a[href*="/@"]') as HTMLAnchorElement;
  const avatarImg = root.querySelector(
    'img[alt*="profile picture"], img[alt*="avatar"]'
  ) as HTMLImageElement;

  const postLink = root.querySelector('a[href*="/post/"]') as HTMLAnchorElement;

  const urlFilter = createUrlFilter(
    ["threads.net"],
    ["/@", "/post/"],
    window.location.href
  );
  const links = Array.from(root.querySelectorAll('a[href^="http"]'))
    .map((a: any) => a.href)
    .filter(urlFilter);

  const authorHandle = authorLink?.pathname?.startsWith("/@")
    ? authorLink.pathname.substring(2)
    : authorLink?.href?.match(/@(.+?)(?:$|\/)/)?.[1];

  const authorName = authorLink?.textContent?.trim();

  const authorUrl = authorLink
    ? new URL(authorLink.href, window.location.origin).toString()
    : undefined;

  const postIdMatch = postLink?.href?.match(/\/post\/([A-Za-z0-9]+)(?:$|\?)/);
  const postId = postIdMatch ? postIdMatch[1] : undefined;

  const postUrl = postLink
    ? new URL(postLink.href, window.location.origin).toString()
    : window.location.href;
  const postedAtStr = timeEl?.getAttribute("datetime");
  let postedAt = 0;
  if (postedAtStr && !isNaN(new Date(postedAtStr).getTime())) {
    postedAt = new Date(postedAtStr).getTime();
  }
  const data: OmitForCapture<IThreadsPost> = {
    contentType: NodeType.THREADS_POST,
    label: "",
    text,
    body: {
      postedAt,
      links
    },
    metadata: {
      postId: postId ?? `unknown_${generateRandomIdv2()}`,
      postedAt: postedAtStr,
      username: authorHandle ?? "unknown",
      media: imageUrls
    },
    url: postUrl
  };
  const parent: OmitForCapture<IThreadsProfile> = {
    contentType: NodeType.THREADS_PROFILE,
    text: `${authorName}`,
    label: authorName ?? "",
    body: {
      username: authorHandle ?? "unknown",
      profileImageUrl: avatarImg?.src ?? undefined
    },
    url: authorUrl ?? ""
  };
  return {
    data,
    parent
  };
}

export function extractThreadsProfile(): OmitForCapture<IThreadsProfile> {
  const url = window.location.href;
  const username = url.split("/@")[1]?.split("/")[0] || "";

  const h1Elements = document.querySelectorAll("h1");
  const displayNameElement = h1Elements[1] || h1Elements[0];
  const displayName = displayNameElement?.textContent?.trim() || "";

  const usernameElements = Array.from(document.querySelectorAll("span")).filter(
    (span) => span.textContent?.trim().startsWith(username)
  );
  let handle = username;
  if (usernameElements.length > 0) {
    handle = usernameElements[0].textContent?.trim() || username;
  }

  const bioElements = Array.from(document.querySelectorAll("span")).filter(
    (span) => {
      const text = span.textContent?.trim() || "";
      return (
        text.length > 50 &&
        !text.includes("followers") &&
        !text.includes("following") &&
        !text.startsWith("http") &&
        !text.includes(displayName) &&
        !text.includes(username)
      );
    }
  );
  const bio =
    bioElements.length > 0 ? bioElements[0].textContent?.trim() || "" : "";

  const avatarElement = document.querySelector('img[alt*="profile picture"]');
  const profileImageUrl = avatarElement?.src || "";

  const followersElements = Array.from(
    document.querySelectorAll("span")
  ).filter((span) => span.textContent?.includes("followers"));
  let followersCount = "0";
  if (followersElements.length > 0) {
    const followersText = followersElements[0].textContent?.trim() || "";
    followersCount = followersText.split(" ")[0] || "0";
  }

  const websiteUrlFilter = createUrlFilter(["threads.com", "instagram.com"]);
  const websiteLinks = Array.from(document.querySelectorAll('a[href^="http"]'))
    .map((link) => link.href)
    .filter(websiteUrlFilter);
  const websiteUrl = websiteLinks.length > 0 ? websiteLinks[0] : "";

  const label = displayName || handle;
  const text = `${label}\n${handle}\n${bio}`.trim();

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
      websiteUrl
    },
    contentType: NodeType.THREADS_PROFILE
  };
}
