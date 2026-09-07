<script lang="ts">
  import { onMount } from "svelte";
  import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";
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
  let loading = $state(true);
  let error = $state("");

  type FacebookWindow = Window & {
    FB?: {
      XFBML: {
        parse(element?: Element, callback?: () => void): void;
      };
    };
  };

  onMount(() => {
    loadFacebookWidget();
  });

  function loadFacebookWidget() {
    try {
      loading = true;

      if (!document.querySelector("#facebook-jssdk")) {
        const facebookScript = document.createElement("script");
        facebookScript.id = "facebook-jssdk";
        facebookScript.src =
          "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0";
        facebookScript.async = true;
        facebookScript.defer = true;
        facebookScript.crossOrigin = "anonymous";
        facebookScript.onload = () => {
          createFacebookEmbed();
        };
        document.head.appendChild(facebookScript);
      } else {
        createFacebookEmbed();
      }
    } catch (err) {
      console.error("Facebook widget error:", err);
      error = "Failed to load Facebook post";
      onError?.(error);
      onFallback?.(error);
      loading = false;
    }
  }

  function createFacebookEmbed() {
    try {
      const element = document.getElementById(id);
      if (element) {
        element.innerHTML = `
          <div class="fb-post" 
               data-href="${postUrl}" 
               data-width="500" 
               data-show-text="true">
            <blockquote cite="${postUrl}" class="fb-xfbml-parse-ignore">
              Loading Facebook post...
            </blockquote>
          </div>
        `;

        const facebookWindow = window as FacebookWindow;
        if (facebookWindow.FB) {
          facebookWindow.FB.XFBML.parse(element, () => {
            loading = false;
          });
        } else {
          setTimeout(() => {
            const delayedFacebookWindow = window as FacebookWindow;
            if (delayedFacebookWindow.FB) {
              delayedFacebookWindow.FB.XFBML.parse(element, () => {
                loading = false;
              });
            } else {
              error = "Facebook SDK failed to load";
              onError?.(error);
              onFallback?.(error);
              loading = false;
            }
          }, 2000);
        }
      }
    } catch (err) {
      console.error("Facebook embed creation error:", err);
      error = "Unable to load Facebook post";
      onError?.(error);
      onFallback?.(error);
      loading = false;
    }
  }
</script>

<div {id} class="w-full h-4/5 flex justify-center items-center">
  {#if loading}
    <div class="text-fgs3">Loading Facebook post...</div>
  {:else if error}
    <div class="text-red-500">{error}</div>
  {/if}
</div>
