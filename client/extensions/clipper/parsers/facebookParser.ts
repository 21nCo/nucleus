import type { OmitForCapture } from "@nucleum/datafn/resource.type";
import {
  NodeType,
  type IFacebookPost,
  type IFacebookProfile
} from "@nucleum/features/memory/node/node.type";
import {
  createUrlFilter,
  isHostnameMatch
} from "@nucleum/features/memory/node/url.utils";
import { csuiSelector } from "@nucleum/extensions/clipper/clipper.constants";
import type {
  ISocialPost,
  ISocialPostBase
} from "@nucleum/extensions/clipper/clipper.type";
import {
  findAncestorOrSelf,
  resolveParentNLevel
} from "@nucleum/extensions/clipper/parsers/shared/domUtils";

export function extractFacebookPostFromPage():
  | ISocialPost<IFacebookPost, IFacebookProfile>
  | undefined {
  const csui = document.querySelector(
    `${csuiSelector}#memotron-clipper-facebook-root`
  );
  if (!csui) return;
  const postContainer = resolveParentNLevel(4, csui);
  if (postContainer) {
    return parseFacebookPost(postContainer as Element);
  }
}

export function extractFacebookPostFromInlineClip(
  element: Element
): ISocialPost<IFacebookPost, IFacebookProfile> | undefined {
  let postContainer =
    findAncestorOrSelf(element, '[role="article"]') ||
    findAncestorOrSelf(element, 'div[data-pagelet*="FeedUnit"]');
  if (!postContainer) {
    const csui = findAncestorOrSelf(element, csuiSelector);
    postContainer = resolveParentNLevel(4, csui);
  }
  const isPostPage =
    window.location.pathname.includes("/posts/") ||
    window.location.pathname.includes("/photo.php") ||
    window.location.pathname.includes("/permalink.php");
  const data = parseFacebookPost(postContainer);
  if (!data) return;
  return { ...data, isPostPage };
}

