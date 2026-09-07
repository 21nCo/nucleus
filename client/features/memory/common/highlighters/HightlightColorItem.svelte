<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/types/size.enum";
  import type { IHighlighter } from "@nucleum/features/memory/common/highlighters/highlight.type";
  let {
    highlighter,
    isActive,
    onClick = undefined
  }: {
    highlighter: IHighlighter;
    isActive: boolean;
    onClick?: ((event: MouseEvent) => void) | undefined;
  } = $props();
</script>

<button
  class="relative rounded-full w-5 h-5 2k:h-6 2k:w-6 p-1 border border-transparent hover:outline hover:outline-fgs2"
  style="background-color: {highlighter.color};"
  onclick={onClick}
>
  {#if isActive}
    <span
      class="absolute top-0 left-0 w-full h-full flex justify-center items-center"
    >
      <Icon icon="check-circle" size={Size.lg} />
    </span>
  {/if}
</button>
