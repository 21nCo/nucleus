<script lang="ts">
  import Markdown from "@nucleum/components/markdown/Markdown.svelte";
  import type { IMarkdown } from "@nucleum/components/markdown/md.type";
  import type { Snippet } from "svelte";

  let {
    md = $bindable(),
    parentBgIndex = 1,
    isHideTitle = false,
    placeholder = "Start typing...",
    onChange = undefined,
    onDebouncedChange = undefined,
    title = undefined
  }: {
    md: IMarkdown;
    parentBgIndex?: number;
    isHideTitle?: boolean;
    placeholder?: string;
    onChange?: ((event: CustomEvent<any>) => void) | undefined;
    onDebouncedChange?:
      | ((event: CustomEvent<IMarkdown | undefined>) => void)
      | undefined;
    title?: Snippet | undefined;
  } = $props();
</script>

<Markdown
  bind:md
  parentBackgroundIndex={parentBgIndex}
  params={{
    placeholder,
    actions: isHideTitle ? [] : ["copy"],
    title: isHideTitle ? undefined : "Notes",
    isReadOnly: false,
    canUseSlashShortcut: false
  }}
  {onChange}
  {onDebouncedChange}
  {title}
/>
