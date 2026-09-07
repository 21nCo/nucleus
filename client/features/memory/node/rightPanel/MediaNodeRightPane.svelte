<script lang="ts">
  import { cn } from "@21n/utils/ui.utils";
  import type { IActiveNodeStore } from "@nucleum/features/memory/node/node.store";
  import { NodeType } from "@nucleum/features/memory/node/node.type";
  import { ResourcePanelType } from "@nucleum/components/resource/resourcePanel.type";
  import NodeRightPaneContent from "@nucleum/features/memory/node/rightPanel/NodeRightPaneContent.svelte";
  import NodeDefaultRightPane from "./NodeDefaultRightPane.svelte";
  import { fly } from "svelte/transition";
  import { quadInOut } from "svelte/easing";
  let {
    node,
    renderingDetails = undefined,
    isConstrainedWidth = false
  }: {
    node: IActiveNodeStore;
    renderingDetails?: any;
    isConstrainedWidth?: boolean;
  } = $props();
  const typesWithLargerContent = [
    NodeType.PDF,
    NodeType.YOUTUBE_VIDEO,
    NodeType.VIDEO,
    NodeType.IMAGE,
    NodeType.AUDIO,
    NodeType.GIST,
    NodeType.WEB_SCREENSHOT,
    NodeType.WEB_VIDEO_BOOKMARK
  ];
  const panelsWithLargerContent = [
    ResourcePanelType.SIDENOTES,
    ResourcePanelType.LINKS,
    ResourcePanelType.ACTIVITY
  ];
  let isExpanded = $derived(
    ((!$node.panel || $node.panel === ResourcePanelType.OVERVIEW) &&
      !typesWithLargerContent.includes($node.contentType)) ||
      ($node.panel &&
        panelsWithLargerContent.includes($node.panel as ResourcePanelType))
  );
</script>

<aside
  class={cn(
    "flex flex-col h-full gap-4 justify-center items-center mo:w-full cw:min-w-full min-w-96 w--80 2k:w--96 transition-all duration-300",
    {
      "w-3/10": !isExpanded,
      "w-1/2": isExpanded,
      "w-full px-3": isConstrainedWidth
    }
  )}
  in:fly={{ x: 10, duration: 300, easing: quadInOut }}
>
  {#if $node.panel && $node.panel !== ResourcePanelType.OVERVIEW}
    <NodeRightPaneContent {node} {renderingDetails} />
  {:else}
    <NodeDefaultRightPane {node} />
  {/if}
</aside>
