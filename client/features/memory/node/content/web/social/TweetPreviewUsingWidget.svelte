<script lang="ts">
  import appearance from "@nucleum/stores/appearance.store";
  import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";
  import { onMount } from "svelte";

  let { tweetUrl }: { tweetUrl: string } = $props();
  let id: string = generateSimpleRandomId();
  let widgetScriptLoaded = false;

  type TwitterWindow = Window & {
    twttr?: {
      ready(callback: () => void): void;
      widgets: {
        createTweet(
          tweetId: string,
          element: HTMLElement,
          options?: {
            theme?: string;
          }
        ): Promise<HTMLElement | null>;
      };
    };
  };

  onMount(() => {
    const loadTwitterWidget = () => {
      if (
        !document.querySelector(
          'script[src*="platform.twitter.com/widgets.js"]'
        )
      ) {
        const script = document.createElement("script");
        script.src = "https://platform.twitter.com/widgets.js";
        script.async = true;
        script.onload = () => {
          widgetScriptLoaded = true;
          createTweetWidget();
        };
        document.head.appendChild(script);
      } else {
        widgetScriptLoaded = true;
        createTweetWidget();
      }
    };

    const createTweetWidget = () => {
      const element = document.getElementById(id);
      const tweetId = getTweetId(tweetUrl);

      if (!tweetId) {
        console.warn("Invalid tweet URL:", tweetUrl);
        return;
      }

      const doCreate = () => {
        if (!element) return;
        const twitterWindow = window as TwitterWindow;
        twitterWindow.twttr?.widgets.createTweet(tweetId, element, {
            theme: $appearance?.colorScheme?.isDark ? "dark" : "light"
            // Let CSS drive responsive width; removed fixed width: 450
            // conversation: "none",
            // cards: "visible"
          })
          ?.then((el: HTMLElement | null) => {
            if (
              el &&
              typeof process !== "undefined" &&
              process.env?.NODE_ENV === "development"
            ) {
              console.log("Tweet widget created successfully");
            }
          })
          .catch((error: unknown) => {
            console.error("Failed to create tweet widget:", error);
          });
      };

      const twitterWindow = window as TwitterWindow;
      if (twitterWindow.twttr?.ready) {
        twitterWindow.twttr.ready(() => doCreate());
      } else if (widgetScriptLoaded) {
        // Fallback if ready() is unavailable
        setTimeout(createTweetWidget, 150);
      }
    };

    loadTwitterWidget();
  });

  function getTweetId(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname
        .split("/")
        .filter((segment) => segment.length > 0);
      const tweetId = pathSegments[pathSegments.length - 1];

      // Sanitize to digits only (tweet IDs are numeric)
      const numericId = tweetId ? tweetId.replace(/\D/g, "") : "";
      return numericId;
    } catch (error) {
      console.warn("Failed to parse tweet URL:", url, error);
      // Fallback to original method
      const segments = url.split("/");
      const lastSegment = segments[segments.length - 1] || "";
      return lastSegment.replace(/\D/g, "");
    }
  }
</script>

<div {id} class="w-full flex justify-center my-auto"></div>
