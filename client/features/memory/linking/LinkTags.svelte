<script lang="ts">
  import Tag from "@21n/elements/text/Tag.svelte";
  import type { IRecordId } from "@21n/types/data.type";
  import { Size } from "@21n/types/size.enum";
  import type { INodeLinkThumb } from "@nucleum/features/memory/node/node.type";
  import { linkTagLabelMapper } from "@nucleum/features/memory/linking/link.utils";
  import {
    determineResourceType,
    resourceInList
  } from "@nucleum/datafn/resource.utils";
  import {
    LinkType,
    type ILinkTag
  } from "@nucleum/features/memory/linking/link.type";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { toSvelteStore } from "@datafn/svelte";

  let {
    link = $bindable(),
    onTagClick = undefined
  }: {
    link: INodeLinkThumb;
    onTagClick?: ((event: CustomEvent<IRecordId>) => void) | undefined;
  } = $props();
  const linkTagStore = toSvelteStore<ILinkTag[]>(
    datafn.linkTag.signal({
      select: ["id", "label", "group"]
    }),
    { initialData: [] }
  );
  const linkTags = $derived($linkTagStore.data);
  const tags = $derived.by(
    () =>
      linkTags
        ?.filter((x) => link.tags?.some(resourceInList(x)))
        ?.map(linkTagLabelMapper) ?? []
  );
  function parseLinkId(id: IRecordId) {
    const [from, to] = id.toString().split("|");
    return from && to ? { from, to } : undefined;
  }

  async function updateRelationTags(
    row: NonNullable<INodeLinkThumb["links"]>[number],
    tags: IRecordId[] = []
  ) {
    const parsed = parseLinkId(row.id);
    if (!parsed) return;
    const fromResource = determineResourceType(parsed.from);
    const toResource = determineResourceType(parsed.to);
    await datafn.table(fromResource).mutate({
      operation: "modifyRelation",
      id: parsed.from,
      relations: {
        links: [
          {
            $ref: parsed.to,
            fromResource: fromResource.toString(),
            toResource: toResource.toString(),
            linkType: row.linkType ?? LinkType.DIRECT,
            tags
          }
        ]
      }
    } as any);
  }

  async function onRemove(tagId: IRecordId) {
    link.tags = link.tags?.filter((x) => x.toString() !== tagId.toString());
    const linksWithThisTag = link.links?.filter((x) =>
      x.tags?.some(resourceInList(tagId))
    );
    if (linksWithThisTag && linksWithThisTag.length > 0) {
      link.links = link.links?.map((x) => ({
        ...x,
        tags: x.tags?.filter((y) => y.toString() !== tagId.toString())
      }));
      linksWithThisTag.forEach(async (x) => {
        await updateRelationTags(
          x,
          x.tags?.filter((y) => y.toString() !== tagId.toString())
        );
      });
    }
  }
  function handleTagClick(tagId: IRecordId, e: MouseEvent) {
    const tagClickEvent = new CustomEvent<IRecordId>("tagClick", {
      detail: tagId
    });
    onTagClick?.(tagClickEvent);
    e.stopPropagation();
  }
</script>

<div class="flex gap-2 flex-wrap userdata">
  {#each tags as tag}
    <Tag
      label={tag.label}
      size={Size.sm}
      icon="relation"
      onclick={(e) => handleTagClick(tag.id, e)}
      onRemove={() => onRemove(tag.id)}
    />
  {/each}
</div>
