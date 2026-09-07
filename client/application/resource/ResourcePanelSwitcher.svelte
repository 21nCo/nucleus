<script lang="ts">
  import BoxSwitcher from "@21n/elements/switcher/BoxSwitcher.svelte";
  import BoxButton from "@21n/elements/button/BoxButton.svelte";
  import { slide } from "svelte/transition";
  import { cn } from "@21n/utils/ui.utils";
  import type { IToggleItem } from "@21n/elements/toggle/toggle.type";
  import type { Readable } from "svelte/store";
  import {
    AccessMode,
    type IResourcePageWithPanels
  } from "@nucleum/datafn/resource.type";
  import { Size } from "@21n/elements/size.enum";
  import { ButtonVariant } from "@21n/elements/button/button.type";
  import { appStore } from "@nucleum/stores/app.store";
  import view from "@nucleum/stores/view.store";
  import ContextMenuAction from "@21n/elements/contextMenu/ContextMenuAction.svelte";
  import type { IContextMenuItem } from "@21n/elements/contextMenu/context-menu.type";
  import { page } from "$app/stores";
  import Icon from "@21n/elements/Icon.svelte";
  import { AppSearchParam } from "@nucleum/stores/appStore.type";

  interface Props {
    resourceStore: Readable<IResourcePageWithPanels>;
    panels: IToggleItem[];
    isConstrainedWidth?: boolean;
    accessMode: AccessMode;
    onAction?: ((detail: IContextMenuItem["value"]) => void) | undefined;
    contextMenuResolver?:
      | (() =>
          | {
              group: string;
              items: IContextMenuItem[];
            }[]
          | undefined)
      | undefined;
  }

  let {
    resourceStore,
    panels,
    isConstrainedWidth = false,
    accessMode,
    onAction = undefined,
    contextMenuResolver = undefined
  }: Props = $props();
  const isMaximized = $derived(
    $page.url.searchParams.get(AppSearchParam.MAX) === "true"
  );

  function resolveContextMenu() {
    return contextMenuResolver?.() ?? [];
  }

  function handleContextMenuAction(event: CustomEvent<any>) {
    onAction?.(event.detail);
  }
</script>

<div
  class={cn("absolute bottom-0 inset-x-0 mx-auto w-fit z-10", {
    // "mb-3": $resourceStore.isInFocusMode,
    // "mb-4": !$resourceStore.isInFocusMode
  })}
>
  <div
    class={cn(
      "flex flex-col border- border-t border-x border-brs2 border-t--bgs1 shadow-sm rounded-t-md overflow-hidden"
    )}
  >
    <div
      class={cn("flex cw:flex-row-reverse  overflow-hidden", {
        "h-8 bg-bgs3": $resourceStore.isInFocusMode,
        "h-[50px] bg-bgs2": !$resourceStore.isInFocusMode,
        "rounded--md": !$resourceStore.isInEditMode,
        "rounded-t--md": $resourceStore.isInEditMode
      })}
    >
      {#if $resourceStore.isInFocusMode}
        <div
          class="flex h-full border-t border-brs2"
          in:slide={{ duration: 300, axis: "x" }}
        >
          <BoxButton
            icon="cross"
            label="Close"
            width="px-2"
            parentBgIndex={3}
            onclick={() => {
              $resourceStore.switchPanel();
            }}
          />
        </div>
      {:else}
        <div
          class="flex cw:border-l border-r border--t border-brs2 text-fgs2 mr-3"
        >
          <BoxButton
            label="Close"
            icon="cross"
            width="px-3"
            size={Size.sm}
            type={ButtonVariant.DANGER}
            parentBgIndex={2}
            onclick={() => {
              appStore.closeResource({ id: $resourceStore.id });
            }}
          />
        </div>
        <BoxSwitcher
          isTablist={true}
          isExpandOnActiveForIcon={true}
          options={panels}
          size={$view.isConstrainedWidth ? Size.sm : Size.md}
          isAccentColor={true}
          isActiveIndicatorOnTop={false}
          selected={$resourceStore.panel}
          onSelect={(e) => $resourceStore.switchPanel(e.detail)}
          isIconOnlyMode={$view.isConstrainedWidth}
        />
        <div
          class="flex items-center h-full cw:border-r border-l border-brs2 ml-3"
        >
          {#if isConstrainedWidth}
            <BoxButton
              icon="chevron-left"
              tooltip="Go back"
              width="px-3"
              parentBgIndex={2}
              onclick={() => {
                if (accessMode === AccessMode.FULL) {
                  appStore.toggleFullScreen(accessMode, $resourceStore.id);
                } else {
                  appStore.goBack();
                }
              }}
            />
          {:else}
            <div
              class="flex items-center bg--bgs3 border--t border-brs2 h-full"
            >
              <BoxButton
                icon={isMaximized ? "exitfullscreen" : "fullscreen"}
                tooltip={isMaximized ? "Minimize" : "Maximize"}
                width="px-3"
                parentBgIndex={2}
                onclick={() => {
                  appStore.toggleFullScreen(accessMode, $resourceStore.id);
                }}
              />
              {#if contextMenuResolver !== undefined}
                <div class="flex items-center h-full">
                  <ContextMenuAction
                    testId="resource-record-context-menu"
                    menuResolver={resolveContextMenu}
                    size={Size.lg}
                    isBoxed={true}
                    parentBgIndex={1}
                    class="h-full w-10"
                    id="resourcePanelContextMenu"
                    icon="more-outline-horizontal"
                    heading="Actions"
                    onAction={handleContextMenuAction}
                  />
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    </div>
    {#if $resourceStore.isInEditMode}
      <button
        class="flex gap-1 w-full h-11 min-h-11 bg-ass1 text-abg items-center justify-center rounded-b-md hover:brightness-110"
        onclick={() => {
          $resourceStore.closeEditMode();
        }}
      >
        <Icon icon="cross" size={Size.sm} class="text-abg" />
        <span> Close edit mode </span>
      </button>
    {/if}
  </div>
</div>
