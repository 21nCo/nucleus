<script lang="ts">
  import AppLoadingView from "@21n/layout/paint/AppLoadingView.svelte";
  import { appStore } from "@nucleum/stores/app.store";
  import type { IMarkdown } from "@nucleum/features/memory/markdown/md.type";
  import { onMount, tick } from "svelte";
  import MarkdownView from "@nucleum/features/memory/markdown/Markdown.svelte";
  let {
    md = undefined,
    src = undefined
  }: {
    md?: IMarkdown | undefined;
    src?: string | undefined;
  } = $props();
  window.scrollTo(0, 0);
  const resolvedMd = $derived(src ? $appStore?.appData?.md?.[src] : md);
  onMount(async () => {
    await tick();
    console.log("scrolling to top", {
      scrollY: window.scrollY,
      scrollTop: document.body.scrollTop
    });
    window.scroll(0, 0);
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
  });
</script>

{#if resolvedMd}
  <article class="p-6 tp:p-10 dp:p-16">
    <MarkdownView md={resolvedMd} params={{ isReadOnly: true }} />
  </article>
{:else}
  <AppLoadingView message="loading..." />
{/if}
