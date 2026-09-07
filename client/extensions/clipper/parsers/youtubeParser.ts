import { logger } from "@nucleum/components/debug/logger.client";
import { NodeType } from "@nucleum/features/memory/node/node.type";
import type { IVideoBookmarkCapture } from "@nucleum/features/memory/node/node.type";
import {
  getVideoMetadata,
  extractTranscriptAtTimestamp,
  checkIfAdPlaying
} from "@nucleum/extensions/clipper/parsers/shared/video.utils";

export function extractYoutubeBookmark(): IVideoBookmarkCapture | null {
  try {
    if (
      window.location.hostname !== "www.youtube.com" ||
      window.location.pathname !== "/watch"
    ) {
      logger.error("Not on a YouTube video page");
      return null;
    }

    if (checkIfAdPlaying()) {
      logger.error("Cannot clip video while an ad is playing");
      return null;
    }

    const videoMetadata = getVideoMetadata();

    if (!videoMetadata.videoId || !videoMetadata.timestamp) {
      logger.error("Unable to extract video ID or current timestamp");
      return null;
    }

    const channelName =
      document
        .querySelector("#channel-name .ytd-channel-name a")
        ?.textContent?.trim() ||
      document.querySelector(".ytd-channel-name a")?.textContent?.trim() ||
      "";

    const videoTitle =
      document.querySelector("h1.ytd-watch-metadata")?.textContent?.trim() ||
      videoMetadata.title;

    const transcript = extractTranscriptAtTimestamp(videoMetadata.timestamp);

    const timestampedUrl = `https://www.youtube.com/watch?v=${videoMetadata.videoId}&t=${videoMetadata.timestamp}s`;

    return {
      url: timestampedUrl,
      contentType: NodeType.YOUTUBE_BOOKMARK,
      body: {
        timestamp: videoMetadata.timestamp
      },
      text:
        transcript ||
        `YouTube video timestamp: ${Math.floor(
          videoMetadata.timestamp / 60
        )}:${(videoMetadata.timestamp % 60).toString().padStart(2, "0")}`,
      metadata: {
        platform: "youtube",
        videoId: videoMetadata.videoId,
        title: videoTitle,
        channelName,
        duration: videoMetadata.duration || undefined,
        transcript: transcript || undefined
      }
    };
  } catch (error) {
    logger.error("Error extracting YouTube bookmark:", error);
    return null;
  }
}