function parseFacebookPost(
  root: Element
): ISocialPostBase<IFacebookPost, IFacebookProfile> | undefined {
  let text = "";
  let textElement = root.querySelector(
    '[data-ad-rendering-role="story_message"]'
  );
  if (!textElement) root.querySelector('[data-testid="post_message"]');
  text = textElement?.textContent?.trim() ?? "";

  let authorName = "";
  let authorHandle = "";
  let profileImageUrl = "";

  const authorElements = [
    root.querySelector('strong[data-ad-rendering-role="profile_name"]'),
    root.querySelector('a[data-testid="event_title_link"] strong'),
    root.querySelector("h3 a"),
    root.querySelector("h4 a"),
    root.querySelector('[data-testid="story-subtitle"] a'),
    root.querySelector('span[data-testid="event_title_link"] strong')
  ];

  for (const authorEl of authorElements) {
    if (authorEl?.textContent?.trim()) {
      authorName = authorEl.textContent.trim();
      const authorLink = authorEl.closest("a");
      if (authorLink?.href) {
        const profileMatch = authorLink.href.match(/facebook\.com\/([^/?]+)/);
        if (
          profileMatch &&
          profileMatch[1] !== "photo.php" &&
          profileMatch[1] !== "permalink.php"
        ) {
          authorHandle = profileMatch[1];
        }
      }
      break;
    }
  }

  const profileImageEl = root.querySelector(
    'img[data-testid*="profile"], img[alt*="profile"]'
  ) as HTMLImageElement;
  if (profileImageEl?.src) {
    profileImageUrl = profileImageEl.src;
  }

  const timeElements = root.querySelectorAll(
    'time, [data-testid="story-subtitle"] span'
  );
  let postedAtStr = "";
  for (const timeEl of timeElements) {
    const datetime = timeEl.getAttribute("datetime");
    if (datetime) {
      postedAtStr = datetime;
      break;
    }
    const timeText = timeEl.textContent?.trim();
    if (
      timeText &&
      (timeText.includes("h") ||
        timeText.includes("min") ||
        timeText.includes("d"))
    ) {
      postedAtStr = timeText;
      break;
    }
  }

  let reactions = "";
  let likes = "";
  let shares = "";
  let comments = "";

  const reactionElements = root.querySelectorAll(
    '[aria-label*="reaction"], [aria-label*="people"], [data-testid*="reaction"]'
  );
  reactionElements.forEach((el) => {
    const ariaLabel = el.getAttribute("aria-label") || "";
    const text = el.textContent?.trim() || "";

    if (
      ariaLabel.toLowerCase().includes("like") ||
      text.toLowerCase().includes("like")
    ) {
      const match = text.match(/(\d+(?:,\d+)*(?:\.\d+)?[KM]?)/g);
      if (match) likes = match[0];
    }
    if (
      ariaLabel.toLowerCase().includes("comment") ||
      text.toLowerCase().includes("comment")
    ) {
      const match = text.match(/(\d+(?:,\d+)*(?:\.\d+)?[KM]?)/g);
      if (match) comments = match[0];
    }
    if (
      ariaLabel.toLowerCase().includes("share") ||
      text.toLowerCase().includes("share")
    ) {
      const match = text.match(/(\d+(?:,\d+)*(?:\.\d+)?[KM]?)/g);
      if (match) shares = match[0];
    }
  });

  const allReactionsEl = root.querySelector('[aria-label*="All reactions:"]');
  if (allReactionsEl?.textContent) {
    const match = allReactionsEl.textContent.match(
      /(\d+(?:,\d+)*(?:\.\d+)?[KM]?)/g
    );
    if (match) reactions = match[0];
  }

  const urlFilter = createUrlFilter(
    ["facebook.com", "instagram.com"],
    [],
    window.location.href
  );
  const links = Array.from(root.querySelectorAll('a[href^="http"]'))
    .map((a: any) => a.href)
    .filter(urlFilter);

  const media: string[] = [];
  const imageElements = root.querySelectorAll(
    'img:not([alt*="profile"]):not([data-testid*="profile"])'
  );
  imageElements.forEach((img) => {
    const imgElement = img as HTMLImageElement;
    if (
      imgElement.src &&
      isHostnameMatch(imgElement.src, "fbcdn.net") &&
      !imgElement.src.includes("profile")
    ) {
      media.push(imgElement.src);
    }
  });

  const videoElements = root.querySelectorAll("video");
  videoElements.forEach((video) => {
    if (video.src && !video.src.startsWith("blob:")) {
      media.push(video.src);
    }
  });

  let postId = "";
  let postUrl = "";
  const currentUrl = window.location.href;
  if (currentUrl.includes("/posts/")) {
    const postIdMatch = currentUrl.match(/\/posts\/([^/?]+)/);
    if (postIdMatch) postId = postIdMatch[1];
    postUrl = currentUrl.split("?")[0];
  } else if (currentUrl.includes("story_fbid=")) {
    const storyIdMatch = currentUrl.match(/story_fbid=([^&]+)/);
    if (storyIdMatch) postId = storyIdMatch[1];
  } else if (currentUrl.includes("fbid=")) {
    const fbidMatch = currentUrl.match(/fbid=([^&]+)/);
    if (fbidMatch) postId = fbidMatch[1];
  }

  const authorUrl = authorHandle
    ? `https://www.facebook.com/${authorHandle}`
    : "";
  const username = authorHandle || "unknown";

  const data: OmitForCapture<IFacebookPost> = {
    contentType: NodeType.FACEBOOK_POST,
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
      username,
      postedAt: postedAtStr,
      media,
      externalLinks: links,
      likes,
      reactions,
      shares,
      comments
    },
    url: postUrl
  };

  const parent: OmitForCapture<IFacebookProfile> = {
    contentType: NodeType.FACEBOOK_PROFILE,
    label: authorName || username,
    text: `${authorName || username} on Facebook`,
    body: {
      username,
      bio: "",
      profileImageUrl
    },
    url: authorUrl
  };

  return {
    data,
    parent
  };
}

export function extractFacebookProfile(): OmitForCapture<IFacebookProfile> {
  const url = window.location.href;
  let username = "";
  let name = "";
  const saveButton = document.querySelector(
    `${csuiSelector}#memotron-clipper-facebookprofile-root`
  ) as Element;
  const root = resolveParentNLevel(6, saveButton);
  const header = root?.querySelector("h1");

  if (url.includes("profile.php?id=")) {
    const idMatch = url.match(/profile\.php\?id=(\d+)/);
    if (idMatch) username = idMatch[1];
  } else {
    const usernameMatch = url.match(/facebook\.com\/([^/?]+)/);
    if (usernameMatch) username = usernameMatch[1];
  }
  name = header?.textContent?.trim() ?? "";

  const bioElements = [
    document.querySelector('[data-testid="profile_bio"]'),
    document.querySelector(".profileIntroCard"),
    document.querySelector("#intro_container_id")
  ];

  let bio = "";
  for (const bioEl of bioElements) {
    if (bioEl?.textContent?.trim()) {
      const bioText = bioEl.textContent.trim();
      if (bioText.length > bio.length && bioText.length > 10) {
        bio = bioText;
      }
    }
  }

  const profileImageElements = [
    document.querySelector('image[data-testid="profile_photo"]'),
    document.querySelector('img[data-testid="profile_photo"]'),
    document.querySelector('img[alt*="profile picture"]')
  ] as HTMLImageElement[];

  let profileImageUrl = "";
  for (const imgEl of profileImageElements) {
    if (imgEl?.src) {
      profileImageUrl = imgEl.src;
      break;
    }
  }

  const text = `${name}\n${bio}`.trim();

  return {
    url,
    label: name || username,
    text,
    body: {
      username,
      bio,
      profileImageUrl
    },
    metadata: {
      displayName: name
    },
    contentType: NodeType.FACEBOOK_PROFILE
  };
}
