<script lang="ts">
  import { ResourcePanelType } from "@21n/types/resource-panel.type";
  import { cn } from "@21n/utils/ui.utils";
  import type { IActiveNodeStore } from "@nucleum/features/memory/node/node.store";
  import NodeRightPanelContent from "@nucleum/features/memory/node/rightPanel/NodeRightPaneContent.svelte";
  import { AccessMode } from "@nucleum/datafn/resource.type";
  import view from "@nucleum/stores/view.store";
  import { Display } from "@21n/types/view.type";
  let {
    node,
    mdId,
    nodePageVariant = "v2"
  }: {
    node: IActiveNodeStore;
    mdId: string;
    nodePageVariant?: "v1" | "v2";
  } = $props();

  let isValidPane = $derived(
    $node.panel &&
      $node.panel !== ResourcePanelType.NONE &&
      $node.panel !== ResourcePanelType.DEFAULT
  );
</script>

<aside
  class={cn("flex justify--end gap-2 h-full overflow-auto shrink-0", {
    "mr-2 mb-2 bg-bgs2 rounded-md": nodePageVariant === "v1",
    "max-w-[28rem] w-[28rem]":
      $node.accessMode !== AccessMode.FULL && isValidPane,
    "min-w-[28rem] cw:border-none border-l border-l-brs2": isValidPane,
    "w-full":
      $node.accessMode === AccessMode.FULL &&
      !$node.config?.isWidened &&
      isValidPane &&
      $view.display === Display.TK
  })}
>
  {#if isValidPane}
    <NodeRightPanelContent {node} {mdId} />
  {/if}
</aside>
