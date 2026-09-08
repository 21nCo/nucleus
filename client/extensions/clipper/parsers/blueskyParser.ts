import type { OmitForCapture } from "@nucleum/datafn/resource.type";
import { type IBlueskyPost, type IBlueskyProfile } from "@nucleum/features/memory/node/node.type";
import { NodeType } from "@nucleum/schema/legacy/node-type.enum";
import type {
  ISocialPost,
  ISocialPostBase
} from "@nucleum/extensions/clipper/clipper.type";
import {
  findAncestorOrSelf,
  parseFullDateTimeString,
  resolveOgData
} from "@nucleum/extensions/clipper/parsers/shared/domUtils";

const blueSkyPostThreadSelector = '[data-testid^="postThreadItem-"]';

export function extractBlueskyProfile(): OmitForCapture<IBlueskyProfile> {
  const url = window.location.href;
  const username = url.split("/profile/")[1]?.split("/")[0] || "";

  const displayNameElement = document.querySelector(
    '[data-testid="profileHeaderDisplayName"]'
  );
  const displayName = displayNameElement?.textContent?.trim() || "";

  const usernameElement = document.querySelector(
    '[data-testid="profileHeaderHandle"]'
  );
  let handle = usernameElement?.textContent?.trim() || "";
  if (handle.startsWith("@")) {
    handle = handle.substring(1);
  }

  if (!handle && username) {
    handle = username;
  }

  const bioElement = document.querySelector(
    '[data-testid="profileHeaderDescription"]'
  );
  const bio = bioElement?.textContent?.trim() || "";

  const avatarElement = document.querySelector(
    '[data-testid="userAvatarImage"] img'
  );
  const profileImageUrl = avatarElement?.src || "";

  const bannerElement = document.querySelector(
    '[data-testid="userBannerImage"] img'
  );
  const bannerImageUrl = bannerElement?.src || "";

  const followersElement = document.querySelector(
    '[data-testid="profileHeaderFollowersButton"]'
  );
  const followersText = followersElement?.textContent?.trim() || "";
  const followersCount = followersText.split(" ")[0] || "0";

  const followingElement = document.querySelector(
    '[data-testid="profileHeaderFollowsButton"]'
  );
  const followingText = followingElement?.textContent?.trim() || "";
  const followingCount = followingText.split(" ")[0] || "0";

  const label = displayName || handle;
  const text = `${label}\n${displayName}\n${bio}`.trim();
  const { ogTitle } = resolveOgData();

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
      ogTitle,
      displayName,
      followersCount,
      followingCount,
      bannerImageUrl
    },
    contentType: NodeType.BLUESKY_PROFILE
  };
}

export function extractBskyPostFromInlineClip(
  element: Element
): ISocialPost<IBlueskyPost, IBlueskyProfile> | undefined {
  let root = findAncestorOrSelf(element, '[data-testid^="feedItem-"]');
  let isPostPage = false;
  if (!root) {
    root = findAncestorOrSelf(element, blueSkyPostThreadSelector);
    if (root) isPostPage = true;
  }
  if (!root) return;
  let data = parseBlueSkyPost(root);
  return { ...data, isPostPage };
}

export function extractBskyPostFromPage():
  | ISocialPost<IBlueskyPost, IBlueskyProfile>
  | undefined {
  const postId = window.location.pathname.split("/post/")[1];
  if (!postId) return;
  const regex = new RegExp(postId, "i");
  const allLinks = document.querySelectorAll("a");
  const element = Array.from(allLinks).find((link) =>
    regex.test(link.getAttribute("href"))
  );
  if (!element) return;
  const root = findAncestorOrSelf(element, blueSkyPostThreadSelector);
  if (!root) return;
  return parseBlueSkyPost(root, true);
}

