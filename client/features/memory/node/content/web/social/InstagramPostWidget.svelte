<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";
  import { Persistence } from "@nucleum/persistence/persistence";
  import { parse } from "@21n/shared-utils/json.utils";
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
  let dev_isUseOEmbedAPI = false;

  onMount(async () => {
    if (dev_isUseOEmbedAPI) await loadInstagramEmbed();
    window.instgrm?.Embeds.process();
    loading = false;
  });
  onDestroy(() => {
    window.instgrm = undefined;
  });

  async function loadInstagramEmbed() {
    try {
      loading = true;

      await tryOEmbedApproach();

      if (!embedHtml) {
        error = "Unable to load Instagram post";
        onError?.("Unable to load Instagram post");
      }
    } catch (err) {
      console.error("Instagram embed error:", err);
      error = "Failed to load Instagram post";
    } finally {
      loading = false;
    }
  }

  async function tryOEmbedApproach(): Promise<boolean> {
    try {
      const fallbackOembedUrl = `https://api.instagram.com/oembed/?url=${encodeURIComponent(postUrl)}`;

      const urlData = await new Persistence().retrieveUrlData(fallbackOembedUrl, {
        isReturnRawData: true
      });
      console.log({ urlData });
      if (urlData) {
        const data = parse(urlData.text);
        console.log({ data });
        if (data && data.error) {
          onError?.(data.error);
          return false;
        } else if (data && data.html) {
          embedHtml = data.html;
          setTimeout(() => {
            if (window.instgrm) {
              window.instgrm.Embeds.process();
            } else {
              loadInstagramScript();
            }
          }, 100);

          return true;
        }
      }
    } catch (err) {
      console.warn("Instagram oEmbed failed:", err);
    }
    return false;
  }

  function loadInstagramScript() {
    if (!document.querySelector('script[src*="instagram.com/embed.js"]')) {
      const script = document.createElement("script");
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      script.onload = () => {
        if (window.instgrm) {
          window.instgrm.Embeds.process();
        }
      };
      document.head.appendChild(script);
    } else if (window.instgrm) {
      window.instgrm.Embeds.process();
    }
  }
</script>

<svelte:head>
  <script async src="//www.instagram.com/embed.js"></script>
</svelte:head>

<div {id} class="w-full flex my-auto justify-center overflow-y-auto">
  {#if embedHtml}
    {@html embedHtml}
  {:else if dev_isUseOEmbedAPI}
    <SocialPostLoadingInfo {loading} {error} platform="Instagram" />
  {/if}
  <blockquote
    class="instagram-media"
    data-instgrm-captioned
    data-instgrm-permalink={postUrl}
    data-instgrm-version="14"
  ></blockquote>
</div>
