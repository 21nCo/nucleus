<script lang="ts">
  import TableOfContents from "@nucleum/features/memory/markdown/TableOfContents.svelte";
  import Text from "@21n/elements/text/Text.svelte";
  import { TextStyle } from "@21n/types/text.enum";
  import { properCase } from "@21n/shared-utils/text.utils";
  import NodeHistoryPane from "@nucleum/features/memory/common/history/NodeHistoryPane.svelte";
  import NodeLinksPane from "@nucleum/features/memory/node/links/NodeLinksPane.svelte";
  import type { IActiveNodeStore } from "@nucleum/features/memory/node/node.store";
  import { ResourcePanelType } from "@21n/types/resource-panel.type";
  import NodeTracesPane from "@nucleum/features/memory/node/traces/NodeTracesPane.svelte";
  import NodeSidenotesPane from "@nucleum/features/memory/node/rightPanel/NodeSidenotesPane.svelte";
  import PropertiesPane from "@nucleum/features/collections/properties/PropertiesPane.svelte";
  import NodeMetadataPane from "@nucleum/features/memory/node/metadata/NodeMetadataPane.svelte";
  import Button from "@21n/elements/button/Button.svelte";
  import { Resource } from "@nucleum/datafn/resource.enum";
  let {
    node,
    mdId = undefined,
    renderingDetails = undefined
  }: {
    node: IActiveNodeStore;
    mdId?: string | undefined;
    renderingDetails?: any;
  } = $props();
</script>

<div
  class="flex flex-col h-full w-full overflow-y-auto items-start gap-3 cw:py-4 cw:px-0 p-4"
>
  <div class="w-full flex items-center justify-between gap-2">
    <Text
      content={properCase($node.panel)}
      style={TextStyle.PANEL_HEADING_SMALL}
    />
    <Button
      icon="x-circle"
      tooltip="Close"
      onclick={() => {
        node.switchPanel($node.defaultPanel);
      }}
    />
  </div>
  {#if $node.panel === ResourcePanelType.OUTLINE && mdId}
    <TableOfContents {mdId} />
  {:else if $node.panel === ResourcePanelType.LINKS}
    <NodeLinksPane {node} />
  {:else if $node.panel === ResourcePanelType.PROPERTIES}
    <PropertiesPane item={node} resource={Resource.node} />
  {:else if $node.panel === ResourcePanelType.BOOKMARKS}
    <NodeTracesPane {node} />
  {:else if $node.panel === ResourcePanelType.ACTIVITY}
    <NodeHistoryPane {node} />
  {:else if $node.panel === ResourcePanelType.SIDENOTES}
    <NodeSidenotesPane {node} />
  {:else if $node.panel === ResourcePanelType.METADATA}
    <NodeMetadataPane {node} {renderingDetails} />
  {/if}
</div>
