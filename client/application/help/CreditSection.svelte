<script lang="ts">
  import Text from "@21n/elements/text/Text.svelte";
  import { TextStyle } from "@21n/types/text.enum";

  let {
    title,
    items
  }: {
    title: string;
    items: Array<{
      name: string;
      description: string;
      creator: string;
      link: string;
    }>;
  } = $props();
</script>

<div class="flex flex-col gap-4">
  <Text content={title} style={TextStyle.PANEL_HEADING} />
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each items as item}
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        class="flex flex-col p-4 rounded-lg bg-bgs2 hover:bg-bgs3 transition-colors duration-200 border border-bgs3"
      >
        <div class="font-medium text-base text-fgs1">{item.name}</div>
        <div class="text-b3 text-fgs3">{item.creator}</div>
        <div class="text-b3 text-fgs3 mt-4">{item.description}</div>
      </a>
    {/each}
  </div>
</div>
