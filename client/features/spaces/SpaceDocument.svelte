<script lang="ts">
  import { generateUID } from "@21n/utils/utils";
  import NodeLoadingPulse from "@21n/elements/feedback/animations/NodeLoadingPulse.svelte";
  import Markdown from "@nucleum/components/markdown/Markdown.svelte";
  import NodularMarkdown from "@nucleum/components/markdown/NodularMarkdown.svelte";
  import type { INode } from "@nucleum/features/memory/node/node.type";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import { performApiCall } from "@21n/utils/network.utils";
  import type { IMarkdown } from "@nucleum/components/markdown/md.type";
  let {
    params,
    mdId = generateUID()
  }: {
    params: { spaceId: string; documentId: string };
    mdId?: string;
  } = $props();
  let document = $state<INode | undefined>(undefined);
  let md = $state<IMarkdown | undefined>(undefined);
  let isLoading = $state(true);
  let isValidDocIdNotPresent = $state(false);
  let requestVersion = 0;

  $effect(() => {
    const { spaceId, documentId } = params;
    if (!spaceId || !documentId) {
      isValidDocIdNotPresent = true;
      isLoading = false;
      document = undefined;
      return;
    }
    isValidDocIdNotPresent = false;
    isLoading = true;
    document = undefined;
    requestVersion += 1;
    void fetchDoc(spaceId, documentId, requestVersion);
  });

  async function fetchDoc(
    spaceId: string,
    documentId: string,
    version: number
  ) {
    const response = await performApiCall("space/n/doc", "POST", {
      spaceId,
      documentId
    });
    if (version !== requestVersion) return;
    if (response?.ok) {
      const result = await response.json();
      document = result.result;
    }
    isLoading = false;
  }
</script>

{#if isValidDocIdNotPresent}
  <EmptyStatusView
    mainText="Geez! We couldn't find that page."
    subText="Please try again after some time."
  />
{:else if !isLoading && document && "body" in document && document.body}
  <Markdown
    id={mdId}
    md={document.body}
    params={{
      isNodular: false,
      isReadOnly: true,
      actions: ["cop--y", "cop--yRaw"]
    }}
  />
{:else if !isLoading && document && "children" in document}
  <div class="h-full overflow-auto">
    <NodularMarkdown
      {mdId}
      node={document}
      {md}
      params={{ isReadOnly: true }}
    />
  </div>
{:else}
  <div class="w-full h-full pl-12 pt-4">
    <NodeLoadingPulse />
  </div>
{/if}