function parseBlueSkyPost(
  root: Element,
  isPostPage: boolean = false
): ISocialPostBase<IBlueskyPost, IBlueskyProfile> {
  let textEl = (root.querySelector(
    '[data-testid="postText"], [data-lexical-text]'
  ) || root.querySelector('[data-testid="recordText"]')) as HTMLElement;
  if (!textEl) {
    const fallbackDiv = root.querySelector("div[data-word-wrap='1']");
    textEl = fallbackDiv as HTMLElement;
  }
  const timeEl = root.querySelector("time");
  const authorLink = (root.querySelector(
    'a[href^="/@"], a[href*="/profile/"]'
  ) ||
    root.querySelector('a[aria-label*="View profile" i]')) as HTMLAnchorElement;
  const avatarLink = root.querySelector(
    'div[data-testid="userAvatarImage"]'
  ) as HTMLDivElement;
  const authorName = avatarLink
    ?.closest("a")
    ?.ariaLabel?.trim()
    ?.replace(/'s avatar$/, "");
  const authorImgUrl = avatarLink?.querySelector("img")?.src;
  const avatarImg = root.querySelector(
    'img[alt*="avatar" i], img[alt*="profile" i]'
  ) as HTMLImageElement;
  const postLink =
    (
      Array.from(
        root.querySelectorAll('a[href*="/post/"]')
      ) as HTMLAnchorElement[]
    ).find((a) => /\/post\/[A-Za-z0-9]+\/?$/.test(a.href)) ||
    ((
      Array.from(
        root.querySelectorAll('a[href*="/profile/"][href*="/post/"]')
      ) as HTMLAnchorElement[]
    ).find((a) =>
      /\/post\/[A-Za-z0-9]+\/?$/.test(a.href)
    ) as HTMLAnchorElement);
  let postUrl = postLink?.href;
  if (!postLink && /\/post\/[A-Za-z0-9]+\/?$/.test(window.location.href)) {
    postUrl = window.location.href;
  }
  const postId = postUrl?.match(/\/post\/([A-Za-z0-9]+)\/?$/)?.[1];
  const links = Array.from(root.querySelectorAll('a[href^="http"]'))
    .map((a: any) => a.href)
    .filter(
      (href: string) => !href.includes("/profile/") && !href.includes("/post/")
    );
  const authorHandle = authorLink?.pathname?.startsWith("/@")
    ? authorLink.pathname.substring(2)
    : authorLink?.href?.match(/profile\/(.+?)(?:$|\/)/)?.[1];
  const authorUrl = authorLink
    ? new URL(authorLink.href, window.location.origin).toString()
    : undefined;
  const timeElement = Array.from(root.querySelectorAll("[aria-label]")).find(
    (el: Element) =>
      typeof el.getAttribute("aria-label") === "string" &&
      /\bat\b/.test(el.getAttribute("aria-label")!)
  ) as HTMLElement | undefined;
  const postedAtString = timeElement?.getAttribute("aria-label") ?? undefined;
  const username = authorHandle ?? "unknown";
  let postedAt = 0;
  if (postedAtString) {
    const date = parseFullDateTimeString(postedAtString);
    if (date) {
      postedAt = date.getTime();
    }
  }
  const data: OmitForCapture<IBlueskyPost> = {
    contentType: NodeType.BLUESKY_POST,
    text: textEl?.innerText?.trim(),
    label: "",
    body: {
      postedAt,
      links
    },
    metadata: {
      postId: postId ?? "unknown",
      username,
      postedAt: postedAtString ?? timeEl?.getAttribute("datetime") ?? ""
    },
    url: postUrl
  };

  const parent: OmitForCapture<IBlueskyProfile> = {
    contentType: NodeType.BLUESKY_PROFILE,
    label: authorName ?? authorLink?.textContent?.trim() ?? "",
    text: `${authorName ?? authorLink?.textContent?.trim()} ${authorHandle}`,
    body: {
      username,
      profileImageUrl: authorImgUrl ?? avatarImg?.src ?? undefined
    },
    url: authorUrl ?? ""
  };
  return {
    data,
    parent
  };
}
