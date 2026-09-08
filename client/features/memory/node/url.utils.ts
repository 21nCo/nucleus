import { NodeType } from "@nucleum/schema/legacy/node-type.enum";
import { sanitize } from "@21n/shared-utils/utils";
import { isValidUrl } from "@21n/shared-utils/utils";

export const contentTypeMap: {
  contentType:
    | NodeType.TWEET
    | NodeType.LINKEDIN_POST
    | NodeType.LINKEDIN_PROFILE
    | NodeType.REDDIT_POST
    | NodeType.REDDIT_PROFILE
    | NodeType.BLUESKY_POST
    | NodeType.BLUESKY_PROFILE
    | NodeType.THREADS_POST
    | NodeType.THREADS_PROFILE
    | NodeType.INSTAGRAM_POST
    | NodeType.INSTAGRAM_REEL
    | NodeType.INSTAGRAM_PROFILE
    | NodeType.FACEBOOK_POST
    | NodeType.FACEBOOK_PROFILE
    | NodeType.MASTODON_POST
    | NodeType.MASTODON_PROFILE
    | NodeType.TWITTER_PROFILE
    | NodeType.YOUTUBE_VIDEO
    | NodeType.YOUTUBE_SHORT
    | NodeType.YOUTUBE_CHANNEL
    | NodeType.GIST
    | NodeType.REDDIT_SUB;
  regex: RegExp[];
  currentDomain?: string;
}[] = [
  {
    contentType: NodeType.TWEET,
    regex: [
      /^https:\/\/(?:www\.)?(twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/status\/(\d+)(?:\/)?(?:\?.*)?$/
    ],
    currentDomain: "x.com"
  },
  {
    contentType: NodeType.TWITTER_PROFILE,
    regex: [/^https:\/\/(?:www\.)?(twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/?$/]
  },
  {
    contentType: NodeType.YOUTUBE_VIDEO,
    regex: [
      /^https:\/\/(?:www\.)?(youtube\.com)\/watch\?v=([a-zA-Z0-9_-]+)/,
      /^https:\/\/youtu\.be\/([a-zA-Z0-9_-]+)(\?.*)?$/,
      /^https:\/\/(?:www\.)?(youtube\.com)\/embed\/([a-zA-Z0-9_-]+)/
    ]
  },
  {
    contentType: NodeType.YOUTUBE_SHORT,
    regex: [
      /^https:\/\/(?:www\.|m\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]+)(?:\?.*)?$/
    ]
  },
  {
    contentType: NodeType.YOUTUBE_CHANNEL,
    regex: [
      /^https:\/\/(?:www\.)?(youtube\.com)\/channel\/([a-zA-Z0-9_-]+)/,
      /^https:\/\/(?:www\.)?(youtube\.com)\/@([a-zA-Z0-9_-]+)/
    ]
  },
  {
    contentType: NodeType.GIST,
    regex: [
      /^https:\/\/gist\.github\.com\/([a-zA-Z0-9-]+)\/([a-f0-9]+)$/,
      /^https:\/\/gist\.github\.com\/([a-f0-9]+)$/,
      /^https:\/\/gitlab\.com\/-\/snippets\/(\d+)$/,
      /^https:\/\/gitlab\.com\/([^/]+)\/([^/]+)\/-\/snippets\/(\d+)$/
    ]
  },
  {
    contentType: NodeType.LINKEDIN_POST,
    regex: [
      /^https:\/\/(?:www\.)?linkedin\.com\/feed\/update\/urn:li:activity:\d+\/?$/,
      /^https:\/\/(?:www\.)?linkedin\.com\/posts\/activity-\d+(-[a-zA-Z0-9]+)?\/?$/
    ]
  },
  {
    contentType: NodeType.LINKEDIN_PROFILE,
    regex: [/^https:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/]
  },
  {
    contentType: NodeType.BLUESKY_POST,
    regex: [/^https:\/\/bsky\.app\/profile\/[^/]+\/post\/[A-Za-z0-9]+\/?$/]
  },
  {
    contentType: NodeType.BLUESKY_PROFILE,
    regex: [/^https:\/\/bsky\.app\/profile\/[^/]+\/?$/]
  },
  {
    contentType: NodeType.THREADS_POST,
    regex: [/^https:\/\/(?:www\.)?threads\.com\/@[^/]+\/post\/[A-Za-z0-9]+\/?$/]
  },
  {
    contentType: NodeType.THREADS_PROFILE,
    regex: [/^https:\/\/(?:www\.)?threads\.com\/@[^/]+\/?$/]
  },
  {
    contentType: NodeType.INSTAGRAM_POST,
    regex: [
      /^https:\/\/(?:www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+\/?(?:\?.*)?$/
    ]
  },
  {
    contentType: NodeType.INSTAGRAM_REEL,
    regex: [
      /^https:\/\/(?:www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+\/?(?:\?.*)?$/
    ]
  },
  {
    contentType: NodeType.INSTAGRAM_PROFILE,
    regex: [/^https:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/]
  },
  {
    contentType: NodeType.FACEBOOK_POST,
    regex: [
      /^https:\/\/(?:www\.)?facebook\.com\/[^/]+\/posts\/[^/]+\/?.*$/,
      /^https:\/\/(?:www\.)?facebook\.com\/permalink\.php\?story_fbid=[^\s&]+.*$/,
      /^https:\/\/(?:www\.)?facebook\.com\/photo\.php\?fbid=[^\s&]+.*$/
    ]
  },
  {
    contentType: NodeType.FACEBOOK_PROFILE,
    regex: [
      /^https:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9_.]+\/?(?:\?.*)?$/,
      /^https:\/\/(?:www\.)?facebook\.com\/profile\.php\?id=\d+.*$/
    ]
  },
  {
    contentType: NodeType.MASTODON_POST,
    regex: [
      /^https:\/\/[^/]+\/@[^/]+\/[0-9]+\/?$/,
      /^https:\/\/[^/]+\/users\/[^/]+\/statuses\/[0-9]+\/?$/,
      /^https:\/\/[^/]+\/web\/statuses\/[0-9]+\/?$/
    ]
  },
  {
    contentType: NodeType.MASTODON_PROFILE,
    regex: [
      /^https:\/\/[^/]+\/@[^/]+\/?$/,
      /^https:\/\/[^/]+\/users\/[^/]+\/?$/
    ]
  },
  {
    contentType: NodeType.REDDIT_POST,
    regex: [
      /^https:\/\/(?:www\.)?reddit\.com\/r\/[^/]+\/comments\/[a-zA-Z0-9]+\/?.*$/,
      /^https:\/\/(?:www\.)?reddit\.com\/r\/[^/]+\/comments\/[a-zA-Z0-9]+\/[^/]+\/?.*$/
    ]
  },
  {
    contentType: NodeType.REDDIT_PROFILE,
    regex: [
      /^https:\/\/(?:www\.)?reddit\.com\/user\/[a-zA-Z0-9_-]+\/?.*$/,
      /^https:\/\/(?:www\.)?reddit\.com\/u\/[a-zA-Z0-9_-]+\/?.*$/
    ]
  },
  {
    contentType: NodeType.REDDIT_SUB,
    regex: [/^https:\/\/(?:www\.)?reddit\.com\/r\/[a-zA-Z0-9_-]+\/?.*$/]
  }
];

//TODO - metadata for all these pages
const urlMap = [
  {
    domain: "x.com",
    faviconUrl:
      "https://abs.twimg.com/responsive-web/client-web/icon-ios.77d25eba.png",
    ogImage:
      "https://abs.twimg.com/responsive-web/client-web/icon-ios.77d25eba.png",
    isIframeable: false
  },
  {
    domain: /^https:\/\/(?:www\.)?tldraw\.com\/f\/[a-zA-Z0-9_-]+(?:\?.*)?$/,
    faviconUrl: "https://www.tldraw.com/favicon.ico",
    isIframeable: true
  },
  {
    domain:
      /^https:\/\/(?:www\.)?excalidraw\.com(?:\/(?:[a-zA-Z0-9_-]+)?)?(?:\?.*)?$/,
    faviconUrl: "https://excalidraw.com/favicon.ico",
    isIframeable: true
  },
  {
    domain:
      /^https:\/\/(?:www\.)?miro\.com\/app\/board\/[a-zA-Z0-9_=-]+(?:\/.*)?(?:\?.*)?$/,
    faviconUrl: "https://miro.com/favicon.ico",
    isIframeable: true
  },
  {
    domain:
      /^https:\/\/(?:www\.)?whimsical\.com\/embed\/[a-zA-Z0-9_-]+(?:\?.*)?$/,
    faviconUrl: "https://whimsical.com/favicon.ico",
    isIframeable: true
  },
  {
    domain: /^https:\/\/(?:www\.)?draw\.io\/(?:\?.*)?$/,
    faviconUrl: "https://app.diagrams.net/favicon.ico",
    isIframeable: true
  },
  {
    domain: /^https:\/\/(?:viewer|embed)\.diagrams\.net\/.*$/,
    faviconUrl: "https://app.diagrams.net/favicon.ico",
    isIframeable: true
  },
  {
    domain:
      /^https:\/\/lucid\.app\/documents\/embedded\/[a-zA-Z0-9_-]+(?:\?.*)?$/,
    faviconUrl: "https://lucid.app/favicon.ico",
    isIframeable: true
  },
  {
    domain:
      /^https?:\/\/(?:www\.)?canva\.com\/design\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/view\?embed(?:=true)?(?:&.*)?$/,
    isIframeable: true
  },
  {
    domain:
      /^https?:\/\/(?:www\.)?canva\.com\/design\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/view(?:\?.*)?$/,
    customMessage:
      "Preview not available for this Canva URL. Please use the embed URL instead.",
    convertToEmbedUrl: (url: string) => {
      const urlObj = new URL(url);
      if (!urlObj.searchParams.has("embed")) {
        urlObj.searchParams.set("embed", "true");
      }
      return urlObj.toString();
    }
  },
  {
    domain: /^https:\/\/(?:[\w-]+\.)?wikipedia\.org\/.+$/,
    faviconUrl: "https://en.wikipedia.org/static/apple-touch/wikipedia.png",
    isIframeable: true
  },
  {
    domain: "youtube.com",
    faviconUrl:
      "https://www.youtube.com/s/desktop/4610dd25/img/favicon_144x144.png",
    ogImage: "https://www.youtube.com/img/desktop/yt_1200.png"
  },
  {
    domain: "medium.com",
    isIframeable: false
  },
  {
    domain: /^https:\/\/(?:[\w-]+\.)?typeform\.(?:com|io)(?:\/.*)?$/,
    isIframeable: true
  },
  {
    domain: "memotron.io",
    isIframeable: true
  },
  {
    domain: /^https?:\/\/(?:gist\.|)github\.com/,
    faviconUrl: "https://github.githubassets.com/favicons/favicon.svg",
    isIframeable: false
  },
  {
    domain: /^https?:\/\/maps\.app\.goo\.gl\/.+$/,
    customMessage:
      "Preview not available for this Google Maps URL. Please use the embed URL instead."
  },
  {
    domain:
      /^https?:\/\/(?:www\.)?(?:docs\.google\.com\/(?:document|spreadsheets|presentation)\/d\/[a-zA-Z0-9_-]+(?:\/.*)?|(?:maps)?\.?google\.com(?:\/maps)?(?:\/embed\/?(?:\?[^]*)?)?$)/,
    isIframeable: true
  },
  {
    domain:
      /^https?:\/\/(?:www\.|)?figma\.com\/(?:design|files|board|slides)\/[^/]+(?:\/.*)?$/,
    customMessage:
      "Preview not available for this Figma URL. Please use the embed URL instead.",
    convertToEmbedUrl: (url: string) => {
      const embedUrl = url.replace(
        /^https?:\/\/(?:www\.|)?figma\.com/,
        "https://embed.figma.com"
      );
      const separator = embedUrl.includes("?") ? "&" : "?";
      return `${embedUrl}${separator}embed-host=21n`;
    }
  },
  {
    domain: /^https?:\/\/embed\.figma\.com(?:\/[^?]*)?(?:\?.*)?$/,
    isIframeable: true
  },
  {
    domain: /^https?:\/\/replit\.com\/@[\w-]+\/[\w-]+(?:[?#].*)?$/,
    isIframeable: true,
    convertToEmbedUrl: (url: string) => {
      const urlObj = new URL(url);
      if (!urlObj.searchParams.has("embed")) {
        urlObj.searchParams.set("embed", "true");
      }
      return urlObj.toString();
    }
  }
];

export function resolveUrlData(url: string) {
  const item = urlMap.find((x) =>
    x.domain instanceof RegExp
      ? x.domain.test(url)
      : x.domain === url || url.includes("." + x.domain)
  );
  return item;
}

export function resolveWebpageLabel(url: string) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    return `${parsed.hostname}${path}`.replace(/^www\./, "") || url;
  } catch {
    return url.split("://").pop() ?? url;
  }
}

export function sanitizeAndResolve(
  text: string
): { contentType: NodeType; url: string; isEmbed?: boolean } | string {
  const sanitized = sanitize(text);
  if (typeof sanitized !== "object" && !isValidUrl(sanitized)) {
    return sanitized;
  }
  let url = typeof sanitized === "string" ? sanitized : sanitized.embed;
  let isEmbed = typeof sanitized === "object" && sanitized.embed !== undefined;

  if (typeof sanitized === "object" && sanitized.isGist) {
    return {
      contentType: NodeType.GIST,
      url: sanitized.embed,
      isEmbed: true
    };
  }
  const contentTypeFromMap = contentTypeMap.find((item) =>
    item.regex.some((regex) => regex.test(url.trim()))
  );
  if (contentTypeFromMap) {
    return {
      contentType: contentTypeFromMap.contentType,
      url,
      isEmbed
    };
  }
  return {
    contentType: NodeType.WEB_PAGE,
    url,
    isEmbed
  };
}

export async function fetchYouTubeMetadata(url: string): Promise<{
  title: string;
  author_name: string;
  author_url: string;
  thumbnail_url: string;
} | null> {
  try {
    // const normalizedUrl = url.replace(
    //   /(youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)/,
    //   "youtube.com/watch?v="
    // );
    // const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(normalizedUrl)}&format=json`;
    const oEmbedUrl = `https://www.youtube.com/oembed?url=${url}&format=json`;
    const response = await fetch(oEmbedUrl);
    if (!response.ok) return null;
    const data = await response.json();
    return data || null;
  } catch (error) {
    console.error("Error fetching YouTube title:", error);
    return null;
  }
}

export function isSameAsCurrentUrl(
  url: string,
  compareParams: boolean = false,
  compareHash: boolean = false
): boolean {
  if (typeof window === "undefined" || !window.location) {
    return false;
  }
  try {
    const providedUrl = new URL(url, window.location.origin);
    const currentUrl = new URL(window.location.href);
    if (
      providedUrl.protocol !== currentUrl.protocol ||
      providedUrl.hostname !== currentUrl.hostname ||
      providedUrl.port !== currentUrl.port ||
      providedUrl.pathname !== currentUrl.pathname
    ) {
      return false;
    }

    if (compareParams && providedUrl.search !== currentUrl.search) {
      return false;
    }

    if (compareHash && providedUrl.hash !== currentUrl.hash) {
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Error comparing URLs:", error);
    return false;
  }
}

/**
 * Safely checks if a URL string has a valid HTTP/HTTPS protocol
 * @param url - URL string to check
 * @returns boolean indicating if URL is valid and uses HTTP/HTTPS
 */
function isValidHttpUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "https:" || urlObj.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Safely checks if a URL belongs to a specific hostname or its subdomains
 * @param url - URL string to check
 * @param hostname - hostname to check against (e.g., "example.com")
 * @returns boolean indicating if URL belongs to hostname or its subdomains
 */
export function isHostnameMatch(url: string, hostname: string): boolean {
  try {
    const urlObj = new URL(url);
    const urlHost = urlObj.hostname.toLowerCase();
    const targetHost = hostname.toLowerCase();
    return urlHost === targetHost || urlHost.endsWith("." + targetHost);
  } catch {
    return false;
  }
}

/**
 * Safely checks if a URL belongs to any of the specified hostnames or their subdomains
 * @param url - URL string to check
 * @param hostnames - array of hostnames to check against
 * @returns boolean indicating if URL belongs to any of the hostnames
 */
export function isAnyHostnameMatch(url: string, hostnames: string[]): boolean {
  return hostnames.some((hostname) => isHostnameMatch(url, hostname));
}

/**
 * Filter function for excluding URLs from specific platforms/domains
 * Commonly used in social media parsers to filter out internal links
 * @param excludeHostnames - array of hostnames to exclude
 * @param excludePatterns - array of path patterns to exclude (checked with includes())
 * @param currentUrl - current page URL to exclude (optional)
 * @returns filter function that can be used with Array.filter()
 */
export function createUrlFilter(
  excludeHostnames: string[] = [],
  excludePatterns: string[] = [],
  currentUrl?: string
) {
  return (url: string): boolean => {
    if (!isValidHttpUrl(url)) {
      return false;
    }

    if (currentUrl && url === currentUrl) {
      return false;
    }

    if (
      excludeHostnames.length > 0 &&
      isAnyHostnameMatch(url, excludeHostnames)
    ) {
      return false;
    }

    if (excludePatterns.some((pattern) => url.includes(pattern))) {
      return false;
    }

    return true;
  };
}
