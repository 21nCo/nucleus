import { logger } from "@nucleum/components/debug/logger.client";

/**
 * Common video utilities for all video platforms
 */

/**
 * Extracts video ID from YouTube URL
 */
export function extractYouTubeVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  );
  return match ? match[1] : null;
}

/**
 * Extracts video ID from Coursera URL
 */
export function extractCourseraVideoId(url: string): string | null {
  const match = url.match(/coursera\.org\/learn\/([^/]+)\/lecture\/([^/]+)/);
  if (!match) return null;
  const [, courseId, lectureId] = match;
  return `${courseId}_${lectureId}`;
}

/**
 * Extracts video ID from Udemy URL
 */
export function extractUdemyVideoId(url: string): string | null {
  const match = url.match(
    /udemy\.com\/course\/[^/]+\/learn\/lecture\/([0-9]+)/
  );
  if (!match) return null;
  const [, lectureId] = match;
  return lectureId;
}

/**
 * Gets current timestamp from video element
 */
export function getCurrentVideoTimestamp(): number | null {
  const videoPlayer = document.querySelector("video") as HTMLVideoElement;
  if (videoPlayer && !isNaN(videoPlayer.currentTime)) {
    return Math.floor(videoPlayer.currentTime);
  }
  return null;
}

/**
 * Gets video duration from video element
 */
export function getVideoDuration(): number | null {
  const videoPlayer = document.querySelector("video") as HTMLVideoElement;
  if (videoPlayer && !isNaN(videoPlayer.duration)) {
    return Math.floor(videoPlayer.duration);
  }
  return null;
}

export function getVideoPlayData() {
  const currentTime = getCurrentVideoTimestamp();
  const duration = getVideoDuration();
  const isAdPlaying = checkIfAdPlaying();
  const isVideoPaused = checkIfVideoPaused();
  return { currentTime, duration, isAdPlaying, isVideoPaused };
}

/**
 * Captures current video frame as data URL
 */
export function captureVideoFrame(): string | null {
  const videoPlayer = document.querySelector("video") as HTMLVideoElement;
  if (!videoPlayer) return null;

  if (videoPlayer.readyState < 2) {
    logger.error("Video not ready for frame capture");
    return null;
  }

  const canvas = document.createElement("canvas");
  const { videoWidth = 640, videoHeight = 360 } = videoPlayer;
  canvas.width = videoWidth;
  canvas.height = videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  try {
    ctx.drawImage(videoPlayer, 0, 0);
    return canvas.toDataURL("image/png");
  } catch (error) {
    logger.error("Error capturing video frame (possible CORS issue):", error);
    return null;
  }
}

/**
 * Gets video title from page
 */
export function getVideoTitle(): string {
  // Try common title selectors across platforms
  const selectors = [
    "h1",
    ".title",
    '[data-purpose="video-title"]',
    ".rc-VideoTitle",
    ".ud-heading-xl"
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent?.trim()) {
      return element.textContent.trim();
    }
  }

  return document.title || "Untitled Video";
}

/**
 * Gets course/channel name
 */
export function getCourseOrChannelName(): string {
  // Platform-specific selectors
  const selectors = [
    ".channel-name",
    ".rc-CourseTitle",
    ".ud-heading-md",
    '[data-purpose="course-title"]'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent?.trim()) {
      return element.textContent.trim();
    }
  }

  return "";
}

/**
 * Attempts to extract transcript or captions at current timestamp
 */
export function extractTranscriptAtTimestamp(timestamp: number): string | null {
  try {
    // YouTube captions
    const ytCaptions = document.querySelectorAll(".ytp-caption-segment");
    if (ytCaptions.length > 0) {
      const activeCaption = Array.from(ytCaptions).find((caption) =>
        caption.classList.contains("ytp-caption-segment")
      );
      return activeCaption?.textContent || null;
    }

    // Coursera transcript
    const courseraTranscript = document.querySelector(".rc-CML .active");
    if (courseraTranscript?.textContent) {
      return courseraTranscript.textContent.trim();
    }

    // Udemy captions
    const udemyCaptions = document.querySelector(
      '[data-purpose="captions-cue-text"]'
    );
    if (udemyCaptions?.textContent) {
      return udemyCaptions.textContent.trim();
    }

    return null;
  } catch (error) {
    logger.error("Error extracting transcript:", error);
    return null;
  }
}

/**
 * Checks if an ad is currently playing (YouTube specific)
 */
export function checkIfAdPlaying(): boolean {
  const adModuleElement = document.querySelector(".ytp-ad-module");
  const videoAdElement = document.querySelector(".video-ads");

  if (adModuleElement && adModuleElement.children.length > 0) return true;
  if (videoAdElement && videoAdElement.children.length > 0) return true;

  return false;
}

export function checkIfVideoPaused(): boolean {
  const videoPlayer = document.querySelector("video") as HTMLVideoElement;
  if (videoPlayer) {
    return videoPlayer.paused;
  }
  return false;
}

export function pauseVideo(): void {
  const videoPlayer = document.querySelector("video") as HTMLVideoElement;
  if (videoPlayer) {
    videoPlayer.pause();
  }
}

export function resumeVideo(): void {
  const videoPlayer = document.querySelector("video") as HTMLVideoElement;
  if (videoPlayer) {
    videoPlayer.play();
  }
}

/**
 * Gets video metadata for different platforms
 */
export function getVideoMetadata() {
  const currentUrl = window.location.href;
  const hostname = window.location.hostname;

  let platform = "unknown";
  let videoId = null;

  if (hostname === "www.youtube.com" || hostname === "youtube.com") {
    platform = "youtube";
    videoId = extractYouTubeVideoId(currentUrl);
  } else if (hostname === "www.coursera.org" || hostname === "coursera.org") {
    platform = "coursera";
    videoId = extractCourseraVideoId(currentUrl);
  } else if (hostname === "www.udemy.com" || hostname === "udemy.com") {
    platform = "udemy";
    videoId = extractUdemyVideoId(currentUrl);
  }

  return {
    platform,
    videoId,
    title: getVideoTitle(),
    courseOrChannel: getCourseOrChannelName(),
    url: currentUrl,
    timestamp: getCurrentVideoTimestamp(),
    duration: getVideoDuration()
  };
}

export function seekToTimestamp(timestamp: number) {
  const videoPlayer = document.querySelector("video") as HTMLVideoElement;
  if (videoPlayer) {
    videoPlayer.currentTime = timestamp;
  }
}
