import { logger } from "@nucleum/client/runtime/logging/logger";
import { NodeType } from "@nucleum/schema/legacy/node-type.enum";
import type { IVideoBookmarkCapture } from "@nucleum/features/memory/node/node.type";
import {
  getVideoMetadata,
  getCurrentVideoTimestamp,
  captureVideoFrame,
  extractTranscriptAtTimestamp,
  extractUdemyVideoId
} from "@nucleum/extensions/clipper/parsers/shared/video.utils";

export function extractUdemyBookmark(): IVideoBookmarkCapture | null {
  try {
    // Check if we're on a Udemy video page
    const hostname = window.location.hostname;
    if (
      !(hostname === "www.udemy.com" || hostname === "udemy.com") ||
      !window.location.pathname.includes("/learn/lecture/")
    ) {
      logger.error("Not on a Udemy video page");
      return null;
    }

    const videoMetadata = getVideoMetadata();

    if (!videoMetadata.videoId || !videoMetadata.timestamp) {
      logger.error("Unable to extract video ID or current timestamp");
      return null;
    }

    // Extract Udemy-specific data
    const courseName =
      document
        .querySelector('[data-purpose="course-title"]')
        ?.textContent?.trim() ||
      document.querySelector(".ud-heading-md")?.textContent?.trim() ||
      document.querySelector("h1")?.textContent?.trim() ||
      "";

    const videoTitle =
      document
        .querySelector('[data-purpose="video-title"]')
        ?.textContent?.trim() ||
      document.querySelector(".ud-heading-xl")?.textContent?.trim() ||
      document.querySelector(".lecture-title")?.textContent?.trim() ||
      videoMetadata.title;

    // Capture video frame
    const thumbnailDataUrl = captureVideoFrame();

    // Extract transcript at current timestamp
    const transcript = extractTranscriptAtTimestamp(videoMetadata.timestamp);

    // Create timestamped URL - Udemy uses a different timestamp format
    const timestampedUrl = `${videoMetadata.url}?start=${videoMetadata.timestamp}`;

    return {
      url: timestampedUrl,
      contentType: NodeType.WEB_VIDEO_BOOKMARK,
      body: {
        timestamp: videoMetadata.timestamp,
        thumbnail: undefined // Will be set by the caller if file is uploaded
      },
      text:
        transcript ||
        `Udemy video timestamp: ${Math.floor(videoMetadata.timestamp / 60)}:${(
          videoMetadata.timestamp % 60
        )
          .toString()
          .padStart(2, "0")}`,
      metadata: {
        platform: "udemy",
        videoId: videoMetadata.videoId,
        title: videoTitle,
        courseName,
        duration: videoMetadata.duration || undefined,
        thumbnailDataUrl: thumbnailDataUrl || undefined,
        transcript: transcript || undefined
      }
    };
  } catch (error) {
    logger.error("Error extracting Udemy bookmark:", error);
    return null;
  }
}
