<script lang="ts">
  import { onMount } from "svelte";
  import { isValidString } from "@21n/shared-utils/text.utils";
  import Button from "@21n/elements/button/Button.svelte";
  import { Size } from "@21n/types/size.enum";
  import { ButtonStyle, ButtonVariant } from "@21n/types/button.type";
  import HoverableElement from "@21n/elements/HoverableElement.svelte";
  import type { IWebPage } from "@nucleum/features/memory/node/node.type";
  import FileView from "@nucleum/features/files/FileView.svelte";
  import ImagePreview from "@nucleum/features/memory/node/content/ImagePreview.svelte";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import { resolveUrlData } from "@nucleum/features/memory/node/url.utils";
  import context from "@nucleum/stores/context.store";

  let {
    node,
    accessPoint = ResourceAccessPoint.SELF,
    isHovering = $bindable(false)
  }: {
    node: IWebPage;
    accessPoint?: ResourceAccessPoint;
    isHovering?: boolean;
  } = $props();
  let isCheckingIframability = $state(true);
  let isIframeShown = $state(false);
  let isIframeable = $state(false);
  let customMessage = $state<string | undefined>(undefined);

  onMount(async () => {
    await initialize();
  });

  async function initialize() {
    try {
      const data = resolveCustomSettings(node.url);
      customMessage = data.customMessage;
      isIframeable = data.isIframeable || false;
      if (isIframeable) {
        isIframeShown = true;
        isCheckingIframability = false;
      }
      if (!customMessage && !isIframeable) {
        const result = resolveIframability(node.url);
        isIframeable = result;
        if (
          isIframeable &&
          accessPoint === ResourceAccessPoint.MARKDOWN_EMBED
        ) {
          isIframeShown = true;
        }
        isCheckingIframability = false;
      }
    } catch (e) {
      console.error(e);
      isCheckingIframability = false;
    }
  }

  function resolveIframability(url: string): boolean {
    if (!url) {
      throw new Error("URL is required");
    }
    const fromUrlMap = resolveUrlData(url);
    if (fromUrlMap?.isIframeable) {
      return true;
    }
    return false;
  }

  function resolveCustomSettings(url: string) {
    const urlData = resolveUrlData(url);
    return {
      customMessage: urlData?.customMessage,
      isIframeable: urlData?.isIframeable
    };
  }
</script>

<HoverableElement
  class="relative w-full h-full flex justify-center items-center"
  bind:isHovering
>
  {#if customMessage}
    <div class="text-center text-b3 text-fgs3">{customMessage}</div>
  {:else if accessPoint === ResourceAccessPoint.MARKDOWN_EMBED && isCheckingIframability}
    <div class="text-center text-b3 text-fgs3">Loading preview...</div>
  {:else if accessPoint === ResourceAccessPoint.MARKDOWN_EMBED && !isIframeable}
    <div class="text-center text-b3 text-fgs3">Preview not available</div>
  {:else if isIframeable && isIframeShown}
    <iframe
      src={node.url}
      title="Web page preview"
      class="w-full h-full"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
  {:else if isValidString(node.metadata?.ogImage)}
    <ImagePreview
      src={node.metadata?.ogImage || ""}
      class="w-full h-full object-contain rounded--md"
    />
  {:else if node.metadata?.screenshotFile}
    <FileView id={node.metadata.screenshotFile} />
  {:else}
    <div class="text-center text-b3 text-fgs3">
      {#if !isIframeable}
        No preview available for this page. Please use the link below to view
        the page.
      {:else}
        Preview
      {/if}
    </div>
  {/if}

  {#if isIframeShown && isIframeable && accessPoint !== ResourceAccessPoint.MARKDOWN_EMBED}
    <div
      class="absolute top-0 right-0 mx-4 my-2 flex gap-2 items-center justify-center"
    >
      <Button
        icon="cross"
        size={Size.md}
        type={ButtonVariant.PRIMARY}
        style={ButtonStyle.OUTLINED}
        tooltip="Close preview"
        onclick={() => {
          isIframeShown = !isIframeShown;
        }}
      />
    </div>
  {/if}
  {#if isIframeable && (isHovering || $context.isTouchDevice) && !isIframeShown}
    <div class="absolute m-2 flex gap-2 items-center justify-center">
      <Button
        icon="play"
        size={Size.md}
        label="Preview"
        type={ButtonVariant.PRIMARY}
        style={ButtonStyle.DEFAULT}
        onclick={() => {
          isIframeShown = !isIframeShown;
        }}
      />
    </div>
  {/if}
</HoverableElement>
