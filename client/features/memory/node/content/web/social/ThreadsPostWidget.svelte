<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";
  import { Persistence } from "@nucleum/persistence/persistence";
  import { parse } from "@21n/shared-utils/json.utils";
  import SocialPostLoadingInfo from "@nucleum/features/memory/node/content/web/social/SocialPostLoadingInfo.svelte";
  let {
    postUrl,
    onError = undefined,
    onFallback = undefined
  }: {
    postUrl: string;
    onError?: ((message: string) => void) | undefined;
    onFallback?: ((message: string) => void) | undefined;
  } = $props();

  let id: string = generateSimpleRandomId();
  let embedHtml = $state("");
  let loading = $state(true);
  let error = $state("");
  let postId = extractThreadsPostId(postUrl) || "";
  let dev_isUseOEmbedAPI = false;

  onMount(async () => {
    if (dev_isUseOEmbedAPI) await loadThreadsEmbed();
    window.instgrm?.Embeds.process();
    loading = false;
  });
  onDestroy(() => {
    window.instgrm = undefined;
  });
  async function loadThreadsEmbed() {
    try {
      loading = true;
      const username = extractThreadsUsername(postUrl);

      if (!postId || !username) {
        error = "Invalid Threads URL";
        loading = false;
        return;
      }
      await tryOEmbedApproach();
      if (!embedHtml) {
        error = "Unable to load Threads post";
        onError?.("Unable to load Threads post");
        onFallback?.("Unable to load Threads post");
      }
    } catch (err) {
      console.error("Threads embed error:", err);
      error = "Failed to load Threads post";
    } finally {
      loading = false;
    }
  }

  async function tryOEmbedApproach(): Promise<boolean> {
    try {
      const oembedUrl = `https://www.threads.com/oembed?url=${encodeURIComponent(postUrl)}`;

      const urlData = await new Persistence().retrieveUrlData(oembedUrl, {
        isReturnRawData: true
      });
      if (urlData) {
        const data = parse(urlData.text);
        if (data && data.error) {
          onError?.(data.error);
          return false;
        } else if (data && data.html) {
          embedHtml = data.html;
          return true;
        }
      }
    } catch (err) {
      console.warn("Threads oEmbed failed:", err);
    }
    return false;
  }

  function extractThreadsUsername(url: string): string | null {
    const match = url.match(/threads\.(net|com)\/@([^/]+)/);
    return match ? match[2] : null;
  }

  function extractThreadsPostId(url: string): string | null {
    const match = url.match(/threads\.(net|com)\/@[^/]+\/post\/([A-Za-z0-9]+)/);
    return match ? match[2] : null;
  }
</script>

<svelte:head>
  <script async src="https://www.threads.com/embed.js"></script>
</svelte:head>

<div {id} class="w-full flex my-auto justify-center overflow-y-auto">
  {#if embedHtml && dev_isUseOEmbedAPI}
    {@html embedHtml}
  {:else if dev_isUseOEmbedAPI}
    <SocialPostLoadingInfo {loading} {error} platform="Threads" />
  {/if}
  <blockquote
    class="text-post-media"
    data-text-post-permalink={postUrl}
    data-text-post-version="0"
    id="ig-tp-{postId}"
  ></blockquote>
</div>
