import type { OmitForCapture } from "@nucleum/datafn/resource.type";
import {
  NodeType,
  type IRedditPost,
  type IRedditProfile,
  type IRedditSub
} from "@nucleum/features/memory/node/node.type";
import { createUrlFilter } from "@nucleum/features/memory/node/url.utils";
import { generateRandomIdv2 } from "@21n/shared-utils/crypto.utils";
import type {
  ISocialPost,
  ISocialPostBase
} from "@nucleum/extensions/clipper/clipper.type";
import { findAncestorOrSelf } from "@nucleum/extensions/clipper/parsers/shared/domUtils";

export function extractRedditPostFromInlineClip(
  element: Element
): ISocialPost<IRedditPost, IRedditProfile> | undefined {
  const postArticle = findAncestorOrSelf(element, "article");
  if (!postArticle) return;
  const isPostPage = window.location.pathname.includes("/comments/");
  const data = parseRedditPost(postArticle);
  if (!data) return;
  return { ...data, isPostPage };
}

function parseRedditPost(
  root: Element
): ISocialPostBase<IRedditPost, IRedditProfile, IRedditSub> | undefined {
  let title = root.getAttribute("aria-label") || "";

  const textElement = root.querySelector(
    '[data-post-click-location="text-body"]'
  ) as HTMLElement;
  let text = textElement?.innerText?.trim() ?? "";

  if (!text) {
    const fallbackTextElement = root.querySelector(
      ".md, .usertext-body, [property='schema:articleBody']"
    ) as HTMLElement;
    text = fallbackTextElement?.innerText?.trim() ?? "";
  }

  const subredditLink = root.querySelector(
    'a[data-testid="subreddit-name"], a[href*="/r/"]'
  ) as HTMLAnchorElement;
  let subreddit = "unknown";
  if (subredditLink?.href) {
    const subredditMatch = subredditLink.href.match(/\/r\/([^/?]+)/);
    if (subredditMatch) {
      subreddit = subredditMatch[1];
    }
  }

  let username = "unknown";
  const authorElement = root.querySelector(
    "[author], [data-author]"
  ) as HTMLElement;
  if (authorElement) {
    username =
      authorElement.getAttribute("author") ||
      authorElement.getAttribute("data-author") ||
      authorElement.textContent?.trim() ||
      "unknown";
  } else {
    const authorSpan = root.querySelector(
      'span[id*="feed-post-credit-bar"] span'
    ) as HTMLElement;
    if (authorSpan?.textContent?.startsWith("u/")) {
      username = authorSpan.textContent.replace("u/", "");
    }
    const authorLink = root.querySelector(
      'a[href*="/user/"]'
    ) as HTMLAnchorElement;
    if (authorLink?.href) {
      username = authorLink.href.split("/user/")[1]?.split("/")[0] ?? "unknown";
    }
  }

  const timeElement = root.querySelector("faceplate-timeago") as HTMLElement;
  let postedAtStr = "";
  if (timeElement) {
    const timeEl = timeElement.querySelector("time");
    postedAtStr =
      timeEl?.getAttribute("datetime") ?? timeEl?.textContent?.trim() ?? "";
  }

  let postId = "";
  const postUrl = window.location.href;
  const postIdMatch = postUrl.match(/\/comments\/([a-zA-Z0-9]+)/);
  if (postIdMatch) {
    postId = postIdMatch[1];
  }
  const postElement =
    root.nodeName === "SHREDDIT-POST"
      ? root
      : root.querySelector("shreddit-post");
  if (postElement) {
    if (!postId || postId === "")
      postId = postElement.id
        ? postElement.id.replace("t3_", "")
        : (postElement.permalink.match(/\/comments\/([a-zA-Z0-9]+)/)?.[1] ??
          `unknown_${generateRandomIdv2()}`);
    if (!title || title === "") {
      title = postElement.getAttribute("post-title") ?? "";
    }
  }

  const scoreElement = root.querySelector(
    "[score], [data-score]"
  ) as HTMLElement;
  let upvotes = "0";
  if (scoreElement) {
    upvotes =
      scoreElement.getAttribute("score") ||
      scoreElement.getAttribute("data-score") ||
      scoreElement.textContent?.trim() ||
      "0";
  }

  let commentsCount = "0";
  const commentsElement = root.querySelector(
    "[comment-count], [data-comment-count]"
  ) as HTMLElement;
  if (commentsElement) {
    commentsCount =
      commentsElement.getAttribute("comment-count") ||
      commentsElement.getAttribute("data-comment-count") ||
      "0";
  }

  const flairElement = root.querySelector(
    ".post-flair, [data-flair-text]"
  ) as HTMLElement;
  const flair = flairElement?.textContent?.trim() || undefined;

  let domain = "self." + subreddit;
  const domainElement = root.querySelector(
    "[domain], [data-domain]"
  ) as HTMLElement;
  if (domainElement) {
    domain =
      domainElement.getAttribute("domain") ||
      domainElement.getAttribute("data-domain") ||
      domain;
  }

  const urlFilter = createUrlFilter(
    ["reddit.com", "redd.it"],
    [],
    window.location.href
  );
  const links = Array.from(root.querySelectorAll('a[href^="http"]'))
    .map((a: any) => a.href)
    .filter(urlFilter);

  const finalPostUrl = postUrl.includes("/comments/")
    ? postUrl
    : `https://www.reddit.com/r/${subreddit}/comments/${postId}/`;

  const data: OmitForCapture<IRedditPost> = {
    contentType: NodeType.REDDIT_POST,
    label: title,
    text: text || title,
    body: {
      postedAt:
        postedAtStr && !isNaN(new Date(postedAtStr).getTime())
          ? new Date(postedAtStr).getTime()
          : 0,
      links
    },
    metadata: {
      postId,
      subreddit,
      username,
      postedAt: postedAtStr,
      upvotes,
      commentsCount,
      flair,
      domain
    },
    url: finalPostUrl
  };

  const parent: OmitForCapture<IRedditProfile> = {
    contentType: NodeType.REDDIT_PROFILE,
    label: username,
    text: `u/${username}`,
    body: {
      username,
      bio: "",
      profileImageUrl: ""
    },
    url: `https://www.reddit.com/user/${username}/`
  };

  const sub: OmitForCapture<IRedditSub> = {
    contentType: NodeType.REDDIT_SUB,
    label: subreddit,
    text: `r/${subreddit}`,
    body: {
      username: subreddit,
      bio: "",
      profileImageUrl: ""
    },
    url: `https://www.reddit.com/r/${subreddit}/`
  };

  return {
    data,
    parent,
    sub
  };
}

export function extractRedditPostFromPage():
  | ISocialPost<IRedditPost, IRedditProfile, IRedditSub>
  | undefined {
  const postId = window.location.pathname.split("/comments/")[1]?.split("/")[0];
  if (!postId) return;
  const postArticle = document.querySelector(
    `article[id*="${postId}"], [data-ks-id*="${postId}"], shreddit-post`
  );

  if (!postArticle) {
    const articles = document.querySelectorAll("article");
    const targetArticle = Array.from(articles).find(
      (article) =>
        article.getAttribute("aria-label") ||
        article.querySelector('[id*="post-rtjson-content"]')
    );
    if (targetArticle) {
      return parseRedditPost(targetArticle);
    }
    return;
  }

  return parseRedditPost(postArticle);
}
