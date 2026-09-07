<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import FormControlLabel from "@21n/elements/text/formLabel/FormControlLabel.svelte";
  import LinkBoxOnClipper from "@nucleum/features/memory/common/linkbox/LinkBoxOnClipper.svelte";
  import { onMount } from "svelte";
  import {
    feedbackPane,
    webpage
  } from "@nucleum/extensions/clipper/contentScripts/store";
  import LinkItems from "@nucleum/features/memory/common/linkbox/LinkItems.svelte";
  import InlineFeedbackText from "@nucleum/extensions/clipper/InlineFeedbackText.svelte";
  import { AlertType } from "@21n/types/notification.type";
  import InlineMarkdownTextInput from "@nucleum/components/markdown/content/InlineMarkdownTextInput.svelte";
  import {
    NodeType,
    socialPostNodeTypeList
  } from "@nucleum/features/memory/node/node.type";
  import { resolveContentTypeString } from "@nucleum/extensions/clipper/clipper.utils";
  import FeedbackPaneBase from "@nucleum/extensions/clipper/feedbackPane/FeedbackPaneBase.svelte";
  import FileView from "@nucleum/features/files/FileView.svelte";
  import type { IRecordId } from "@21n/types/data.type";
  import {
    determineResourceType,
    resourceInList
  } from "@nucleum/datafn/resource.utils";
  import NodeThumbnailTweetPreview from "@nucleum/features/memory/node/thumbnail/NodeThumbnailTweetPreview.svelte";
  import { Placement } from "@21n/types/direction.enum";
  import type { IWebpageStore } from "@nucleum/extensions/clipper/contentScripts/types";
  import { logger } from "@nucleum/client/runtime/logging/logger";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { ResourceError } from "@nucleum/components/error/errors";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import NodeThumbnailSocialPostPreview from "@nucleum/features/memory/node/thumbnail/NodeThumbnailSocialPostPreview.svelte";
  let {
    pageContentType = undefined
  }: {
    pageContentType?: NodeType | undefined;
  } = $props();

  let notes: string =
    ($feedbackPane.focusedClip
      ? $feedbackPane.focusedClip.notes
      : $webpage?.notes) ?? "";
  let autoCloseDuration = 4;
  let closeTimer: any;
  let closeActionTimestamp: number;
  let isHovering = false;
  let now = Date.now();
  let isPropsExpanded = false;
  let notesRef: InlineMarkdownTextInput;
  let linkBoxRef: LinkBoxOnClipper;

  export function focusNotes() {
    notesRef?.focus({ xOffset: 0, isBottom: true });
  }
  export function focusLinkBox() {
    linkBoxRef?.focus();
  }

  let contentTypeStr = $derived(
    resolveContentTypeString(
      $feedbackPane.focusedClip?.contentType ?? pageContentType ?? null
    )
  );

  let linkItems = $derived(
    resolveLinkItems($webpage.links, $feedbackPane.focusedClip)
  );

  let propertyValues = $derived(
    resolvePropertyValues($webpage, $feedbackPane.focusedClip?.id)
  );

  function resolvePropertyValues(
    page: IWebpageStore,
    clip: IRecordId | undefined
  ) {
    if (!clip) return page.propertyValues;
    const clipProperties = $feedbackPane.focusedClip?.propertyValues;
    return clipProperties;
  }

  function resolveLinkItems(links: IRecordId[], focusedClip: IRecordId) {
    if (!focusedClip) return links;
    let clipLinks = $webpage.clips?.find(resourceInList(focusedClip))?.links;
    if (!clipLinks) return [];
    return [...clipLinks];
  }

  async function onNotesChange(e: CustomEvent) {
    $feedbackPane.feedback = {
      message: "Saving notes...",
      type: AlertType.PROGRESS
    };
    let response;
    if ($feedbackPane.focusedClip) {
      response = await webpage.persistClipNotes(
        $feedbackPane.focusedClip.id,
        notes
      );
    } else {
      response = await webpage.persistPageNotes(notes);
    }
    if (!response) {
      $feedbackPane.feedback = {
        message: "Notes failed to save",
        type: AlertType.ERROR
      };
    } else {
      $feedbackPane.feedback = {
        message: "Notes saved!",
        type: AlertType.SUCCESS
      };
    }
  }

  function onHover() {
    restartCloseTimer();
  }

  onMount(() => {
    nowTimer = setInterval(() => {
      now = Date.now();
    }, 1000);
    restartCloseTimer();
    const sub = feedbackPane.subscribe((n) => {
      if (n.isPreventAutoClose === false) {
        restartCloseTimer();
      }
    });
    return () => {
      clearTimeout(closeTimer);
      clearInterval(nowTimer);
      sub();
    };
  });

  function closePane() {
    feedbackPane.reset();
  }

  function restartCloseTimer() {
    clearTimeout(closeTimer);
    if (
      isHovering ||
      $feedbackPane.isPreventAutoClose ||
      $feedbackPane.isUserInitiated
    ) {
      return;
    }
    closeActionTimestamp = Date.now();
    closeTimer = setTimeout(() => {
      closePane();
    }, autoCloseDuration * 1000);
  }

  async function onLink(e: CustomEvent) {
    try {
      if (!e.detail) return;
      const resourceType = determineResourceType(e.detail);
      const feedbackMessage =
        resourceType === Resource.collection
          ? "Adding to collection..."
          : "Linking...";
      $feedbackPane.feedback = {
        message: feedbackMessage,
        type: AlertType.PROGRESS
      };
      let result;
      if ($feedbackPane.focusedClip)
        result = await webpage.linkClip($feedbackPane.focusedClip.id, e.detail);
      else result = await webpage.linkPage(e.detail);
      if (!result) return;
      const successMessage =
        resourceType === Resource.collection
          ? "Added to collection!"
          : "Clip linked!";
      $feedbackPane.feedback = {
        message: successMessage,
        type: AlertType.SUCCESS
      };
    } catch (error) {
      let errMessage = "Linking failed";
      if (error instanceof ResourceError) {
        errMessage = error.message;
      }
      $feedbackPane.feedback = {
        message: errMessage,
        type: AlertType.ERROR
      };
    }
  }
  async function onUnlink(e: CustomEvent) {
    if (!e.detail) return;
    const resourceType = determineResourceType(e.detail);
    const feedbackMessage =
      resourceType === Resource.collection
        ? "Removing from collection..."
        : "Removing link...";
    $feedbackPane.feedback = {
      message: feedbackMessage,
      type: AlertType.PROGRESS
    };
    let result;
    if (e.detail) {
      if ($feedbackPane.focusedClip)
        result = await webpage.removeLinkForClip(
          $feedbackPane.focusedClip.id,
          e.detail
        );
      else result = await webpage.removeLinkForPage(e.detail);
    }
    $feedbackPane.feedback = result?.message
      ? {
          message:
            resourceType === Resource.collection
              ? "Removed from collection!"
              : result.message,
          type: result.type
        }
      : { message: "Unlinking failed", type: AlertType.ERROR };
  }
  let nowTimer: ReturnType<typeof setInterval>;
  let countdown = $derived(
    autoCloseDuration - 1 - Math.floor((now - closeActionTimestamp) / 1000)
  );
  function onLinkClick(e: CustomEvent) {
    console.log("link click", e.detail);
  }

  async function onPropertyUpdate(e: CustomEvent) {
    if (!e.detail || !e.detail?.id || e.detail?.value === undefined) return;
    $feedbackPane.feedback = {
      message: "Syncing changes...",
      type: AlertType.PROGRESS
    };
    logger.log({
      at: "onPropertyUpdate",
      detail: e.detail,
      fc: $feedbackPane.focusedClip
    });
    let response;
    if ($feedbackPane.focusedClip)
      response = await webpage.updateClipProperty(
        $feedbackPane.focusedClip.id,
        {
          id: e.detail.id,
          value: e.detail.value
        }
      );
    else
      response = await webpage.updatePageProperty({
        id: e.detail.id,
        value: e.detail.value
      });
    if (!response || response.error) {
      $feedbackPane.feedback = {
        message: response?.error ?? "Property update failed! Please try again.",
        type: AlertType.ERROR
      };
      return;
    }
    $feedbackPane.feedback = {
      message: "Synced!",
      type: AlertType.SUCCESS
    };
  }

  function onExpansion(e: CustomEvent) {
    isPropsExpanded = e.detail === "has-props";
  }
