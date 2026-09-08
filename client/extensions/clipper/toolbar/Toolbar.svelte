<script lang="ts">
  import type { IHighlighter } from "@nucleum/features/memory/common/highlighters/highlight.type";
  import { onMount } from "svelte";
  import HightlightColorItem from "@nucleum/features/memory/common/highlighters/HightlightColorItem.svelte";
  import Button from "@21n/elements/button/Button.svelte";
  import Divider from "@21n/elements/Divider.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import { Placement, Orientation } from "@21n/elements/direction.enum";
  import Icon from "@21n/elements/Icon.svelte";
  import { webpage, toolbarState, syncStore } from "@nucleum/extensions/clipper/contentScripts/store";
  import Toggle from "@21n/elements/toggle/Toggle.svelte";
  import { Size } from "@21n/elements/size.enum";
  import {
    saveOnlyPages,
    screenShotOnlyPages
  } from "@nucleum/features/memory/common/urlMap";
  import { NodeType } from "@nucleum/schema/legacy/node-type.enum";
  import { highlightStore } from "@nucleum/features/memory/common/highlighters/highlight.store";
  import { ExtensionEvent } from "@nucleum/extensions/extension.type";
  import { relayToBackgroundScript } from "@21n/utils/extension.utils";
  import { fly, scale } from "svelte/transition";
  import { tooltip } from "@nucleum/actions/popover.action";
  import { hoverable } from "@nucleum/actions/hover.action";
  import { resolveContentTypeString } from "@nucleum/extensions/clipper/clipper.utils";

  let {
    activeHighlighter = $bindable<string | null>(null),
    isSnipActive = $bindable(false),
    contentType = NodeType.WEB_PAGE,
    isDragging = $bindable(false),
    isSidePanelOpen = false,
    onColor = undefined,
    onSave = undefined,
    onSaved = undefined,
    onCollapse = undefined,
    onClose = undefined
  }: {
    activeHighlighter?: string | null;
    isSnipActive?: boolean;
    contentType?: NodeType;
    isDragging?: boolean;
    isSidePanelOpen?: boolean;
    onColor?: ((event: CustomEvent<IHighlighter | number>) => void) | undefined;
    onSave?: (() => void) | undefined;
    onSaved?: (() => void) | undefined;
    onCollapse?: (() => void) | undefined;
    onClose?: (() => void) | undefined;
  } = $props();
  let isHovering = false;
  let isSidePanelAvailable = true;
  let isAutoHighlighterExpanded = false;
  const contentTypeStr = $derived(resolveContentTypeString(contentType));
  const isScreenShotOnly = $derived(
    screenShotOnlyPages.some((regex) => regex.test($webpage.url))
  );
  const isSaveOnly = $derived(
    saveOnlyPages.some((regex) => regex.test($webpage.url))
  );

  if ($toolbarState.position === undefined) {
    toolbarState.changePosition(Placement.Right);
  }

  const tooltipOptions = $derived({
    placement:
      $toolbarState.position === Placement.Bottom
        ? Placement.TopCenter
        : Placement.Left,
    isUseAbsolutePositioning: true,
    offsetInPx: 8
  });
  const buttonParams = $derived({
    tooltipOptions
  });

  onMount(() => {
    setTimeout(() => {
      const arcBrowserCssVal = getComputedStyle(
        document.documentElement
      ).getPropertyValue("--arc-palette-title");
      isSidePanelAvailable = arcBrowserCssVal ? false : true;
    }, 2000);
  });

  function toggleAutoHighligher() {
    if (!isAutoHighlighterExpanded) {
      activeHighlighter = null;
      onColor?.(new CustomEvent<IHighlighter | number>("color", { detail: 0 }));
    } else {
      resetAll("highlighter");
      const highlighter = $highlightStore.highlighters[0];
      if (!highlighter) return;
      onColor?.(
        new CustomEvent<IHighlighter | number>("color", {
          detail: highlighter
        })
      );
      activeHighlighter = highlighter.id;
    }
  }

  function resetAll(except: string) {
    if (except !== "highlighter") {
      isAutoHighlighterExpanded = false;
    }
    if (except !== "snip") {
      isSnipActive = false;
    }
  }

  function resolveFlyParams(position: Placement) {
    if (position === Placement.Right) {
      return {
        x: 10,
        duration: 300
      };
    } else if (position === Placement.Left) {
      return {
        x: -10,
        duration: 300
      };
    } else if (position === Placement.Bottom) {
      return {
        y: 10,
        duration: 300
      };
    }
  }
</script>

