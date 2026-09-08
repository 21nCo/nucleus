import { logger } from "@nucleum/client/runtime/logging/logger";
import type { OmitForCapture } from "@nucleum/datafn/resource.type";
import { ClipperElementIdentifier } from "@nucleum/client/config/events/clipper-event.type";
import { type ITweet, type ITwitterProfile } from "@nucleum/features/memory/node/node.type";
import { NodeType } from "@nucleum/schema/legacy/node-type.enum";
import { contentTypeMap } from "@nucleum/features/memory/node/url.utils";
import type { ISocialPost } from "@nucleum/extensions/clipper/clipper.type";
import {
  findAncestorOrSelf,
  resolveOgData
} from "@nucleum/extensions/clipper/parsers/shared/domUtils";

/**
 *
 * Note: media is not currently included in the content of the tweet as it might require reuploading the media to s3 and using in the app.
 *
 * @param tweetArticle
 * @returns
 */
function parseTweetContent(
  tweetArticle: Element,
  isMainTweetPost: boolean = false
): ISocialPost<ITweet, ITwitterProfile> | undefined {
  if (!tweetArticle) return;
  const tweetBody = tweetArticle.querySelector('[data-testid="tweetText"]');
  const linkElements = tweetArticle.querySelectorAll("a");
  const timeElements = tweetArticle.querySelectorAll("time");

  let tweetContent = tweetBody
    ? tweetBody.textContent
    : "No tweet content found";
  let tweetLinks = Array.from(linkElements).map((link) => ({
    text: link.textContent,
    href: link.getAttribute("href")
  }));
  let tweetTime = Array.from(timeElements).map((time) => {
    return {
      text: time.textContent,
      datetime: time.getAttribute("datetime")
    };
  });

  logger.log({
    at: "parsedTweetContent",
    tweetContent,
    tweetLinks,
    tweetTime
  });
  const domain = contentTypeMap.find(
    (item) => item.contentType === NodeType.TWEET
  )?.currentDomain;
  const { username, authorName, tweetId, externalLinks, profileImageUrl } =
    extractInfoFromLinks(tweetLinks, isMainTweetPost);

  let postedAt = 0;
  if (
    tweetTime[0]?.datetime &&
    !isNaN(new Date(tweetTime[0]?.datetime).getTime())
  ) {
    postedAt = new Date(tweetTime[0]?.datetime).getTime();
  }

  const profileUrl = `https://${domain}/${username}`;
  const data: OmitForCapture<ITweet> = {
    contentType: NodeType.TWEET,
    url: `https://${domain}/${username}/status/${tweetId}`,
    label: "",
    body: {
      content: tweetContent ?? "",
      postedAt
    },
    text: tweetContent ?? "",
    metadata: {
      postId: tweetId,
      username,
      tweetId,
      externalLinks,
      postedAt: tweetTime[0]?.datetime ?? ""
    }
  };

  const parent: OmitForCapture<ITwitterProfile> = {
    contentType: NodeType.TWITTER_PROFILE,
    url: profileUrl,
    label: authorName,
    body: {
      name: authorName,
      username,
      profileImageUrl
    },
    text: `${authorName} ${username}`,
    metadata: {}
  };

  return {
    data,
    parent
  };

  function extractInfoFromLinks(data: any, isMainTweetPost: boolean = false) {
    let username = "";
    let authorName = "";
    let tweetId = "";
    const currentUrl = window.location.pathname;
    const urlMatch = currentUrl.match(/\/(\w+)\/status\/(\d+)/);
    if (urlMatch && isMainTweetPost) {
      username = urlMatch[1];
      tweetId = urlMatch[2];
    } else {
      const statusItem = data.find((item) => item.href.includes("/status/"));
      if (statusItem) {
        const match = statusItem.href.match(/\/(\w+)\/status\/(\d+)/);
        if (match) {
          username = match[1];
          tweetId = match[2];
        }
      }
    }
    if (username) {
      const authorItem = data.find(
        (item) =>
          item.href === `/${username}` &&
          item.text &&
          item.text !== `@${username}`
      );
      if (authorItem) {
        authorName = authorItem.text;
      }
    }
    const media = data
      .filter((item) => item.href.includes("/photo"))
      .map((item) => item.href);
    const imgElements = tweetArticle.querySelectorAll("img");
    if (imgElements) {
      media.push(...Array.from(imgElements).map((img) => img.src));
    }
    const externalLinks = data
      .filter((item) => {
        try {
          const url = new URL(item.href);
          return url.protocol === "https:" || url.protocol === "http:";
        } catch {
          return false;
        }
      })
      .map((item) => item.href);
    const profileImageUrl = media.find((item) =>
      item.includes("profile_images")
    );
    return {
      username,
      authorName,
      tweetId,
      externalLinks,
      profileImageUrl
    };
  }
}

const tweetPostSelector = 'article[data-testid="tweet"]';

export function extractTweetFromInlineClip(
  element: Element
): ISocialPost<ITweet, ITwitterProfile> | undefined {
  const tweetArticle = findAncestorOrSelf(element, tweetPostSelector);
  if (!tweetArticle) return;
  const isPostPage = window.location.pathname.includes("/status/");
  const data = parseTweetContent(tweetArticle);
  if (!data) return;
  return { ...data, isPostPage };
}

export function extractTweetFromTweetPage():
  | ISocialPost<ITweet, ITwitterProfile>
  | undefined {
  const tweetElement = document.getElementById(
    ClipperElementIdentifier.MAIN_TWEET_POST
  );
  const tweetId = window.location.pathname.split("/status/")[1];
  const regex = new RegExp(tweetId, "i");
  const allLinks = document.querySelectorAll("a");
  const element = Array.from(allLinks).find((link) =>
    regex.test(link.getAttribute("href"))
  );
  if (!tweetElement && !element) return;
  const root = findAncestorOrSelf(tweetElement ?? element, tweetPostSelector);
  return parseTweetContent(root, true);
}

/**
 * This function is triggered from twitter profile page.
 * @returns
 */
export function extractTwitterProfile(): OmitForCapture<ITwitterProfile> {
  const url = window.location.href;
  let username = "";
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    username = pathParts[0] || "";
  } catch {
    // Fallback for malformed URLs
    const match = url.match(/\/([^/?#]+)/);
    username = match ? match[1] : "";
  }
  const bioElement = document.querySelector('[data-testid="UserDescription"]');
  const nameElement = document.querySelector('[data-testid="UserName"]');
  const linkElement = document.querySelector('[data-testid="UserUrl"]');
  const avatarElement = document.querySelector(
    `[data-testid^="UserAvatar-Container-${username}"]`
  );
  const imgElement = avatarElement?.querySelector("img");
  const profileImageUrl = imgElement?.src;
  const { ogTitle } = resolveOgData();
  const name = nameElement?.textContent?.split("@")[0];
  const bio = bioElement?.textContent;
  const bioLink = linkElement?.href;
  const bioLinkText = linkElement?.textContent;
  const text = `${name}\n${bio}`.trim();
  return {
    url,
    label: name ?? "",
    text,
    body: {
      username,
      name: name ?? "",
      bio: bio ?? "",
      profileImageUrl: profileImageUrl ?? ""
    },
    metadata: { ogTitle, bioLink, bioLinkText: bioLinkText ?? "" },
    contentType: NodeType.TWITTER_PROFILE
  };
}
