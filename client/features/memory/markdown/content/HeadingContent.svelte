<script lang="ts">
  import type { NodeType } from "@nucleum/schema/legacy/node-type.enum";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import type { MdStoreType } from "@nucleum/features/memory/markdown/markdown.store";
  import TextContent from "@nucleum/features/memory/markdown/content/TextContent.svelte";
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
