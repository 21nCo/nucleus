<script lang="ts">
  import { type IActiveNodeStore } from "@nucleum/features/memory/node/node.store";
  import MediaContent from "@nucleum/features/memory/node/content/MediaContent.svelte";
  import { AccessMode } from "@nucleum/datafn/resource.type";
  import { NodeView } from "@nucleum/features/memory/node/node.type";
  import FullScreenCloseButton from "@21n/elements/button/FullScreenCloseButton.svelte";
  import NodeBirdView from "@nucleum/features/memory/node/birdView/NodeBirdView.svelte";
  import MediaNodeCwTitlePanel from "../MediaNodeCwTitlePanel.svelte";
  let {
    node,
    nodeView = NodeView.CONTENT,
    isConstrainedWidth = false
  }: {
    node: IActiveNodeStore;
    nodeView?: NodeView;
    isConstrainedWidth?: boolean;
  } = $props();
</script>

{#if $node}
  <div class="relative flex flex-col cw:flex-col-reverse w-full h-full">
    {#if nodeView === NodeView.BIRD}
      <NodeBirdView {node} />
    {:else}
      <MediaContent {node} {isConstrainedWidth} />
    {/if}
    {#if isConstrainedWidth}
      <MediaNodeCwTitlePanel {node} />
    {/if}
    {#if ($node.accessMode === AccessMode.SPLIT || $node.accessMode === AccessMode.FSPLIT) && !$node.panel}
      <FullScreenCloseButton accessMode={$node.accessMode} isFloat={true} />
    {/if}
  </div>
{/if}
