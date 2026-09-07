<script lang="ts">
  import { properCase } from "@21n/shared-utils/text.utils";
  import { NodeType, type INode } from "@nucleum/features/memory/node/node.type";
  let { item }: { item: INode } = $props();
  function formatContentType(contentType: string) {
    if (
      contentType === NodeType.NODULAR_MARKDOWN ||
      contentType === NodeType.NON_NODULAR_MARKDOWN
    )
      return "Markdown";
    return properCase(contentType.replace(/_/g, " "));
  }
</script>

<span
  class="text-b4 text-fgs2 flex gap-2 px-2 py-0.25 border border-brs3 rounded-md"
>
  {formatContentType(item.contentType)}
</span>
