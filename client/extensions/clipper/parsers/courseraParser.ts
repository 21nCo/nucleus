import { logger } from "@nucleum/client/runtime/logging/logger";
import { NodeType } from "@nucleum/features/memory/node/node.type";
import type { IVideoBookmarkCapture } from "@nucleum/features/memory/node/node.type";
import {
  getVideoMetadata,
  getCurrentVideoTimestamp,
  captureVideoFrame,
  extractTranscriptAtTimestamp,
  extractCourseraVideoId
} from "@nucleum/extensions/clipper/parsers/shared/video.utils";

export function extractCourseraBookmark(): IVideoBookmarkCapture | null {
  try {
    // Check if we're on a Coursera video page
    const hostname = window.location.hostname;
    if (
      !(hostname === "www.coursera.org" || hostname === "coursera.org") ||
      !window.location.pathname.includes("/lecture/")
    ) {
      logger.error("Not on a Coursera video page");
      return null;
    }

    const videoMetadata = getVideoMetadata();

    if (!videoMetadata.videoId || !videoMetadata.timestamp) {
      logger.error("Unable to extract video ID or current timestamp");
      return null;
    }

    // Extract Coursera-specific data
    const courseName =
      document.querySelector(".rc-CourseTitle")?.textContent?.trim() ||
      document
        .querySelector('[data-e2e="course-title"]')
        ?.textContent?.trim() ||
      document.querySelector(".course-title")?.textContent?.trim() ||
      "";

    const videoTitle =
      document.querySelector(".rc-VideoTitle")?.textContent?.trim() ||
      document.querySelector('[data-e2e="video-title"]')?.textContent?.trim() ||
      document.querySelector(".video-title")?.textContent?.trim() ||
      videoMetadata.title;

    // Capture video frame
    const thumbnailDataUrl = captureVideoFrame();

    // Extract transcript at current timestamp
    const transcript = extractTranscriptAtTimestamp(videoMetadata.timestamp);

    // Create timestamped URL
    const timestampedUrl = `${videoMetadata.url}&t=${videoMetadata.timestamp}s`;

    return {
      url: timestampedUrl,
      contentType: NodeType.WEB_VIDEO_BOOKMARK,
      body: {
        timestamp: videoMetadata.timestamp,
        thumbnail: undefined // Will be set by the caller if file is uploaded
      },
      text:
        transcript ||
        `Coursera video timestamp: ${Math.floor(
          videoMetadata.timestamp / 60
        )}:${(videoMetadata.timestamp % 60).toString().padStart(2, "0")}`,
      metadata: {
        platform: "coursera",
        videoId: videoMetadata.videoId,
        title: videoTitle,
        courseName,
        duration: videoMetadata.duration || undefined,
        thumbnailDataUrl: thumbnailDataUrl || undefined,
        transcript: transcript || undefined
      }
    };
  } catch (error) {
    logger.error("Error extracting Coursera bookmark:", error);
    return null;
  }
}