</script>

<FeedbackPaneBase bind:isHovering {onHover}>
  {#if !$feedbackPane.isShowStatusOnly}
    <div class="flex flex-col w-full gap-2">
      <div class="flex w-full justify-between items-center">
        <!-- <span class="text-fgs3 text-b2"> Link this page </span> -->
        <FormControlLabel
          props={{
            label: `Link this ${contentTypeStr.toLowerCase()}`
            // tooltip: {
            //   body: `Link this ${contentTypeStr} to a node or add it to a collection by searching and clicking`,
            //   isUseAbsolutePositioning: true,
            //   placement: Placement.TopCenter
            // }
          }}
        />
        <span class="h-6 w-6 flex justify-center items-center">
          {#if isHovering || $feedbackPane.isUserInitiated}
            <Button
              icon="ph:x-circle-light"
              tooltip="Close"
              onclick={closePane}
            />
          {:else if $feedbackPane.isShown && countdown > 0 && !Number.isNaN(countdown)}
            <!-- TODO closing animation circle -->
            <span
              class="border border-fgs2 rounded-full text-b4 text-fgs2 px-1 h-4 flex justify-center items-center"
            >
              {countdown}
            </span>
          {/if}
        </span>
      </div>
      <LinkBoxOnClipper
        {onLink}
        bind:this={linkBoxRef}
        onFocus={() => {
          $feedbackPane.isUserInitiated = true;
        }}
      />
      <LinkItems
        links={linkItems}
        {propertyValues}
        nodeId={$feedbackPane.focusedClip?.id ?? $webpage.id}
        isExpandable={true}
        onPropertyChange={onPropertyUpdate}
        onClick={onLinkClick}
        {onUnlink}
        {onExpansion}
        isWrapItems={true}
      />
    </div>
    {#if !isPropsExpanded}
      <div
        class="flex w-full justify-center bg-bgs2 rounded-md px-2 py-1 flex-grow overflow-y-auto"
      >
        <!-- Fix placeholder color issue -->
        <InlineMarkdownTextInput
          placeholder="Add notes"
          bind:content={notes}
          bind:this={notesRef}
          onDebouncedChange={onNotesChange}
          onFocus={() => {
            $feedbackPane.isUserInitiated = true;
          }}
        />
      </div>
      {#if $feedbackPane.focusedClip?.contentType === NodeType.WEB_SCREENSHOT}
        <!-- <img
      src={$feedbackPane.focusedClip.body.s3Url}
      alt="Screenshot"
      class="w-full"
    /> -->
        <FileView
          id={$feedbackPane.focusedClip.body?.file}
          class="h-full w-full max-h-40 object-cover"
        />
      {:else if socialPostNodeTypeList.has($feedbackPane.focusedClip?.contentType ?? NodeType.UNKNOWN)}
        <span
          class="text-b2 p-1 border border-brs2 rounded-md overflow-clip max-h-40"
        >
          <NodeThumbnailSocialPostPreview
            text={$feedbackPane.focusedClip.body.content ??
              $feedbackPane.focusedClip.text}
            accessPoint={ResourceAccessPoint.CLIPPER}
            contentType={$feedbackPane.focusedClip?.contentType ??
              NodeType.UNKNOWN}
          />
        </span>
      {/if}
    {/if}
  {/if}
  <InlineFeedbackText
    bind:feedback={$feedbackPane.feedback}
    isRenderEmptyHeight={true}
  />
</FeedbackPaneBase>
