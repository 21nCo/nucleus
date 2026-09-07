import type { OmitForCapture } from "@nucleum/datafn/resource.type";
import {
  NodeType,
  type ILinkedInPost,
  type ILinkedInProfile
} from "@nucleum/features/memory/node/node.type";
import { parseRelativeTimeToISO } from "@21n/utils/time.utils";
import type { ISocialPost } from "@nucleum/extensions/clipper/clipper.type";
import {
  findAncestorOrSelf,
  resolveOgData
} from "@nucleum/extensions/clipper/parsers/shared/domUtils";

export function extractLinkedInPostFromPage():
  | ISocialPost<ILinkedInPost, ILinkedInProfile>
  | undefined {
  const root = document.querySelector("[data-urn]");
  if (!root) return;
  return parseLinkedInPost(root);
}

export function extractLinkedInPostFromInlineClip(
  element: Element
): ISocialPost<ILinkedInPost, ILinkedInProfile> | undefined {
  let root = findAncestorOrSelf(element, "[data-id]");
  if (!root) root = findAncestorOrSelf(element, "[data-urn]");
  if (!root) return;
  return parseLinkedInPost(root);
}

function parseLinkedInPost(
  root: Element
): ISocialPost<ILinkedInPost, ILinkedInProfile> {
  const textEl = root.querySelector(
    ".update-components-text.update-components-update-v2__commentary, .update-components-text"
  ) as HTMLElement;
  let text = textEl?.textContent?.trim() ?? "";
  if (!text) {
    const fallbackTextEl = root.querySelector(
      ".feed-shared-inline-show-more-text .break-words, .attributed-text-segment-list__content"
    );
    text = fallbackTextEl?.textContent?.trim() ?? "";
  }

  // Extract time from sub-description (contains "1d •" etc.)
  const timeEl = root.querySelector(
    ".update-components-actor__sub-description"
  );
  const timeText = timeEl?.textContent?.trim();

  const authorLink = root.querySelector(
    ".update-components-actor__meta-link"
  ) as HTMLAnchorElement;

  const avatarImg = root.querySelector(
    ".update-components-actor__avatar-image"
  ) as HTMLImageElement;

  const links = Array.from(root.querySelectorAll('a[href^="http"]'))
    .map((a: any) => a.href)
    .filter(
      (href: string) =>
        !href.includes("linkedin.com/in/") &&
        !href.includes("linkedin.com/company/") &&
        !href.includes("linkedin.com/feed/") &&
        !href.includes("linkedin.com/posts/") &&
        !href.includes("linkedin.com/search/") &&
        !href.includes("linkedin.com/showcase/") &&
        !href.includes("miniProfileUrn=")
    );

  let authorHandle =
    authorLink?.href?.match(/linkedin\.com\/in\/([^?]+)/)?.[1] ??
    authorLink?.href?.match(/linkedin\.com\/company\/([^?]+)/)?.[1];

  authorHandle = authorHandle?.split("/posts")[0] ?? authorHandle;

  const authorNameEl = root
    .querySelector(".update-components-actor__title")
    ?.querySelector("span.visually-hidden");
  const authorName = authorNameEl?.textContent?.trim() ?? "";

  const authorUrl = authorLink?.href?.split("?")[0] ?? undefined;
  const jobTitleEl = root.querySelector(
    ".update-components-actor__description"
  );
  const jobTitle =
    jobTitleEl?.textContent && !jobTitleEl.textContent.includes("followers")
      ? jobTitleEl?.textContent?.trim()
      : undefined;

  const postUrn = root.getAttribute("data-id") ?? root.getAttribute("data-urn");
  const postId = postUrn?.match(/activity:(\d+)/)?.[1];
  const postUrl = postId
    ? `https://www.linkedin.com/feed/update/${postUrn}/`
    : window.location.href;

  const rel = timeText?.match(/(\d+\s*[smhdw]|\d+\s*mo|\d+\s*y)/i)?.[1];
  const postedAtStr = rel ? parseRelativeTimeToISO(rel) : undefined;
  let postedAt = 0;
  if (postedAtStr && !isNaN(new Date(postedAtStr).getTime())) {
    postedAt = new Date(postedAtStr).getTime();
  }
  const username = authorHandle ?? "unknown";
  const data: OmitForCapture<ILinkedInPost> = {
    text,
    label: "",
    contentType: NodeType.LINKEDIN_POST,
    body: {
      postedAt
    },
    metadata: {
      postId: postId ?? "unknown",
      username,
      links,
      headline: jobTitle,
      postedAt: postedAtStr ?? ""
    },
    url: postUrl
  };
  const parent: OmitForCapture<ILinkedInProfile> = {
    contentType: NodeType.LINKEDIN_PROFILE,
    label: authorName,
    text: `${authorName} - ${authorHandle} on LinkedIn`,
    body: {
      username,
      profileImageUrl: avatarImg?.src ?? undefined
    },
    metadata: {
      headline: jobTitle
    },
    url: authorUrl
  };
  return {
    data,
    parent
  };
}

/**
 * This function is triggered from LinkedIn profile page.
 * @returns
 */
export function extractLinkedInProfile(): OmitForCapture<ILinkedInProfile> {
  const url = window.location.href;
  const username = url.split("/in/")[1]?.split("/")[0] || "";

  const nameElement = document.querySelector("h1");
  const name = nameElement?.textContent?.trim() || "";

  let profileImageElement = document.querySelector(
    'img[data-anonymize="headshot"]'
  ) as HTMLImageElement;
  if (!profileImageElement) {
    profileImageElement = document.querySelector(
      "img.pv-top-card-profile-picture__image--show"
    ) as HTMLImageElement;
  }
  const profileImageUrl = profileImageElement?.src || "";

  let headlineElement = document.querySelector(
    '[data-generated-suggestion-target*="headline"]'
  );
  if (!headlineElement) {
    const titleElement =
      document.querySelector(".distance-badge")?.parentElement;
    headlineElement = titleElement?.nextElementSibling as HTMLElement;
  }
  const headline = headlineElement?.textContent?.trim() || "";

  const currentCompanyElement = document.querySelector(
    '[aria-label^="Current company"]'
  );
  const currentCompany = currentCompanyElement?.textContent?.trim() || "";

  const educationElement = document.querySelector('[aria-label^="Education"]');
  const education = educationElement?.textContent?.trim() || "";

  const locationElement = document.querySelector(
    ".text-body-small.inline.t-black--light.break-words"
  );
  const location = locationElement?.textContent?.trim() || "";

  const aboutHeading = Array.from(document.querySelectorAll("h2")).find(
    (h2) => h2.textContent?.trim() === "AboutAbout"
  );
  const aboutSection = aboutHeading?.closest("section");
  const bio =
    Array.from(aboutSection?.querySelectorAll(".visually-hidden") || [])
      .map((p) => p.textContent?.trim())
      .join("\n") || "";

  const memberIdMatch = url.match(/\/in\/([^/?]+)/);
  const memberId = memberIdMatch ? memberIdMatch[1] : username;

  const text = `${name}\n${headline}\n${bio}`.trim();
  const { ogTitle } = resolveOgData();

  return {
    url,
    label: name,
    text,
    body: {
      username: memberId,
      bio,
      profileImageUrl
    },
    metadata: {
      ogTitle,
      headline,
      currentCompany,
      education,
      location,
      publicProfileUrl: url
    },
    contentType: NodeType.LINKEDIN_PROFILE
  };
}
