<script lang="ts">
  import ToolbarOpener from "@nucleum/extensions/clipper/toolbar/ToolbarOpener.svelte";
  import {
    resolveContentTypeForUrl,
    resolveContentTypeString
  } from "@nucleum/extensions/clipper/clipper.utils";
  import { ExtensionEvent } from "@21n/types/extension.type";
  import FeedbackPane from "@nucleum/extensions/clipper/feedbackPane/FeedbackPane.svelte";
  import Toolbar from "@nucleum/extensions/clipper/toolbar/Toolbar.svelte";
  import TextClipper from "@nucleum/extensions/clipper/contentScripts/TextClipper.svelte";
  import {
    webpage,
    toolbarState,
    feedbackPane,
    syncStore
  } from "@nucleum/extensions/clipper/contentScripts/store";
  import { ClipperExtensionEvent } from "@nucleum/features/memory/common/clip.type";
  import ExtensionBaseLayer from "@nucleum/extensions/ExtensionBaseLayer.svelte";
  import ScreenShot from "@nucleum/extensions/clipper/contentScripts/ScreenShot.svelte";
  import { logger } from "@nucleum/components/debug/logger.client";
  import SyncPane from "@nucleum/extensions/clipper/syncPane/SyncPane.svelte";
  import LoginNotification from "@nucleum/extensions/clipper/feedbackPane/LoginNotification.svelte";
  import { relayToBackgroundScript } from "@21n/utils/extension.utils";
  import { resourceInList } from "@nucleum/datafn/resource.utils";
  import { ResourceError } from "@nucleum/components/error/errors";
  import { Placement } from "@21n/types/direction.enum";
  import ToolbarPlacementHintBlock from "@nucleum/extensions/clipper/toolbar/ToolbarPlacementHintBlock.svelte";
  import { clientStorage } from "@nucleum/persistence/persistence.utils";
  import { ClientStorageKey } from "@nucleum/persistence/persistence.type";
  import { onDestroy, onMount } from "svelte";
  import { toolbarUnavailableUrlsList } from "@nucleum/features/memory/common/urlMap";
  import type { IHighlighter } from "@nucleum/features/memory/common/highlighters/highlight.type";
  import { Product } from "@nucleum/products/product.type";
  import { parse } from "@21n/shared-utils/json.utils";
  import ClipModal from "@nucleum/extensions/clipper/ClipModal.svelte";
  let { id }: { id: string } = $props();
  let textClipperRef: TextClipper;
  let extensionBaseRef: ExtensionBaseLayer;
  let isSnipActive: boolean = false;
  let loginState: number | null = null;
  let isDisableClipper = true;
  let isLoggedIn: boolean = false;
  let isDraggingToolbar: boolean = false;
  let isSidePanelOpen: boolean = false;
  let isBaseMounted: boolean = false;
  let feedbackPaneRef: FeedbackPane;

  let isDisableClipper = $derived(
    toolbarUnavailableUrlsList.some((regex) => {
      return regex.test(window.location.href);
    })
  );
  let contentType = $derived(resolveContentTypeForUrl($webpage.url));
  let contentTypeStr = $derived(resolveContentTypeString(contentType));

  function onActivateColor(e: CustomEvent<IHighlighter | number>) {
    textClipperRef.onActivateColor(e);
  }

  onMount(() => {
    chrome.runtime.onMessage.addListener(messageListener);
  });

  onDestroy(() => {
    chrome.runtime.onMessage.removeListener(messageListener);
  });

  async function onSaveClick() {
    try {
      if (
        isDisableClipper ||
        !isLoggedIn ||
        !isBaseMounted ||
        !$toolbarState?.isOpen ||
        $toolbarState?.isHidden
      )
        return;
      feedbackPane.onPageSaveStart(`Saving ${contentTypeStr.toLowerCase()}...`);
      if ($webpage.id) {
        feedbackPane.setErrorFeedback({
          message: "Page already saved.",
          isPreventAutoClose: false
        });
        return;
      }
      let result = await webpage.savePage({ contentType });
      if (!result || result.error) {
        feedbackPane.setErrorFeedback({
          isPreventAutoClose: false
        });
        return;
      }
      feedbackPane.onPageSaved(`${contentTypeStr} saved!`);
    } catch (error) {
      feedbackPane.setErrorFeedback({
        isPreventAutoClose: false
      });
    }
  }

  async function savePageFromSidePanel() {
    try {
      if (isDisableClipper || !isLoggedIn || !isBaseMounted) {
        return { error: "Cannot save page at this time" };
      }
      if ($webpage.id) {
        return { error: "Page already saved", pageId: $webpage.id };
      }
      let result = await webpage.savePage({ contentType });
      if (!result || result.error) {
        return { error: result?.error ?? "Failed to save page" };
      }
      return { status: "success", pageId: $webpage.id };
    } catch (error) {
      return { error: "Failed to save page" };
    }
  }

  async function onMutationRelay(data: any, isFromSidePanel: boolean = false) {
    try {
      logger.log({ at: "onMutationRelay", data });
      let result;
      if (data.action === "link") {
        result = await webpage.linkClip(data.clipId, data.linkTo, {
          isFromSidePanel
        });
      } else if (data.action === "unlink") {
        result = await webpage.removeLinkForClip(data.clipId, data.linkTo, {
          isFromSidePanel
        });
      } else if (data.action === "notes") {
        result = await webpage.persistClipNotes(data.clipId, data.notes, {
          isFromSidePanel
        });
      } else if (data.action === "webpageNotes") {
        result = await webpage.persistPageNotes(data.notes, {
          isFromSidePanel
        });
      } else if (data.action === "delete") {
        result = await webpage.removeClip(data.clipId, {
          isFromSidePanel
        });
      } else if (data.action === "property") {
        result = await webpage.updateClipProperty(data.clipId, data.property, {
          isFromSidePanel
        });
      } else if (data.action === "label") {
        result = await webpage.updateClipLabel(data.clipId, data.label, {
          isFromSidePanel
        });
      }
      if (data.clipId && result) {
        const clip = $webpage.clips?.find(resourceInList(data.clipId));
        return {
          ...result,
          clip
        };
      } else return result;
    } catch (error) {
      logger.error({ at: "onMutationRelay", error });
      let errMessage = "Mutation failed";
      if (error instanceof ResourceError) {
        errMessage = error.message;
      }
      return {
        error: errMessage
      };
    }
  }

  const messageListener = (message: any, sender: any, sendResponse: any) => {
    logger.log({
      at: "onMessage - Content script",
      event: message.event,
      message
    });

    const handleMessage = async () => {
      try {
        switch (message.event) {
          case ExtensionEvent.TAB_UPDATE:
            isSidePanelOpen = false;
            const token = await extensionBaseRef.onTabUpdate();
            if (token) isLoggedIn = true;
            if (!isLoggedIn) {
              setLoginState(-3);
              webpage.reset();
              return {
                status: "error",
                message: "You are not logged in"
              };
            } else {
              loginState = null;
            }
            webpage.onContextChange(message.tab);
            return { status: "success", message: "context changed" };

          case ExtensionEvent.LOGOUT:
            setLoginState(-2);
            isLoggedIn = false;
            webpage.reset();
            return { status: "success", message: "Logged out" };

          case ExtensionEvent.TOKEN_NOT_FOUND:
            setLoginState(-3);
            isLoggedIn = false;
            webpage.reset();
            return { status: "success", message: "Logged out" };

          case ExtensionEvent.PAGE_STATE_TRIGGER:
            if (!isLoggedIn) {
              setLoginState(-3);
              return {
                status: "error",
                message: "You are not logged in"
              };
            }
            await webpage.refresh();
            return {
              page: $webpage,
              toolbar: $toolbarState
            };

          case ClipperExtensionEvent.SAVE_WEBPAGE:
            if (!isLoggedIn) {
              setLoginState(-3);
              return {
                status: "error",
                message: "You are not logged in"
              };
            }
            const saveResult = await savePageFromSidePanel();
            if (saveResult.error) {
              return {
                status: "error",
                message: saveResult.error,
                pageId: saveResult.pageId
              };
            } else if (saveResult.status === "success") {
              return {
                status: "success",
                message: "Page saved",
                pageId: saveResult.pageId
              };
            } else {
              return {
                status: "error",
                message: "Unexpected response"
              };
            }

          case ClipperExtensionEvent.TAKE_SCREENSHOT_SHORTCUT:
            isSnipActive = true;
            return { status: "success", message: "Screenshot taken" };

          case ClipperExtensionEvent.MINIMIZE_TOOLBAR:
            toolbarState.toggle();
            return { status: "success", message: "Toolbar minimized" };

          case ClipperExtensionEvent.ACTIVATE_LINK_BOX:
            if (!$webpage.id) {
              feedbackPane.setErrorFeedback({
                message: "Please save the page first.",
                isPreventAutoClose: false
              });
              $feedbackPane.isShowStatusOnly = true;
              feedbackPane.toggle();
              return;
            }
            if (!$feedbackPane.isShown) {
              feedbackPane.toggle({ isUserInitiated: true });
            }
            setTimeout(() => {
              feedbackPaneRef?.focusLinkBox();
            }, 100);
            return { status: "success", message: "Link box activated" };

          case ClipperExtensionEvent.TOGGLE_TOOLBAR_VISIBILITY:
            toolbarState.toggleVisibility();
            return { status: "success", message: "Toolbar closed" };

          case ClipperExtensionEvent.MUTATION_RELAY:
            const result = await onMutationRelay(message.data, true);
            return result;
          case ExtensionEvent.MUTATION:
            return { status: "success", message: "Mutation acknowledged" };

          case ExtensionEvent.SIDEPANEL_OPENED:
            isSidePanelOpen = true;
            return { status: "success", message: "Side panel opened" };

          case ExtensionEvent.SIDEPANEL_CLOSED:
            isSidePanelOpen = false;
            return { status: "success", message: "Side panel closed" };
        }
      } catch (error) {
        console.error("Error handling message:", error);
      }
    };
    handleMessage().then(sendResponse);
    return true;
  };

  async function setLoginState(code: number) {
    loginState = code;
    if (code === 1) {
      clientStorage.remove(ClientStorageKey.GUEST_TOOLBAR_STATE);
    } else {
      const guestToolbarState = await clientStorage.get(
        ClientStorageKey.GUEST_TOOLBAR_STATE
      );
      if (guestToolbarState) {
        const parsed = parse(guestToolbarState);
        if (parsed.isCollapsed && $toolbarState.isOpen) {
          toolbarState.toggle(false);
        }
      }
    }
  }