<button
  class={cn(
    "fixed bg-bgs1 border border-brs3 rounded-full min-h-fit min-w-fit flex gap-4 justify-center items-center shadow-md",
    {
      "w-11 2k:w-12 inset-y-0 my-auto flex-col py-3":
        $toolbarState.position === Placement.Right ||
        $toolbarState.position === Placement.Left,
      "right-0 mr-4 2k:mr-6": $toolbarState.position === Placement.Right,
      "left-0 ml-4 2k:ml-6": $toolbarState.position === Placement.Left,
      "h-12 w-fit inset-x-0 mx-auto bottom-0 mb-4 px-3":
        $toolbarState.position === Placement.Bottom
    }
  )}
  draggable="true"
  ondragstart={() => (isDragging = true)}
  ondragend={() => (isDragging = false)}
  use:hoverable={{
    onHover: (e) => {
      isHovering = e;
    }
  }}
  in:fly={resolveFlyParams($toolbarState.position)}
  out:scale
>
  {#if !isScreenShotOnly && !$syncStore.id}
    {#if $webpage?.id}
      <button
        class="flex border border-transparent outline-dotted outline-fgs2 hover:outline-aps1 rounded-full"
        use:tooltip={{
          text: "This page is already saved. Click to link",
          direction: Placement.Left
        }}
        onclick={() => {
          onSaved?.();
        }}
      >
        <Icon icon="check-circle" class="fill-fgs2" isFilled={true} />
      </button>
    {:else}
      <button
        onclick={() => {
          onSave?.();
        }}
        use:tooltip={{
          text: `**Save ${contentTypeStr.toLowerCase()}** (Cmd/Ctrl + J)`,
          direction: Placement.Left
        }}
        class="p-1 hover:bg-bgs2 rounded-md flex justify-center items-center"
      >
        <Icon icon="mynaui:plus-hexagon" class="text-fgs2" />
      </button>
    {/if}
  {:else if $syncStore.id}
    <Toggle
      icon="sync"
      tooltip="Sync"
      size={Size.sm}
      bind:on={$syncStore.isShowSyncPane}
      {tooltipOptions}
    />
  {/if}
  <Toggle
    icon="crop"
    tooltip="**Snip** (Cmd/Ctrl + Shift + I)"
    bgSize={Size.sm}
    bind:on={isSnipActive}
    {tooltipOptions}
    onChange={() => resetAll("snip")}
  />
  {#if !isScreenShotOnly && !isSaveOnly}
    <div
      class={cn("flex gap-3 items-center", {
        "flex-col w-full":
          $toolbarState.position === Placement.Right ||
          $toolbarState.position === Placement.Left,
        "flex-row h-full": $toolbarState.position === Placement.Bottom
      })}
    >
      <Divider
        orientation={$toolbarState.position === Placement.Bottom
          ? Orientation.Vertical
          : Orientation.Horizontal}
      />
      <Toggle
        icon="highlight"
        tooltip="Auto highlighter"
        bgSize={Size.sm}
        bind:on={isAutoHighlighterExpanded}
        {tooltipOptions}
        onChange={toggleAutoHighligher}
      />
      {#if isAutoHighlighterExpanded}
        <div
          class={cn("flex gap-3 items-center justify-center", {
            "flex-col w-full":
              $toolbarState.position === Placement.Right ||
              $toolbarState.position === Placement.Left,
            "flex-row h-full": $toolbarState.position === Placement.Bottom
          })}
        >
          {#each $highlightStore.highlighters as highlighter}
            <HightlightColorItem
              {highlighter}
              isActive={highlighter.id === activeHighlighter}
              onClick={() => {
                activeHighlighter = highlighter.id;
                onColor?.(
                  new CustomEvent<IHighlighter | number>("color", {
                    detail: highlighter
                  })
                );
              }}
            />
          {/each}
        </div>
      {/if}
      <Divider
        orientation={$toolbarState.position === Placement.Bottom
          ? Orientation.Vertical
          : Orientation.Horizontal}
      />
    </div>
  {/if}
  {#if isSidePanelAvailable && !isSidePanelOpen}
    <Button
      icon="hugeicons:sidebar-right"
      tooltip="Open Side panel"
      {...buttonParams}
      onclick={() =>
        relayToBackgroundScript({
          event: ExtensionEvent.RUN,
          data: { action: ExtensionEvent.TOGGLE_SIDEPANEL }
        })}
    />
  {/if}
  <button
    onclick={() => {
      onCollapse?.();
    }}
    use:tooltip={{
      text: "**Minimize toolbar** (Alt + M)",
      direction: Placement.Left
    }}
    class="p-1 hover:bg-bgs2 rounded-md flex justify-center items-center"
  >
    <Icon icon="minus-circle" class="text-ass1" />
  </button>
  <button
    onclick={() => {
      onClose?.();
    }}
    use:tooltip={{
      text: "**Hide toolbar** (Alt + X)",
      direction: Placement.Left
    }}
    class="p-1 hover:bg-bgs2 rounded-md flex justify-center items-center"
  >
    <Icon icon="x-circle" class="text-ars1" />
  </button>
  <button
    use:tooltip={{
      disabled: isDragging,
      text: "Drag to move toolbar",
      direction: Placement.Left
    }}
    class="flex justify-center items-center"
  >
    <Icon icon="rearrange-horizontal" />
  </button>
</button>
