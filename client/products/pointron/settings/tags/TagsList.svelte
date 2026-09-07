<script lang="ts">
  import { tagStore } from "@nucleum/products/pointron/pointron.store";
  import TagItem from "@nucleum/products/pointron/settings/tags/TagItem.svelte";
  tagStore.refresh();
</script>

<div class="flex gap-2 flex-wrap">
  {#if $tagStore && $tagStore.items.length > 0}
    {#each $tagStore.items as tag (tag.id)}
      <TagItem {...tag} />
    {/each}
  {/if}
  <TagItem isAddNew={true} />
</div>
