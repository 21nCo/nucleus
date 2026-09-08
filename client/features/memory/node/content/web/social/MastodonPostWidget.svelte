<script lang="ts">
  import { retrieveUrlData } from "@nucleum/features/memory/capture/url-data";
  import { onMount } from "svelte";
  import appearance from "@nucleum/stores/appearance.store";
  import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";
  import MastodonWidgetScript from "@nucleum/features/memory/node/content/web/social/MastodonWidgetScript.svelte";
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
  let isIframeable = $state(false);
  let dev_isUseDirectAPIApproach = false;

  onMount(async () => {
    await loadMastodonEmbed();
  });

  async function loadMastodonEmbed() {
    try {
      loading = true;

      const instanceDomain = extractInstanceDomain(postUrl);
      if (!instanceDomain) {
        error = "Invalid Mastodon URL";
        loading = false;
        return;
      }

      await tryOEmbedApproach(instanceDomain);
      if (!embedHtml) {
        if (dev_isUseDirectAPIApproach)
          await tryDirectAPIApproach(instanceDomain);
        if (!isIframeable) {
          onError?.("Unable to load Mastodon post");
          onFallback?.("Unable to load Mastodon post");
        } else await tryIframeApproach();
      }

      if (!embedHtml) {
        error = "Unable to load Mastodon post";
      }
    } catch (err) {
      console.error("Mastodon embed error:", err);
      error = "Failed to load Mastodon post";
    } finally {
      loading = false;
    }
  }

  async function tryDirectAPIApproach(domain: string) {
    const postId = extractPostId(postUrl);
    if (!postId) {
      error = "Invalid Mastodon URL";
      return;
    }

    const url = `https://${domain}/api/v1/statuses/${postId}`;
    const urlData = await retrieveUrlData(url, {
      isReturnRawData: true
    });
    if (urlData) {
      const data = parse(urlData.text);
      embedHtml = data.content || "";
      isIframeable = data.content;
    }
  }

  async function tryOEmbedApproach(instanceDomain: string) {
    try {
      const oembedUrl = `https://${instanceDomain}/api/oembed?url=${encodeURIComponent(postUrl)}`;
      const urlData = await retrieveUrlData(oembedUrl, {
        isReturnRawData: true
      });
      if (urlData) {
        const parsed = parse(urlData.text);
        console.log({ parsed });
        if (parsed && parsed.error) {
          onError?.(parsed.error);
        } else if (parsed && parsed.html) {
          embedHtml = sanitizeAndStyleHTML(parsed.html);
        }
      }
    } catch (err) {
      console.warn("Mastodon oEmbed failed:", err);
    }
    return false;
  }

  async function tryIframeApproach() {
    try {
      const postId = extractPostId(postUrl);
      const instanceDomain = extractInstanceDomain(postUrl);

      if (postId && instanceDomain) {
        const theme = $appearance?.colorScheme?.isDark ? "dark" : "light";
        const iframeUrl = `${postUrl}/embed`;

        embedHtml = `
          <iframe 
            src="${iframeUrl}" 
            class="mastodon-embed" 
            style="max-width: 100%; border: 0; width: 100%; height: 100%;"
            allowfullscreen
            title="Mastodon post"
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox">
          </iframe>
        `;
        return true;
      }
    } catch (err) {
      console.warn("Mastodon iframe approach failed:", err);
    }
    return false;
  }

  function extractInstanceDomain(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return null;
    }
  }

  function extractPostId(url: string): string | null {
    const match = url.match(/\/@[^/]+\/(\d+)/);
    return match ? match[1] : null;
  }

  function sanitizeAndStyleHTML(htmlString: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    
    const elements = doc.querySelectorAll('*');
    elements.forEach(element => {
      const currentStyle = element.getAttribute('style') || '';
      const styleObj = parseStyleString(currentStyle);
      
      styleObj.width = '80%';
      delete styleObj['max-width'];
      
      const newStyleString = Object.entries(styleObj)
        .filter(([, value]) => value !== undefined && value !== '')
        .map(([prop, value]) => `${prop}: ${value}`)
        .join('; ');
        
      if (newStyleString) {
        element.setAttribute('style', newStyleString);
      } else {
        element.removeAttribute('style');
      }
    });
    
    return doc.body.innerHTML;
  }

  function parseStyleString(styleString: string) {
    const styles: Record<string, string> = {};
    if (!styleString) return styles;
    
    styleString.split(';').forEach(rule => {
      const [property, value] = rule.split(':').map(s => s.trim());
      if (property && value) {
        styles[property] = value;
      }
    });
    
    return styles;
  }
</script>

<div {id} class="flex flex-col gap-3 w-full h-full justify-center items-center">
  {#if embedHtml}
    {@html embedHtml}
  {:else}
    <SocialPostLoadingInfo {loading} {error} platform="Mastodon" />
  {/if}
</div>

{#if embedHtml}
  <MastodonWidgetScript />
{/if}
