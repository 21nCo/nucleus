<script lang="ts">
  import TextSearchInput from "@21n/elements/input/TextSearchInput.svelte";
  import { InputStyle } from "@21n/types/input.type";
  import type { INodeLinkThumb } from "@nucleum/features/memory/node/node.type";
  import type { IRecordId } from "@21n/types/data.type";
  import { logger } from "@nucleum/client/runtime/logging/logger";
  import {
    LinkType,
    type ILinkTag
  } from "@nucleum/features/memory/linking/link.type";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { generateResourceId } from "@nucleum/datafn/id.utils";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { linkTagLabelMapper } from "@nucleum/features/memory/linking/link.utils";
  import { determineResourceType } from "@nucleum/datafn/resource.utils";

  let {
    link = $bindable(),
    onTag = undefined
  }: {
    link: INodeLinkThumb;
    onTag?: ((event: CustomEvent<IRecordId>) => void) | undefined;
  } = $props();
  let searchQuery = $state("");
  let searchInputRef: any;
  async function handleSelect(e: CustomEvent) {
    if (!e.detail.item) return;
    processSelect(e.detail.item.id);
  }

  function emitTag(id: IRecordId) {
    const tagEvent = new CustomEvent<IRecordId>("tag", {
      detail: id
    });
    onTag?.(tagEvent);
  }

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
    return datafn.table(fromResource).mutate({
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

  async function processSelect(id: IRecordId) {
    link.tags = [...(link.tags || []), id];
    const linkRow =
      link.links?.find((x) => x.linkType === LinkType.DIRECT) ??
      link.links?.[0];
    if (!linkRow) return;
    const result = await updateRelationTags(linkRow, link.tags);
    logger.log({ at: "processSelect", result });
    emitTag(id);
  }

  async function onEmptyEnter() {
    const savedLinkTag = await saveLinkTag(searchQuery);
    if (savedLinkTag) {
      processSelect(savedLinkTag.id);
    }
    searchQuery = "";
    searchInputRef?.reset();
  }

  function resolveTagParts(label: string) {
    let resolvedLabel = label.trim();
    let resolvedGroup = "";
    if (resolvedLabel.includes(":")) {
      const [groupPart, ...labelParts] = resolvedLabel.split(":");
      resolvedGroup = groupPart.trim().toLowerCase();
      resolvedLabel = labelParts.join(":").trim();
    }
    return {
      label: resolvedLabel,
      group: resolvedGroup
    };
  }

  async function saveLinkTag(label: string) {
    const next = resolveTagParts(label);
    const existing = await datafn.linkTag.query({
      select: ["id", "label", "group", "updatedAt", "createdAt"]
    });
    const existingTag = ((existing.data ?? []) as ILinkTag[]).find(
      (tag) =>
        tag.label?.toLowerCase() === next.label.toLowerCase() &&
        (tag.group ?? "").toLowerCase() === next.group
    );
    if (existingTag) return existingTag;
    const record = {
      id: generateResourceId(Resource.linkTag),
      ...next
    };
    await datafn.linkTag.mutate({
      operation: "insert",
      id: record.id,
      record
    });
    return record;
  }

  async function searchCallback(query: string) {
    const result = await datafn.linkTag.query({
      select: ["id", "label", "group"]
    });
    return ((result.data ?? []) as ILinkTag[])
      .map(linkTagLabelMapper)
      .filter((tag) => tag.label?.toLowerCase().includes(query.toLowerCase()));
  }
</script>

<button
  onclick={(event) => {
    event.stopPropagation();
  }}
  class="w-full"
>
  <TextSearchInput
    bind:this={searchInputRef}
    bind:value={searchQuery}
    style={InputStyle.PLAIN}
    {searchCallback}
    onSelect={handleSelect}
    {onEmptyEnter}
    emptyStateLabel="No relations found. Press enter to create a new relation"
    placeholder="Start typing to add relations"
  />
</button>
