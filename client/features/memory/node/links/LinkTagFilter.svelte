<script lang="ts">
  import { resourceInList } from "@nucleum/datafn/resource.utils";
  import Tag from "@21n/elements/text/Tag.svelte";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import { Size } from "@21n/elements/size.enum";
  import { linkTagLabelMapper } from "@nucleum/features/memory/linking/link.utils";
  import type { ILinkTag } from "@nucleum/features/memory/linking/link.type";
  import type { INodeLinkThumb } from "@nucleum/features/memory/node/node.type";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { toSvelteStore } from "@datafn/svelte";
  let {
    links = [],
    selected = $bindable([])
  }: {
    links?: INodeLinkThumb[];
    selected?: IRecordId[];
  } = $props();
  const linkTagStore = toSvelteStore<ILinkTag[]>(
    datafn.linkTag.signal({
      select: ["id", "label", "group"]
    }),
    { initialData: [] }
  );
  const linkTags = $derived($linkTagStore.data);

  let tags = $derived.by(
    () =>
      linkTags
        ?.filter((x) => links.some((y) => y.tags?.some(resourceInList(x))))
        ?.map(linkTagLabelMapper) ?? []
  );

  function resolveCount(tagId: IRecordId) {
    return links.filter((x) => x.tags?.some(resourceInList(tagId))).length;
  }
</script>

{#if tags.length > 0}
  <div class="flex flex-wrap gap-2">
    {#each tags as tag}
      <div class="flex gap-2">
        <Tag
          label={tag.label}
          count={resolveCount(tag.id)}
          size={Size.md}
          isActive={selected.some(resourceInList(tag.id))}
          isRemovable={false}
          onclick={() => {
            if (selected.some(resourceInList(tag.id))) {
              selected = selected.filter((x) => !resourceInList(tag.id)(x));
            } else {
              selected = [...selected, tag.id];
            }
          }}
        />
      </div>
    {/each}
  </div>
{:else}
  <span class="w-full text-center text-b2 text-fgs3">
    No relations present.
  </span>
{/if}
