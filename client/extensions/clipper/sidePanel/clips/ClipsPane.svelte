<script lang="ts">
  import { ClipperExtensionEvent } from "@nucleum/features/memory/common/clip.type";
  import { ExtensionEvent } from "@21n/types/extension.type";
  import {
    NodeType,
    type IClip,
    type ITextClip,
    type IVideoTimestampClip
  } from "@nucleum/features/memory/node/node.type";
  import { relayToContentScript } from "@21n/utils/extension.utils";
  import Clip from "@nucleum/extensions/clipper/sidePanel/clips/Clip.svelte";
  import { wait } from "@21n/utils/time.utils";
  import { onMount } from "svelte";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import ScrollViewBottomSpacer from "@21n/layout/scrollView/ScrollViewBottomSpacer.svelte";
  import { logger } from "@nucleum/client/runtime/logging/logger";
  import type { IRecordId } from "@21n/types/data.type";
  import { isSameResource } from "@nucleum/datafn/resource.utils";

  let {
    clips = [],
    isMemotronPage = false
  }: {
    clips?: IClip[];
    isMemotronPage?: boolean;
  } = $props();

  let transformedClips: IClip[] = [];
  let isLoadingState: boolean = true;

  onMount(async () => {
    transformedClips = await refresh(clips);
    isLoadingState = false;
  });

  /**
   * Refreshes the clips data for the current tab
   *
   * A timeout is added to fetch the order of the text highlights from the content script as the content script needs to resolve the highlights first and render them.
   * @param url
   */
  async function refresh(rawClips: IClip[]) {
    if (!rawClips || rawClips.length === 0) return [];
    logger.log({ at: "refresh - ClipsPane", rawClips });
    let textClips: ITextClip[] = [];
    let videoTimestampClips: IVideoTimestampClip[] = [];
    textClips = rawClips.filter(
      (clip) => clip.contentType === NodeType.WEB_TEXT_BOOKMARK
    );
    videoTimestampClips = rawClips
      .filter((clip) => clip.contentType === NodeType.YOUTUBE_BOOKMARK)
      ?.sort((a, b) => a.body.timestamp - b.body.timestamp);
    let webScreenshotClips = rawClips.filter(
      (clip) => clip.contentType === NodeType.WEB_SCREENSHOT
    );
    await wait(1000);
    return resolveOrderAndRenderClips();

    async function resolveOrderAndRenderClips() {
      const order = await relayToContentScript({
        event: ClipperExtensionEvent.RESOLVE_TEXT_HIGHLIGHTS_ORDER
      });
      logger.debug({ at: "resolveOrderAndRenderClips", order });
      if (textClips.length > 0 && Array.isArray(order) && order.length > 0) {
        textClips = order
          .map((x) => textClips.find((clip) => clip.id === x.id))
          .filter((x): x is ITextClip => x !== undefined);
      }
      return [...videoTimestampClips, ...textClips, ...webScreenshotClips];
    }
  }

  function onThumbnailClick(clipId: IRecordId) {
    // chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    //   chrome.tabs.sendMessage(tabs[0].id, {
    //     event: ExtensionEvent.CLICK_FROM_SIDEPANEL,
    //     clip: transformedClips.find((clip) => clip.id === clipId)
    //   });
    // });
    relayToContentScript({
      event: ExtensionEvent.CLICK_FROM_SIDEPANEL,
      data: {
        clip: transformedClips.find((clip) => clip.id === clipId)
      }
    });
  }

  function handleKeyPress(event, url) {
    if (event.key === "Enter" || event.key === " ") {
      // handleVideoClick(url);
      event.preventDefault();
    }
  }

  function onClipDelete(clipId: IRecordId) {
    transformedClips = transformedClips.filter(
      (clip) => !isSameResource(clip, clipId)
    );
  }
</script>

<main class="w-full h-full">
  {#if transformedClips?.length > 0}
    <div class="flex flex-col h-full w-full gap-3 overflow-y-auto">
      {#each transformedClips as clip, index (clip.id)}
        <Clip
          {clip}
          onclick={() => onThumbnailClick(clip.id)}
          onDelete={() => onClipDelete(clip.id)}
        />
      {/each}
      <ScrollViewBottomSpacer />
    </div>
  {:else}
    <EmptyStatusView
      {isLoadingState}
      isSearchContext={true}
      mainText={isMemotronPage
        ? "Hello from the other side of Memotron👋."
        : "No bookmarks found."}
      subText={isMemotronPage
        ? "Start highlighting to save bookmarks about Memotron to your Memotron."
        : "Start highlighting to create bookmarks."}
    />
  {/if}
</main>
