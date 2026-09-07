<script lang="ts">
  import {
    NodeType,
    type ITextClip,
    type IVideoTimestampClip,
    type IWebScreenshotClip
  } from "@nucleum/features/memory/node/node.type";
  import { TimeFormat } from "@21n/types/time.type";
  import { formatDatetime, formatSeconds } from "@21n/utils/time.utils";
  import InlineMarkdownTextInput from "@nucleum/features/memory/markdown/content/InlineMarkdownTextInput.svelte";
  import { AlertType } from "@21n/types/notification.type";
  import LinkBoxOnClipper from "@nucleum/features/memory/common/linkbox/LinkBoxOnClipper.svelte";
  import LinkItems from "@nucleum/features/memory/common/linkbox/LinkItems.svelte";
  import LinkActionOnClipper from "@nucleum/features/memory/common/linkbox/LinkActionOnClipper.svelte";
  import Button from "@21n/elements/button/Button.svelte";
  import {
    openAppPath,
    relayToContentScript
  } from "@21n/utils/extension.utils";
  import { ClipperExtensionEvent } from "@nucleum/features/memory/common/clip.type";
  import InlineFeedbackText from "@nucleum/extensions/clipper/InlineFeedbackText.svelte";
  import { onMount, onDestroy } from "svelte";
  import FileView from "@nucleum/features/files/FileView.svelte";
  import TextClip from "@nucleum/extensions/clipper/sidePanel/clips/TextClip.svelte";
  import { hoverable } from "@nucleum/actions/hover.action";
  import { userPreferences } from "@nucleum/stores/preferences/user-preferences.store";
  import { determineResourceType } from "@nucleum/datafn/resource.utils";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import Toggle from "@21n/elements/toggle/Toggle.svelte";
  import { Size } from "@21n/types/size.enum";
  import { ButtonStyle, ButtonVariant } from "@21n/types/button.type";
  import ResourceThumbnailContextMenu from "@nucleum/application/record/thumbnail/ResourceThumbnailContextMenu.svelte";
  import { Arrangement } from "@21n/types/direction.enum";
  import {
    ResourceAccessPoint,
    ResourceActionType
  } from "@nucleum/datafn/resource.type";
  import NodeTitle from "@nucleum/features/memory/node/title/NodeTitle.svelte";
  import { fly } from "svelte/transition";

  let {
    clip,
    onclick = undefined,
    onDelete = undefined
  }: {
    clip: (IVideoTimestampClip | ITextClip | IWebScreenshotClip) & {
      isInEditMode?: boolean;
    };
    onclick?: ((event: MouseEvent) => void) | undefined;
    onDelete?: (() => void) | undefined;
  } = $props();
  let isLinkboxOpened: boolean = false;
  let isNotesOpened: boolean = false;
  let feedback: string | { message: string; type: AlertType } = "";
  let notes: string = "";
  let isHovered: boolean = false;
  refreshDerivedData();
  $effect(() => {
    if (isLinkboxOpened) {
      isNotesOpened = false;
    }
  });

  onMount(() => {
    chrome.runtime.onMessage.addListener(messageListener);
    feedback = "";
  });

  onDestroy(() => {
    chrome.runtime.onMessage.removeListener(messageListener);
  });

  function messageListener(message: any, sender: any, sendResponse: any) {
    if (message.event === ClipperExtensionEvent.REFRESH_CLIP) {
      console.log({
        at: "Clip - messageListener - REFRESH_CLIP",
        message,
        clip
      });
      if (message.data.clipId === clip.id) {
        clip = message.data.clip;
        refreshDerivedData();
      }
    }
    return true;
  }

  async function onNotesChange(e: CustomEvent) {
    feedback = {
      message: "Saving...",
      type: AlertType.PROGRESS
    };
    const result = await relayToContentScript({
      event: ClipperExtensionEvent.MUTATION_RELAY,
      data: {
        action: "notes",
        clipId: clip.id,
        notes
      }
    });
    if (!result || result.error) {
      feedback = {
        message: result?.error ?? "Notes saving failed",
        type: AlertType.ERROR
      };
      return;
    }
    clip.notes = notes;
    feedback = {
      message: "Notes saved!",
      type: AlertType.SUCCESS
    };
  }

  function refreshDerivedData() {
    notes = clip?.notes ?? "";
  }

  async function onLinkAction(e: CustomEvent, action: string = "link") {
    if (!e.detail) return;
    const resourceType = determineResourceType(e.detail);
    let feedbackMessage = "";
    if (resourceType === Resource.collection) {
      feedbackMessage =
        action === "link"
          ? "Adding to collection..."
          : "Removing from collection...";
    } else {
      feedbackMessage = action === "link" ? "Linking..." : "Removing link...";
    }
    feedback = {
      message: feedbackMessage,
      type: AlertType.PROGRESS
    };
    const result = await relayToContentScript({
      event: ClipperExtensionEvent.MUTATION_RELAY,
      data: {
        action,
        clipId: clip.id,
        linkTo: e.detail
      }
    });
    console.log({ at: "Clip - onLinkAction", result });
    if (!result || result.error) {
      feedback = {
        message: result?.error ?? "Linking failed",
        type: AlertType.ERROR
      };
      return;
    }
    let successMessage = "";
    if (resourceType === Resource.collection) {
      successMessage =
        action === "link" ? "Added to collection!" : "Removed from collection!";
    } else {
      successMessage = action === "link" ? "Clip linked!" : "Link removed!";
    }
    feedback = {
      message: successMessage,
      type: AlertType.SUCCESS
    };
    if (result.clip) clip = result.clip;
    refreshDerivedData();
  }
  function onClick(e: PointerEvent | MouseEvent) {
    const target = e.target as HTMLElement;
    if (
      target.classList.contains("inline-markdown") ||
      e.pointerId === -1 ||
      target.nodeName === "svg" ||
      target.nodeName === "path"
    )
      return;
    onclick?.(new MouseEvent("click"));
  }

  async function handleDelete() {
    const result = await relayToContentScript({
      event: ClipperExtensionEvent.MUTATION_RELAY,
      data: {
        action: "delete",
        clipId: clip.id
      }
    });
    onDelete?.();
  }

  async function onPropertyChanges(e: CustomEvent) {
    if (!e.detail || !e.detail?.id || e.detail?.value === undefined) return;
    feedback = {
      message: "Syncing changes...",
      type: AlertType.PROGRESS
    };
    const result = await relayToContentScript({
      event: ClipperExtensionEvent.MUTATION_RELAY,
      data: {
        action: "property",
        clipId: clip.id,
        property: e.detail
      }
    });
    if (!result || result.error) {
      feedback = {
        message: result?.error ?? "Property update failed",
        type: AlertType.ERROR
      };
      return;
    }
    feedback = {
      message: "Synced!",
      type: AlertType.SUCCESS
    };
    if (result.clip.propertyValues) clip.propertyValues = result.clip.propertyValues;
  }

  async function onLabelChanges(label: string) {
    if (!label || label === undefined) return;
    feedback = {
      message: "Syncing changes...",
      type: AlertType.PROGRESS
    };
    const result = await relayToContentScript({
      event: ClipperExtensionEvent.MUTATION_RELAY,
      data: {
        action: "label",
        clipId: clip.id,
        label
      }
    });
    if (!result || result.error) {
      feedback = {
        message: result?.error ?? "Title update failed",
        type: AlertType.ERROR
      };
      return;
    }
    feedback = {
      message: "Title updated!",
      type: AlertType.SUCCESS
    };
    if (result.clip.label) clip.label = result.clip.label;
  }
