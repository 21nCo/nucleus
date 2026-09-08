import type { OmitForCapture } from "@nucleum/datafn/resource.type";
import { type IMastodonPost, type IMastodonProfile } from "@nucleum/features/memory/node/node.type";
import { NodeType } from "@nucleum/schema/legacy/node-type.enum";
import { csuiSelector } from "@nucleum/extensions/clipper/clipper.constants";
import type {
  ISocialPost,
  ISocialPostBase
} from "@nucleum/extensions/clipper/clipper.type";
import { findAncestorOrSelf } from "@nucleum/extensions/clipper/parsers/shared/domUtils";

export function extractMastodonPostFromPage():
  | ISocialPost<IMastodonPost, IMastodonProfile>
  | undefined {
  const article = document.querySelector(`.detailed-status__wrapper`);
  if (!article) return;

  return parseMastodonPost(article, true);
}

export function extractMastodonPostFromInlineClip(
  element: Element
): ISocialPost<IMastodonPost, IMastodonProfile> | undefined {
  let article = findAncestorOrSelf(element, "article[data-id]");
  let isPostPage = false;
  if (!article) {
    article = findAncestorOrSelf(element, ".status-reply");
    if (!article) article = findAncestorOrSelf(element, ".status--in-thread");
    if (article) isPostPage = true;
  }
  if (!article) return;
  if (!isPostPage)
    isPostPage =
      window.location.pathname.includes("/@") &&
      /\/\d+$/.test(window.location.pathname);

  const data = parseMastodonPost(article);
  if (!data) return;

  return { ...data, isPostPage };
}

function parseMastodonPost(
  root: Element,
  isMainPost: boolean = false
): ISocialPostBase<IMastodonPost, IMastodonProfile> | undefined {
  let postId = root.getAttribute("data-id");
  if (!postId && isMainPost)
    postId = window.location.pathname.split("/").pop() ?? null;
  if (!postId || !/^\d+$/.test(postId)) return;

  const textElement = root.querySelector(".status__content__text");
  const text = textElement?.textContent?.trim() || "";

  const authorLink = (root.querySelector(".status__display-name") ||
    root.querySelector(".detailed-status__display-name")) as HTMLAnchorElement;
  const authorName =
    authorLink?.querySelector("strong")?.textContent?.trim() || "";
  const authorUsername =
    authorLink
      ?.querySelector(".display-name__account")
      ?.textContent?.trim()
      .replace("@", "") ||
    authorLink?.href.split("/@").pop() ||
    "";

  const avatarImg = root.querySelector(
    ".account__avatar img"
  ) as HTMLImageElement;
  const profileImageUrl = avatarImg?.src || "";

  const timeElement = root.querySelector("time");
  const postedAtStr =
    timeElement?.getAttribute("datetime") ||
    timeElement?.textContent?.trim() ||
    "";

  const mediaImages = Array.from(root.querySelectorAll(".media-gallery img"))
    .map((img) => (img as HTMLImageElement).src)
    .filter(Boolean);

  const links = Array.from(
    root.querySelectorAll('.status__content a[href^="http"]')
  )
    .map((a) => (a as HTMLAnchorElement).href)
    .filter((href: string) => {
      return !href.includes("/@") && !href.includes("/web/statuses/");
    });

  const replyCount =
    root
      .querySelector(".status__action-bar .icon-button__counter")
      ?.textContent?.trim() || "0";
  const visibility =
    root.querySelector(".status__visibility-icon")?.getAttribute("title") ||
    "public";

  const authorUrl = authorLink?.href;
  const postUrl = `${authorUrl}/${postId}`;

  const data: OmitForCapture<IMastodonPost> = {
    contentType: NodeType.MASTODON_POST,
    text,
    label: "",
    body: {
      postedAt:
        postedAtStr && !isNaN(new Date(postedAtStr).getTime())
          ? new Date(postedAtStr).getTime()
          : 0,
      links
    },
    metadata: {
      postId,
      username: authorUsername,
      postedAt: postedAtStr,
      media: mediaImages,
      externalLinks: links,
      replies: replyCount,
      visibility
    },
    url: postUrl
  };

  const parent: OmitForCapture<IMastodonProfile> = {
    contentType: NodeType.MASTODON_PROFILE,
    label: authorName || authorUsername,
    text: `${authorName} @${authorUsername}`,
    body: {
      username: authorUsername,
      profileImageUrl
    },
    url: authorUrl
  };

  return {
    data,
    parent
  };
}

export function extractMastodonProfile():
  | OmitForCapture<IMastodonProfile>
  | undefined {
  const url = window.location.href;
  const username = url.split("/@")[1]?.split("/")[0] || "";

  const root = findAncestorOrSelf(
    document.querySelector(
      `${csuiSelector}#memotron-clipper-mastodonprofile-root`
    ),
    ".account__header"
  );

  if (!root) return;

  const displayNameElement = root.querySelector("h1 span");
  const displayName = displayNameElement?.textContent?.trim() || "";

  const bioElement = root.querySelector(".account__header__content");
  const bio = bioElement?.textContent?.trim() || "";

  const avatarElement = root.querySelector(
    ".account__avatar img"
  ) as HTMLImageElement;
  const profileImageUrl = avatarElement?.src || "";

  const headerElement = root.querySelector(
    ".account__header img"
  ) as HTMLImageElement;
  const bannerImageUrl = headerElement?.src || "";

  const followersElement = root.querySelector('[href$="/followers"]');
  const followersCount =
    followersElement?.title || followersElement?.textContent?.trim() || "0";

  const followingElement = root.querySelector('[href$="/following"]');
  const followingCount =
    followingElement?.title || followingElement?.textContent?.trim() || "0";

  const postsElement = root.querySelector(
    ".account__header__extra__links > a:first-child"
  );
  const postsCount =
    postsElement?.title || postsElement?.textContent?.trim() || "0";

  const label = displayName || username;
  const text = `${label}\n@${username}\n${bio}`.trim();

  return {
    url,
    label,
    text,
    body: {
      username,
      bio,
      profileImageUrl
    },
    metadata: {
      displayName,
      followersCount,
      followingCount,
      postsCount,
      bannerImageUrl
    },
    contentType: NodeType.MASTODON_PROFILE
  };
}
