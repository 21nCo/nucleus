<script lang="ts">
  import { onMount } from "svelte";
  import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";
  import { Persistence } from "@nucleum/persistence/persistence";
  import { parse } from "@21n/shared-utils/json.utils";
  import BlueskyWidgetScript from "@nucleum/features/memory/node/content/web/social/BlueskyWidgetScript.svelte";
  import SocialPostLoadingInfo from "@nucleum/features/memory/node/content/web/social/SocialPostLoadingInfo.svelte";
  let {
    postUrl,
    onError = undefined
  }: {
    postUrl: string;
    onError?: ((message: string) => void) | undefined;
  } = $props();

  let id: string = generateSimpleRandomId();
  let embedHtml = $state("");
  let loading = $state(true);
  let error = $state("");
  let dev_isUseIframeAsFallback = false;
  onMount(async () => {
    await loadBlueskyEmbed();
  });

  async function loadBlueskyEmbed() {
    try {
      loading = true;

      const postId = extractBlueskyPostId(postUrl);
      const handle = extractBlueskyHandle(postUrl);

      if (!postId || !handle) {
        error = "Invalid Bluesky URL";
        loading = false;
        return;
      }

      await tryOEmbedApproach();
      if (!embedHtml && dev_isUseIframeAsFallback) {
        await tryIframeApproach();
      }

      if (!embedHtml) {
        error = "Unable to load Bluesky post";
        onError?.(error);
      }
    } catch (err) {
      console.error("Bluesky embed error:", err);
      error = "Failed to load Bluesky post";
    } finally {
      loading = false;
    }
  }

  async function tryOEmbedApproach() {
    try {
      const oembedUrl = `https://embed.bsky.app/oembed?url=${encodeURIComponent(postUrl)}`;
      const urlData = await new Persistence().retrieveUrlData(oembedUrl, {
        isReturnRawData: true
      });
      if (urlData) {
        const parsed = parse(urlData.text);
        embedHtml = parsed.html;
        return true;
      }
    } catch (err) {
      console.warn("Bluesky oEmbed failed:", err);
    }
    return false;
  }

  async function tryIframeApproach() {
    try {
      const postId = extractBlueskyPostId(postUrl);
      const handle = extractBlueskyHandle(postUrl);

      if (postId && handle) {
        embedHtml = `
          <iframe 
            src="https://embed.bsky.app/embed/${handle}/app.bsky.feed.post/${postId}" 
            width="400" 
            height="600" 
            style="max-width: 100%; border: 1px solid #ccc; border-radius: 8px;" 
            frameborder="0"
            allowfullscreen>
          </iframe>
        `;
        return true;
      }
    } catch (err) {
      console.warn("Bluesky iframe approach failed:", err);
    }
    return false;
  }

  function extractBlueskyHandle(url: string): string | null {
    const match = url.match(/bsky\.app\/profile\/([^/]+)/);
    return match ? match[1] : null;
  }

  function extractBlueskyPostId(url: string): string | null {
    const match = url.match(/bsky\.app\/profile\/[^/]+\/post\/([A-Za-z0-9]+)/);
    return match ? match[1] : null;
  }
</script>

<div {id} class="w-full h-full flex justify-center items-center">
  {#if embedHtml}
    {@html embedHtml}
  {:else}
    <SocialPostLoadingInfo {loading} {error} platform="Bluesky" />
  {/if}
</div>

{#if embedHtml}
  <BlueskyWidgetScript />
{/if}
