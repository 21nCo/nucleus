<script lang="ts">
  import type { ICodeBlockBody } from "@nucleum/features/memory/markdown/md.type";
  import type { MdStoreType } from "@nucleum/features/memory/markdown/markdown.store";
  // import CodeContentUsingMonaco from "@nucleum/components/markdown/content/CodeContentUsingMonaco.svelte";
  import CodeContentUsingHighlight from "@nucleum/features/memory/markdown/content/CodeContentUsingHighlight.svelte";

  let {
    mdStore,
    body,
    useMonacoEditor = false,
    onUpdate = undefined,
    onDelete = undefined
  }: {
    mdStore: MdStoreType;
    body: ICodeBlockBody;
    useMonacoEditor?: boolean;
    onUpdate?: ((event: CustomEvent<any>) => void) | undefined;
    onDelete?: (() => void) | undefined;
  } = $props();
</script>

{#if useMonacoEditor}
  <!-- <CodeContentUsingMonaco
    {mdStore}
    {body}
    {onUpdate}
    {onDelete}
  /> -->
{:else}
  <CodeContentUsingHighlight {mdStore} {body} {onUpdate} {onDelete} />
{/if}