</script>

<ExtensionBaseLayer
  bind:this={extensionBaseRef}
  bind:isLoggedIn
  {id}
  product={{ product: Product.MEMOTRON, env: "live" }}
  onLogin={(e) => setLoginState(e.detail.code)}
  onMount={() => {
    isBaseMounted = true;
  }}
>
  {#if !isDisableClipper}
    {#if !$toolbarState?.isOpen && !$toolbarState?.isHidden}
      <ToolbarOpener
        onclick={() => {
          toolbarState.toggle(true);
          clientStorage.remove(ClientStorageKey.GUEST_TOOLBAR_STATE);
        }}
      />
    {:else if $toolbarState?.isHidden !== true}
      {#if isLoggedIn}
        <Toolbar
          {contentType}
          {isSidePanelOpen}
          bind:isSnipActive
          bind:isDragging={isDraggingToolbar}
          onColor={onActivateColor}
          onSave={onSaveClick}
          onSaved={() => {
            feedbackPane.onPageSaved(`${contentTypeStr} already saved!`);
            feedbackPane.toggle({ isUserInitiated: true });
          }}
          onCollapse={() => toolbarState.toggle(false)}
          onClose={() => {
            toolbarState.toggleVisibility(true);
          }}
        />
      {/if}
      <!-- <div out:fade={{ duration: 150 }}> -->
      {#if loginState !== null}
        <LoginNotification
          isWithoutToolbarContext={!isLoggedIn}
          code={loginState}
          onLater={async () => {
            toolbarState.toggle(false);
            await clientStorage.set(ClientStorageKey.GUEST_TOOLBAR_STATE, {
              isCollapsed: true
            });
          }}
          onclick={() => {
            relayToBackgroundScript({
              event: ExtensionEvent.LOGIN
            });
            loginState = null;
          }}
        />
      {:else if $feedbackPane.isShown}
        <FeedbackPane
          bind:this={feedbackPaneRef}
          pageContentType={contentType}
        />
      {:else if $syncStore.isShowSyncPane}
        <SyncPane />
      {/if}
      {#if isLoggedIn}
        <TextClipper bind:this={textClipperRef} />
      {/if}
      {#if isSnipActive}
        <ScreenShot
          onSaved={() => {
            isSnipActive = false;
          }}
          onClose={() => {
            isSnipActive = false;
          }}
        />
      {/if}
    {/if}
    {#if isDraggingToolbar}
      {#if $toolbarState.position === Placement.Right}
        <ToolbarPlacementHintBlock position={Placement.Left} />
        <ToolbarPlacementHintBlock position={Placement.Bottom} />
      {:else if $toolbarState.position === Placement.Bottom}
        <ToolbarPlacementHintBlock position={Placement.Left} />
        <ToolbarPlacementHintBlock position={Placement.Right} />
      {:else if $toolbarState.position === Placement.Left}
        <ToolbarPlacementHintBlock position={Placement.Right} />
        <ToolbarPlacementHintBlock position={Placement.Bottom} />
      {/if}
    {/if}
    {#if $feedbackPane.modalClip}
      <ClipModal clip={$feedbackPane.modalClip} onAction={onMutationRelay} />
    {/if}
  {/if}
</ExtensionBaseLayer>