</script>

<button
  class="relative flex flex-col gap-6 border border-brs2 rounded-md p-3 hover:border-brs3"
  use:hoverable={{
    onHover: (e) => {
      isHovered = e;
    }
  }}
>
  {#if clip.contentType === NodeType.WEB_TEXT_BOOKMARK || clip.contentType === NodeType.WEB_SCREENSHOT}
    <div class="flex flex-col gap-2 text-left w-full">
      {#key clip.body.highlighterId}
        <TextClip {clip} onclick={onClick} />
      {/key}
    </div>
  {:else if clip.contentType === NodeType.YOUTUBE_BOOKMARK && "timestamp" in clip.body}
    <button class="flex gap-4 w-full" onclick={onClick}>
      <FileView
        id={clip.body.thumbnail}
        class="thumbnail w-32 h-[72px] rounded-md"
      />
      <div
        class="flex flex-col gap-1 items-start justify-between flex-1 min-w-0"
      >
        <div class="flex w-full truncate overflow-x-auto">
          <NodeTitle
            node={clip}
            accessPoint={ResourceAccessPoint.CLIPPER}
            onLabelChange={onLabelChanges}
            onEditModeChange={(value) => {
              clip.isInEditMode = value;
            }}
          />
        </div>
        <div class="text-b3 text-fgs3">
          {formatSeconds(clip.body.timestamp, TimeFormat.CLOCK)}
        </div>
      </div>
    </button>
  {/if}
  <div class="flex flex-col gap-2">
    {#if clip.contentType !== NodeType.YOUTUBE_BOOKMARK}
      <div class="flex w-full truncate overflow-x-auto">
        <NodeTitle
          node={clip}
          accessPoint={ResourceAccessPoint.CLIPPER}
          onLabelChange={onLabelChanges}
          onEditModeChange={(value) => {
            clip.isInEditMode = value;
          }}
        />
      </div>
    {/if}
    <div class="flex flex-col gap-2 w-full">
      <div
        class="flex gap-1 justify-between bg-bgs1 rounded-md px-1 h-8 items-center"
      >
        <span class="text-b3 text-fgs3 text-left">
          {#if isHovered}
            &nbsp;
          {:else}
            <span in:fly={{ y: 10, duration: 200 }}>
              {formatDatetime($userPreferences, clip.createdAt)}
            </span>
          {/if}
        </span>
        <span class="flex gap-1 items-center">
          {#if isHovered || clip?.notes || clip?.links.length || isLinkboxOpened || isNotesOpened}
            {#if isHovered || clip?.notes || isNotesOpened}
              <Toggle
                icon={clip?.notes ? "note" : "note-blank"}
                tooltip={clip?.notes ? "View notes" : "Add notes"}
                bind:on={isNotesOpened}
                bgSize={Size.sm}
                onChange={(e) => {
                  if (e.detail) isLinkboxOpened = false;
                }}
              />
            {/if}
            {#if isHovered || clip?.links.length || isLinkboxOpened}
              <LinkActionOnClipper links={clip?.links} bind:isLinkboxOpened />
            {/if}
          {/if}
          <ResourceThumbnailContextMenu
            item={clip}
            arrangement={Arrangement.GRID}
            isInline={true}
            accessPoint={ResourceAccessPoint.CLIPPER}
            bgSize={Size.sm}
            icon="more-outline-horizontal"
            onAction={(e) => {
              const action = e?.detail?.action;
              if (action === ResourceActionType.DELETE) {
                handleDelete();
              } else if (action === ResourceActionType.OPEN) {
                // onOpenInApp();
                openAppPath(`library?pop=${clip.id}`);
              } else if (action === ResourceActionType.EDIT_NOTES) {
                isNotesOpened = true;
                isLinkboxOpened = false;
              } else if (action === ResourceActionType.EDIT_LINKS) {
                isLinkboxOpened = true;
                isNotesOpened = false;
              } else if (action === ResourceActionType.EDIT_TITLE) {
                clip.isInEditMode = true;
                isNotesOpened = false;
                isLinkboxOpened = false;
              }
            }}
          />
        </span>
      </div>
      {#if isLinkboxOpened}
        <LinkBoxOnClipper onLink={onLinkAction} />
        <LinkItems
          links={clip?.links}
          nodeId={clip.id}
          propertyValues={clip?.propertyValues}
          isWrapItems={true}
          isExpandable={true}
          onUnlink={(e) => onLinkAction(e, "unlink")}
          onPropertyChange={onPropertyChanges}
        />
      {/if}
      {#if isNotesOpened}
        <InlineMarkdownTextInput
          placeholder="Add notes"
          bind:content={notes}
          onDebouncedChange={onNotesChange}
        />
      {/if}
      {#if feedback}
        <InlineFeedbackText bind:feedback isRenderEmptyHeight={true} />
      {/if}
    </div>
  </div>
</button>
