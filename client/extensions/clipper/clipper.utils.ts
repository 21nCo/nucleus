import { logger } from "@nucleum/components/debug/logger.client";
import type { OmitForCapture } from "@nucleum/datafn/resource.type";
import { NodeType, type INode } from "@nucleum/features/memory/node/node.type";
import {
  contentTypeMap,
  fetchYouTubeMetadata
} from "@nucleum/features/memory/node/url.utils";
import {
  generateHash,
  generateSHA256Hash
} from "@21n/shared-utils/crypto.utils";
import { enumToString } from "@21n/shared-utils/text.utils";
import { extractBrowserDetails } from "@nucleum/extensions/clipper/parsers/shared/domUtils";

export function isYoutubeVideoUrl(url: string) {
  const regex = /^https?:\/\/(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/;
  return regex.test(url);
}

export function extractVideoId(url: string) {
  const match = url.match(
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/
  );
  return match ? match[2] : null;
}

/**
 * @deprecated - using anchor and svelte component instead
 * @param controlElement
 * @returns
 */
export function createClipButton(controlElement: HTMLElement) {
  const clipButton = document.createElement("button");
  clipButton.className = "ytclip";
  clipButton.innerHTML = `
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                           <path d="M15.8103 5.45252L20.6058 5.00266C20.9096 4.97418 21.0723 5.17793 20.9688 5.45836C20.9688 5.45836 13.6738 17.2629 13.076 18.1115C12.4782 18.9602 11.9535 19.5909 10.8974 18.1115C9.84133 16.6322 3.03079 5.45836 3.03079 5.45836C2.92804 5.17793 3.09079 4.97418 3.39455 5.00266L8.19013 5.45252C8.49388 5.481 8.82314 5.73222 8.92364 6.01265C8.92364 6.01265 11.5 10.9796 12.0133 10.9796C12.5266 10.9796 15.0767 6.01338 15.0767 6.01338C15.1772 5.73222 15.5057 5.481 15.8103 5.45252Z" fill="white"/>
                          </svg>
                          `;

  const controlHeight = controlElement.offsetHeight;
  clipButton.style.padding = "0";
  clipButton.style.border = "1px solid #0056b3";
  clipButton.style.background = "#007bff";
  clipButton.style.height = "${controlHeight}px";
  clipButton.style.width = "${controlHeight}px";
  clipButton.style.borderRadius = "4px";
  clipButton.style.display = "flex";
  clipButton.style.alignItems = "center";
  clipButton.style.justifyContent = "center";

  clipButton.addEventListener("mousedown", () => {
    clipButton.style.transform = "scale(0.95)";
  });
  clipButton.addEventListener("mouseup", () => {
    clipButton.style.transform = "scale(1)";
  });
  clipButton.addEventListener("mouseout", () => {
    clipButton.style.transform = "scale(1)";
  });

  return clipButton;
}

export function createClipPointer() {
  const pointer = document.createElement("div");
  pointer.className = "memotron-clip-pointer";

  pointer.innerHTML = `
                       <svg width="16" height="19" viewBox="0 0 16 19" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0.6 0H15.4C15.7314 0 16 0.26863 16 0.600001V13.1844C16 13.382 15.9027 13.5669 15.7399 13.6788L8.33992 18.7663C8.13517 18.9071 7.86483 18.9071 7.66008 18.7663L0.260083 13.6788C0.0972701 13.5669 0 13.382 0 13.1844V0.6C0 0.268629 0.26863 0 0.6 0Z" fill="#2c70dd"/>
          <path d="M0.6 0H15.4C15.7314 0 16 0.26863 16 0.600001V13.1844C16 13.382 15.9027 13.5669 15.7399 13.6788L8.33992 18.7663C8.13517 18.9071 7.86483 18.9071 7.66008 18.7663L0.260083 13.6788C0.0972701 13.5669 0 13.382 0 13.1844V0.6C0 0.268629 0.26863 0 0.6 0Z" fill="none" stroke="white" stroke-width="0" />
</svg>

                           `;
  pointer.style.backgroundSize = "contain";
  pointer.style.backgroundRepeat = "no-repeat";
  pointer.style.width = "20px";
  pointer.style.height = "20px";
  pointer.style.cursor = "pointer";
  pointer.style.position = "absolute";
  pointer.style.zIndex = "10000";
  pointer.style.bottom = "70px";

  const path = pointer.querySelector("path");
  const strokePath = pointer.querySelectorAll("path")[1];
  if (
    !(path instanceof SVGPathElement) ||
    !(strokePath instanceof SVGPathElement)
  )
    return pointer;
  path.style.transition = "fill-opacity 0.2s";
  path.style.fillOpacity = "0.6";
  path.style.border = "1px solid transparent";
  strokePath.style.transition = "stroke-width 0.2s";

  pointer.addEventListener("mouseenter", () => {
    path.style.fillOpacity = "1";
    pointer.style.bottom = "72px";
    strokePath.style.strokeWidth = "2";
  });

  pointer.addEventListener("mouseleave", () => {
    path.style.fillOpacity = "0.6";
    pointer.style.bottom = "70px";
    path.style.border = "1px solid transparent";
    strokePath.style.strokeWidth = "0";
  });

  return pointer;
}

/**
 * Extracts full tab data from the current tab.
 * Note: This function should be called only from the content script.
 * @returns TabData
 */
export async function extractFullTabData(
  doc?: Document,
  params?: {
    url?: string;
    docText?: string;
  }
): Promise<OmitForCapture<INode>> {
  doc = doc ?? document;
  const title = doc.title;
  const faviconLink = (
    doc.querySelector("link[rel*='icon']") as HTMLLinkElement
  )?.href;
  const appIconLinks = Array.from(
    doc.querySelectorAll("link[rel='apple-touch-icon']"),
    (link) => (link as HTMLLinkElement).href
  );
  const description = (
    doc.querySelector("meta[name='description']") as HTMLMetaElement
  )?.content;
  const keywords = (
    doc.querySelector("meta[name='keywords']") as HTMLMetaElement
  )?.content;
  const twitterCard = (
    doc.querySelector("meta[name='twitter:card']") as HTMLMetaElement
  )?.content;
  const { ogTitle, ogImage, ogDescription, ogUrl } = resolveOgData(doc);
  const browser = extractBrowserDetails();
  const hash = await generateSHA256Hash(doc.body?.innerHTML ?? params?.docText);
  const url = params?.url ? resolveUrl(params.url) : resolveUrl();
  const contentType = resolveContentTypeForUrl(url);
  return {
    label: title,
    contentType,
    url,
    body: {
      hash,
      description
    },
    metadata: {
      faviconLink,
      appIconLinks,
      keywords,
      ogImage,
      ogTitle,
      ogDescription,
      ogUrl,
      twitterCard,
      browser
    }
  } as OmitForCapture<INode>;
}

export function extractMinimalTabData(): OmitForCapture<INode> {
  const title = document.title;
  const hash = generateHash(document.body.innerHTML);
  const { ogTitle, ogImage, ogDescription, ogUrl } = resolveOgData();
  const browser = extractBrowserDetails();
  const url = resolveUrl();
  const contentType = resolveContentTypeForUrl(url);
  logger.log({ at: "extractMinimalTabData", url, contentType });
  return {
    metadata: { ogTitle, ogImage, ogDescription, ogUrl, browser },
    label: title,
    contentType,
    url,
    body: { hash }
  } as OmitForCapture<INode>;
}

export async function extractYoutubeVideoData() {
  const hash = generateHash(document.body.innerHTML);
  const url = resolveUrl();
  let title = document.title;
  let metadata;
  let youtubeMetadataFromOEmbedAPI;
  try {
    youtubeMetadataFromOEmbedAPI = await fetchYouTubeMetadata(
      window.location.href
    );
  } catch (e) {
    logger.error({ at: "extractYoutubeVideoData", error: e });
  }
  if (youtubeMetadataFromOEmbedAPI) {
    title = title ?? youtubeMetadataFromOEmbedAPI.title;
    metadata = {
      authorName: youtubeMetadataFromOEmbedAPI.author_name,
      authorUrl: youtubeMetadataFromOEmbedAPI.author_url,
      thumbnailUrl: youtubeMetadataFromOEmbedAPI.thumbnail_url
    };
  }
  const contentType = /\/shorts\//.test(url)
    ? NodeType.YOUTUBE_SHORT
    : NodeType.YOUTUBE_VIDEO;
  return {
    label: title,
    contentType,
    url,
    body: { hash },
    metadata
  };
}

export function resolveUrl(url?: string) {
  if (!url) url = window.location.href;
  url = url.split("#")[0];
  const hostname = new URL(url, window.location.href).hostname.toLowerCase();
  if (hostname === "youtube.com" || hostname.endsWith(".youtube.com")) {
    return url.split("&")[0];
  }
  return url;
}

function resolveOgData(doc?: Document) {
  doc = doc ?? document;
  const ogTitle = (
    doc.querySelector("meta[property='og:title']") as HTMLMetaElement
  )?.content;
  const ogImage = (
    doc.querySelector("meta[property='og:image']") as HTMLMetaElement
  )?.content;
  const ogDescription = (
    doc.querySelector("meta[property='og:description']") as HTMLMetaElement
  )?.content;
  const ogUrl = (
    doc.querySelector("meta[property='og:url']") as HTMLMetaElement
  )?.content;
  const ogSiteName = (
    doc.querySelector("meta[property='og:site_name']") as HTMLMetaElement
  )?.content;
  return { ogTitle, ogImage, ogDescription, ogUrl, ogSiteName };
}

export function resolveContentTypeString(contentType: NodeType | null) {
  if (!contentType) return "web page";
  else if (contentType === NodeType.WEB_SCREENSHOT) return "screenshot";
  else return enumToString(contentType);
}

export function resolveContentTypeForUrl(url: string) {
  return (
    contentTypeMap.find((item) => item.regex.some((regex) => regex.test(url)))
      ?.contentType ?? NodeType.WEB_PAGE
  );
}
