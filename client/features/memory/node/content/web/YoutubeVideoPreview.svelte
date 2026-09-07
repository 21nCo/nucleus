<script lang="ts">
  import { logger } from "@nucleum/client/runtime/logging/logger";
  import { onMount } from "svelte";
  type YouTubeWindow = Window & {
    YT?: {
      Player: new (containerId: string, params: any) => any;
    };
    onYouTubeIframeAPIReady?: () => void;
    [key: string]: unknown;
  };

  let {
    url,
    timestamp: initialTimestamp = null
  }: {
    url: string;
    timestamp?: number | null;
  } = $props();
  let timestamp = $state<number | null>(initialTimestamp);
  let videoId = $derived(url ? extractVideoId(url) : null);

  const instanceId = Math.random().toString(36).substring(2, 15);
  let player: any;
  let playerReady = $state(false);
  let errorMessage = $state("");

  onMount(() => {
    if (url) {
      videoId = extractVideoId(url);
    }
    if (!videoId) return;

    const callbackName = `onYouTubeIframeAPIReady_${instanceId}`;

    const win = window as unknown as YouTubeWindow;
    if (win.YT?.Player) {
      initializePlayer();
    } else {
      if (
        !document.querySelector(
          'script[src="https://www.youtube.com/iframe_api"]'
        )
      ) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }

      win[callbackName] = initializePlayer;
      if (!win.onYouTubeIframeAPIReady) {
        win.onYouTubeIframeAPIReady = () => {
          Object.keys(win).forEach((key) => {
            if (key.startsWith("onYouTubeIframeAPIReady_")) {
              const callback = win[key];
              if (typeof callback === "function") callback();
            }
          });
        };
      }
    }

    return () => {
      if (player && typeof player.destroy === "function") {
        player.destroy();
      }
      delete win[callbackName];
    };
  });

  function extractVideoId(url: string): string | null {
    let videoId = null;
    const youtubeRegex =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(youtubeRegex);

    if (match && match[2].length === 11) {
      videoId = match[2];
    } else {
      const shortsMatch = url.match(/\/shorts\/([A-Za-z0-9_-]{11})/);
      if (shortsMatch) {
        videoId = shortsMatch[1];
      }
    }

    return videoId;
  }

  function initializePlayer() {
    try {
      const win = window as unknown as YouTubeWindow;
      if (!win.YT?.Player || !videoId) return;
      const containerId = `player-container-${instanceId}`;
      player = new win.YT.Player(containerId, {
        height: "600",
        width: "100%",
        videoId: videoId,
        playerVars: {
          autoplay: 0
        },
        events: {
          onReady: onPlayerReady,
          onError: onPlayerError
        }
      });
    } catch (e) {
      logger.error({ at: "YoutubeVideoPreview initializePlayer", error: e });
    }
  }

  export function onTrace(e: any) {
    if (e.id && e.timestamp && player) {
      timestamp = e.timestamp;
      player.seekTo(timestamp, true);
      player.playVideo();
    }
  }

  function onPlayerReady() {
    playerReady = true;
    errorMessage = "";
    if (timestamp) {
      player.seekTo(timestamp, true);
    }
    cueVideo();
  }

  function onPlayerError(event: any) {
    console.error("YouTube Player Error:", event.data);
    errorMessage = getErrorMessage(event.data);
  }

  function getErrorMessage(errorCode: number): string {
    switch (errorCode) {
      case 2:
        return "The video ID is invalid.";
      case 5:
        return "The requested content cannot be played in an HTML5 player.";
      case 100:
        return "The video requested was not found.";
      case 101:
      case 150:
        return "The owner of the requested video does not allow it to be played in embedded players.";
      default:
        return "An error occurred. Please try again later.";
    }
  }

  function cueVideo() {
    if (playerReady && videoId) {
      errorMessage = "";
      player.cueVideoById(videoId, timestamp ?? undefined);
    }
  }
</script>

<div class="flex flex-col w-full h-full justify-center items-center">
  <div id={`player-container-${instanceId}`} class="w-full">
    {#if errorMessage}
      <div
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
        role="alert"
      >
        <strong class="font-bold">Error:</strong>
        <span class="block sm:inline">{errorMessage}</span>
      </div>
    {/if}
  </div>
</div>
<!-- {#if videoId}
  <div class="flex flex-col w-full h-full justify-center items-center">
    <iframe
      src="https://www.youtube.com/embed/{videoId}{timestamp
        ? '?start=' + timestamp
        : ''}"
      title="YouTube video player"
      frameborder="0"
      height="600"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
      class="w-full"
    ></iframe>
  </div>
{/if} -->
