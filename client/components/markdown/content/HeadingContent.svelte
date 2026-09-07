<script lang="ts">
  import type { NodeType } from "@nucleum/features/memory/node/node.type";
  import type { IRecordId } from "@21n/types/data.type";
  import type { MdStoreType } from "@nucleum/components/markdown/markdown.store";
  import TextContent from "@nucleum/components/markdown/content/TextContent.svelte";
  let {
    id,
    text = $bindable(""),
    contentType,
    mdStore,
    isFocusing = $bindable(false),
    onUpdate = undefined
  }: {
    id: IRecordId;
    text?: string;
    contentType: NodeType;
    mdStore: MdStoreType;
    isFocusing?: boolean;
    onUpdate?: ((event: CustomEvent<string>) => void) | undefined;
  } = $props();
</script>

<TextContent bind:text bind:isFocusing {id} {contentType} {mdStore} {onUpdate} />
