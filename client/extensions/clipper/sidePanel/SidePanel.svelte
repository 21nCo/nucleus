<script lang="ts">
  import "@nucleum/client/app.css";
  import ClipsPane from "@nucleum/extensions/clipper/sidePanel/clips/ClipsPane.svelte";
  import { ExtensionEvent } from "@nucleum/extensions/extension.type";
  import { ClipperExtensionEvent } from "@nucleum/features/memory/common/clip.type";
  import { onDestroy, onMount } from "svelte";
  import { logger } from "@nucleum/client/runtime/logging/logger";
  import {
    openAppPath,
    relayToContentScript
  } from "@21n/utils/extension.utils";
  import type { IClip } from "@nucleum/features/memory/node/node.type";
  import ExtensionBaseLayer from "@nucleum/extensions/ExtensionBaseLayer.svelte";
  import Button from "@21n/elements/button/Button.svelte";
  import { Size } from "@21n/elements/size.enum";
  import { ButtonStyle, ButtonVariant } from "@21n/elements/button/button.type";
  import account from "@nucleum/stores/account.store";
  import { resolveToken } from "@21n/utils/account.utils";
  import { getPort } from "@plasmohq/messaging/port";
  import PanelSwitcher from "@21n/elements/switcher/PanelSwitcher.svelte";
  import { BarStyle, PanelSwitcherStyle } from "@21n/elements/switcher/switcher.enum";
  import InlineMarkdownTextInput from "@nucleum/features/memory/markdown/content/InlineMarkdownTextInput.svelte";
  import { extensionDatafn } from "@nucleum/extensions/extension.store";
  import {
    blankUrls,
    memotronUrlsList,
    sidePanelUnavailableUrlsList
  } from "@nucleum/features/memory/common/urlMap";
  import ComingSoonView from "@21n/elements/ComingSoonView.svelte";
  import Icon from "@21n/elements/Icon.svelte";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import { Placement } from "@21n/elements/direction.enum";
  import {
    OptionSelectorStyle,
    type ISelectItem
  } from "@21n/elements/select/select.type";
  import InlineFeedbackText from "@nucleum/extensions/clipper/InlineFeedbackText.svelte";
  import { AlertType, type IInlineStatus } from "@nucleum/stores/notifications/notification.type";
  import { cn } from "@21n/utils/ui.utils";
  import { fly } from "svelte/transition";
  import { Extension, Product } from "@nucleum/client/config/product.type";
  import ExtensionHelp from "@nucleum/extensions/shared/ExtensionHelp.svelte";
  import { DatafnExtensionMethod } from "@nucleum/extensions/extension.store";
  import SidePanelCollections from "@nucleum/extensions/clipper/sidePanel/collectionsOnClipper/SidePanelCollections.svelte";
  import OptionSelector from "@21n/elements/select/OptionSelector.svelte";
  import { clientStorage } from "@nucleum/persistence/persistence.utils";
  import { ClientStorageKey } from "@nucleum/persistence/persistence.type";
  import InlineSyncingFeedbackBase from "@21n/elements/feedback/InlineSyncingFeedbackBase.svelte";
  import { SidePanelPageType } from "@nucleum/extensions/clipper/sidePanel/sidePanel.type";
  import {
    resolveContentTypeForUrl,
    resolveContentTypeString
  } from "@nucleum/extensions/clipper/clipper.utils";
  import { parse } from "@21n/shared-utils/json.utils";
  import { ExtensionStore } from "@nucleum/extensions/extension.store";

  let mainPanel: "page" | "collections" = "page";
  let mode: "clips" | "notes" | "history" = "clips";
  let title = "";
  let currentUrl = "";
  let isPageSaved = false;
  let clips: IClip[] = [];
  let notes = "";
  let feedback: IInlineStatus | undefined = undefined;
  let isLoggedIn = false;
  let refreshId: number = new Date().getTime();
  let collectionRefreshId = new Date().getTime();
  let isBlankPage = false;
  let pageType: SidePanelPageType = SidePanelPageType.DEFAULT;
  let isToolbarHidden = false;
  let isMounted = false;
  let isShowHelp = false;
  let isResyncing = false;
  let isBootupSyncInProgress = false;
  let isSaving = false;
  let feedbackTimeoutId: number | undefined = undefined;

  const tooltipOptions = {
    placement: Placement.TopCenter
  };
  const mainPanels: ISelectItem[] = [
    {
      label: "Current page",
      value: "page"
    },
    {
      label: "Collections",
      value: "collections"
    }
  ];

  const panels: ISelectItem[] = [
    // {
    //   label: "Ask",
    //   value: "ask",
    //   icon: "sparkle"
    // },
    {
      label: "Clips",
      value: "clips",
      icon: "bookmark"
    },
    {
      label: "Page notes",
      value: "notes",
      icon: "note"
    }
    // {
    //   label: "History",
    //   value: "history",
    //   icon: "clock"
    // }
  ];
  const channel = getPort("channel");
  const port = chrome.runtime.connect({ name: "sidePanel" });

  function resolveCurrentContentType() {
    return resolveContentTypeForUrl(currentUrl);
  }

  function resolveCurrentContentTypeString() {
    return resolveContentTypeString(resolveCurrentContentType());
  }

  async function onSavePageClick() {
    if (isSaving) return;
    isSaving = true;
    feedback = {
      type: AlertType.PROGRESS,
      message: `Saving ${resolveCurrentContentTypeString().toLowerCase()}...`
    };
    const result = await relayToContentScript({
      event: ClipperExtensionEvent.SAVE_WEBPAGE
    });
    logger.log({ at: "onSavePageClick", result });
    if (result?.status === "error") {
      if (result.message === "Page already saved" && result.pageId) {
        isPageSaved = true;
        feedback = {
          type: AlertType.SUCCESS,
          message: "Page already saved!"
        };
      } else {
        feedback = {
          type: AlertType.ERROR,
          message: result.message || "Failed to save page"
        };
      }
    } else if (result?.status === "success") {
      isPageSaved = true;
      feedback = {
        type: AlertType.SUCCESS,
        message: `${resolveCurrentContentTypeString()} saved!`
      };
      await relayToContentScript({
        event: ExtensionEvent.PAGE_STATE_TRIGGER
      });
    } else {
      feedback = {
        type: AlertType.ERROR,
        message: "Failed to save page"
      };
    }
    isSaving = false;
    if (feedbackTimeoutId !== undefined) {
      clearTimeout(feedbackTimeoutId);
    }
    feedbackTimeoutId = window.setTimeout(() => {
      feedback = undefined;
      feedbackTimeoutId = undefined;
    }, 3000);
  }
  const messageListener = (message: any, sender: any, sendResponse: any) => {
    if (message.event === ExtensionEvent.PAGE_STATE) {
      logger.log({ at: "onMessage - PAGE_STATE", message });
      refreshState(message.data.page);
      refreshSyncStatus();
      isToolbarHidden = message.data.toolbar.isHidden;
      sendResponse({ status: "success", message: "State refreshed" });
    } else if (message.event === ClipperExtensionEvent.CLIPS_CHANGED) {
      //TODO testing
      logger.log({ at: "onMessage - Clips changed", message });
      clips = message.data;
      sendResponse({ status: "success", message: "Clips updated" });
    } else if (
      message.event === ClipperExtensionEvent.ON_COLLECTION_LINK_CHANGES
    ) {
      logger.log({ at: "onMessage - Collection link changes", message });
      collectionRefreshId = new Date().getTime();
      sendResponse({ status: "success", message: "Collection link changes" });
    } else if (message.event === ExtensionEvent.BOOTUP) {
      logger.log({ at: "onMessage - BOOTUP", message });
      onBootup();
    } else if (message.event === ExtensionEvent.MUTATION) {
      logger.log({ at: "SidePanel - MUTATION", message });
      refreshSyncStatus();
    } else if (message.event === ExtensionEvent.TOKEN_NOT_FOUND) {
      isLoggedIn = false;
    } else if (message.event === ExtensionEvent.TAB_UPDATE) {
      relayToContentScript({ event: ExtensionEvent.SIDEPANEL_OPENED });
      const tab = message.tab;
      if (tab.url && blankUrls.some((x) => x.test(tab.url))) {
        handleNewTabCase(tab);
        return;
      } else {
        isBlankPage = false;
      }
    }
    return true;
  };

  function onChannelMessage(msg: any) {
    logger.log({ at: "SidePanel - channel listener", msg });
  }

  onMount(async () => {
    sendPing();
    channel.onMessage.addListener(onChannelMessage);
    if (messageListener) {
      chrome.runtime.onMessage.addListener(messageListener);
    }
    logger.log({ at: "onMount - SidePanel" });
    const tab = await chrome.storage.local.get("tab");
    title = tab.tab.title;
    currentUrl = tab.tab.url;
    if (tab.tab.url && blankUrls.some((x) => x.test(tab.tab.url))) {
      handleNewTabCase(tab.tab);
      return;
    }
    await onBootup();
  });

  onDestroy(() => {
    channel.onMessage.removeListener(onChannelMessage);
    if (messageListener) {
      chrome.runtime.onMessage.removeListener(messageListener);
    }
    port?.disconnect();
    if (feedbackTimeoutId !== undefined) {
      clearTimeout(feedbackTimeoutId);
    }
  });

  function sendPing() {
    port?.postMessage({ action: "ping" });
  }

  function handleNewTabCase(tab: chrome.tabs.Tab) {
    isBlankPage = true;
    refreshState({
      url: tab.url,
      title: tab.title,
      notes: ""
    });
    refreshSyncStatus();
  }

  //TODO - maintain a store with the data.
  async function refreshState(data: any) {
    logger.log({ at: "SidePanel - refreshState", data });
    if (!data) return;
    if (data.id) isPageSaved = true;
    else isPageSaved = false;
    if (data.clips) clips = data.clips;
    if (data.title) title = data.title;
    if (data.notes) notes = data.notes;
    else notes = "";
    if (data.url) {
      currentUrl = data.url;
      const isNotAvailable = sidePanelUnavailableUrlsList.some((x) =>
        x.test(data.url)
      );
      if (memotronUrlsList.some((x) => x.test(data.url))) {
        pageType = SidePanelPageType.MEMOTRON;
      } else if (isNotAvailable) {
        pageType = SidePanelPageType.UNSUPPORTED;
      } else {
        pageType = SidePanelPageType.DEFAULT;
      }
    }
    const token = await resolveToken();
    logger.log({ at: "SidePanel - refreshState", token });
    if (token) {
      if (!$account) account.init();
      isLoggedIn = true;
    } else {
      isLoggedIn = false;
    }
    refreshId = new Date().getTime();
  }

  async function onNotesChange(e: CustomEvent) {
    feedback = {
      type: AlertType.PROGRESS,
      message: "Saving..."
    };
    const result = await relayToContentScript({
      event: ClipperExtensionEvent.MUTATION_RELAY,
      data: {
        action: "webpageNotes",
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
    setTimeout(() => {
      feedback = {
        type: AlertType.SUCCESS,
        message: "Notes saved!"
      };
    }, 100);
  }

  async function onBootup() {
    logger.log({ at: "SidePanel - onBootup" });
    await relayToContentScript({
      event: ExtensionEvent.PAGE_STATE_TRIGGER
    });
    await refreshSyncStatus();
  }

  async function refreshSyncStatus() {
    try {
      const bootupStatus = await clientStorage.get(
        ClientStorageKey.EXTENSION_BOOTUP
      );
      const parsed = bootupStatus ? parse(bootupStatus) : { inProgress: false };
      console.log({ bootupStatus, parsed });
      isBootupSyncInProgress = parsed.inProgress;
    } catch (e) {
      logger.error({ at: "SidePanel - refreshSyncStatus", error: e });
    }
  }

  function resolveEmptyStatusViewParams(
    pageTypeValue: SidePanelPageType,
    isBlankPageValue: boolean
  ) {
    if (isBlankPageValue) {
      return {
        mainText: "New taabbbb!",
        subText: "Start browsing to save clips."
      };
    } else if (pageTypeValue === SidePanelPageType.MEMOTRON) {
      return {
        mainText: "Hello from the other side of Memotron👋.",
        subText: ""
      };
    } else {
      return {
        mainText: "Clips cannot be shown here for this web page.",
        subText:
          "Some web pages are not supported for clipping / showing clips in the side panel.",
        isNotAvailableContext: true
      };
    }
  }

  async function resync() {
    isResyncing = true;
    const result = await extensionDatafn({
      method: DatafnExtensionMethod.PULL,
      args: {
        isReturnCount: true
      }
    });
    if (result?.counts) {
      await extensionDatafn({
        method: DatafnExtensionMethod.RECONCILE,
        args: { counts: result.counts }
      });
    }
    isResyncing = false;
  }
</script>

<!-- svelte-ignore missing-declaration -->
<ExtensionBaseLayer
  id="sidePanel"
  onMount={() => (isMounted = true)}
  extention={Extension.MEMOTRON_CLIPPER}
  product={{ product: Product.MEMOTRON, env: "live" }}
>
  {#if isMounted}
    <div class="w-full h-screen">
      <div class="flex flex-col w-full h-full bg-bgs1 text-b2 text-fgs1 pt-1">
        {#if isResyncing}
          <EmptyStatusView
            isLoadingState={true}
            loadingText="Resyncing data..."
          />
        {:else if isShowHelp}
          <ExtensionHelp
            onClose={() => (isShowHelp = false)}
            onResync={resync}
          />
        {:else if isLoggedIn}
          <PanelSwitcher
            items={mainPanels}
            bind:value={mainPanel}
            style={PanelSwitcherStyle.BAR}
            isExpandToFullWidth={true}
            onSwitch={() => {
              refreshSyncStatus();
            }}
          />
          {#if isBootupSyncInProgress}
            <div class="flex w-full justify-center items-center p-3">
              <InlineSyncingFeedbackBase isSyncing={true} />
            </div>
          {/if}
          {#if isToolbarHidden}
            <div class="flex bg-bgs2 p-3 w-full">
              <div
                class="flex justify-between items-center w-full p-2 border border-dashed border-fgs4 rounded-md"
                transition:fly={{ y: -10, duration: 300 }}
              >
                <span> Toolbar is hidden </span>
                <Button
                  label="Show toolbar"
                  icon="show"
                  size={Size.sm}
                  isPreventMinWidth={true}
                  onclick={() => {
                    relayToContentScript({
                      event: ClipperExtensionEvent.TOGGLE_TOOLBAR_VISIBILITY
                    });
                  }}
                />
              </div>
            </div>
          {/if}
          {#if mainPanel === "page"}
            <header
              class="flex w-full justify-between items-center min-h-16 h-16 px-3 bg-bgs2 border-b border-brs3 gap-1"
            >
              <span class=" max-w-8/12 truncate">{title}</span>
              {#if !isBlankPage}
                <span>
                  {#if isPageSaved}
                    <div
                      class="min-w-fit bg-bgs2 border rounded-md px-3 py-1.5 border-brs3 flex items-center gap-2"
                    >
                      <Icon icon="check" size={Size.sm} />
                      <span>Saved</span>
                    </div>
                  {:else}
                    <button
                      class="min-w-fit bg-aps1 text-bgs1 px-3 py-1.5 rounded-md whitespace-nowrap"
                      onclick={onSavePageClick}
                    >
                      Save {resolveCurrentContentTypeString().toLowerCase()}</button
                    >
                  {/if}
                </span>
              {/if}
            </header>
            {#if !isBlankPage}
              <div class="flex w-full justify-center py-4">
                <div class="flex w-full px-3 gap-2">
                  <div>
                    <OptionSelector
                      options={panels}
                      bind:selected={mode}
                      style={OptionSelectorStyle.ICON}
                      size={Size.sm}
                      isExpandOnActiveForIcon={true}
                    />
                  </div>
                  <!-- TODO - later when all options are present - move this feedback to the bottom of the page and remove div wrapper around option selector to make it full width -->
                  <div
                    class="h-full flex items-center whitespace-nowrap text-b3 text-fgs2"
                  >
                    <InlineFeedbackText bind:feedback />
                  </div>
                </div>
              </div>
            {/if}
            <div class="flex w-full flex-1 overflow-y-auto">
              {#if mode === "clips" && pageType !== SidePanelPageType.UNSUPPORTED}
                <div class="flex flex-col gap-2 p-4 h-full w-full">
                  {#key clips}
                    <ClipsPane
                      {clips}
                      isMemotronPage={pageType === SidePanelPageType.MEMOTRON}
                    />
                  {/key}
                </div>
              {:else if mode === "notes"}
                <div
                  class={cn(
                    "flex w-full justify-center rounded-md mx-2 mb-2 p-2 overflow-y-auto",
                    {
                      "bg-bgs2": isPageSaved
                    }
                  )}
                >
                  {#if isPageSaved}
                    {#key refreshId}
                      <InlineMarkdownTextInput
                        placeholder="Add notes"
                        bind:content={notes}
                        onDebouncedChange={onNotesChange}
                      />
                    {/key}
                  {:else}
                    <EmptyStatusView
                      mainText="Page not saved yet."
                      subText="Save this page to add notes or refresh the page to try again."
                    />
                  {/if}
                </div>
              {:else if pageType === SidePanelPageType.UNSUPPORTED}
                <div class="flex w-full flex-1">
                  <EmptyStatusView
                    {...resolveEmptyStatusViewParams(pageType, isBlankPage)}
                  />
                </div>
              {:else}
                <!-- TODO -->
              {/if}
            </div>
          {:else if mainPanel === "collections"}
            <div
              class="flex flex-col w-full flex-grow items-center justify-center"
            >
              {#key collectionRefreshId}
                <SidePanelCollections {currentUrl} />
              {/key}
            </div>
          {/if}
        {:else}
          <div class="flex w-full flex-1">
            <div
              class="flex flex-col h-full w-full justify-center items-center gap-4"
            >
              <span> Please login to continue. </span>
              <Button
                label="Login"
                icon="log-in"
                type={ButtonVariant.PRIMARY}
                onclick={() => openAppPath("signup?ext=true")}
              />
            </div>
          </div>
        {/if}
        <footer
          class="h-14 min-h-14 border-t border-t-brs3 flex justify-between items-center px-3"
        >
          <span class="flex items-center gap-2">
            <!-- <Button
            tooltip="Settings"
            {tooltipOptions}
            icon="gear"
            size={Size.sm}
            style={ButtonStyle.OUTLINED}
          /> -->
            <Button
              tooltip="Go to app"
              {tooltipOptions}
              icon="hexagon"
              size={Size.sm}
              style={ButtonStyle.OUTLINED}
              onclick={() => openAppPath("")}
            />
            <Button
              tooltip="Help center"
              {tooltipOptions}
              icon="question"
              size={Size.sm}
              type={isShowHelp
                ? ButtonVariant.PRIMARY
                : ButtonVariant.SECONDARY}
              style={ButtonStyle.OUTLINED}
              onclick={() => (isShowHelp = !isShowHelp)}
            />
            {#if isLoggedIn}
              <Button
                tooltip="Logout"
                {tooltipOptions}
                icon="log-out"
                id="logout"
                size={Size.sm}
                type={ButtonVariant.DANGER}
                style={ButtonStyle.OUTLINED}
                onclick={() => {
                  account.signOut();
                  clips = [];
                  isPageSaved = false;
                  relayToContentScript({
                    event: ExtensionEvent.LOGOUT
                  });
                  isLoggedIn = false;
                }}
              />
            {:else if !isLoggedIn}
              <Button
                tooltip="Login"
                icon="log-in"
                type={ButtonVariant.PRIMARY}
                size={Size.sm}
                style={ButtonStyle.OUTLINED}
                onclick={() => openAppPath("signup?ext=true")}
              />
            {/if}
          </span>
          {#if isLoggedIn}
            <span>
              {$account?.userInfo?.nickName ?? "Unknown user"}
            </span>
          {:else}
            <span> Not logged in. </span>
          {/if}
        </footer>
      </div>
    </div>
  {/if}
</ExtensionBaseLayer>
<svelte:window
  onfocus={() => {
    refreshSyncStatus();
  }}
/>
