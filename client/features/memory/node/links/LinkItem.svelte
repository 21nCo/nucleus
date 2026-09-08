<script lang="ts">
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import { cn } from "@21n/utils/ui.utils";
  import type {
    INode,
    INodeLinkThumb,
    INodeThumb
  } from "@nucleum/features/memory/node/node.type";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import LinkTagger from "@nucleum/features/memory/linking/LinkTagger.svelte";
  import Toggle from "@21n/elements/toggle/Toggle.svelte";
  import LinkTags from "@nucleum/features/memory/linking/LinkTags.svelte";
  import NodeThumbnail from "@nucleum/features/memory/node/thumbnail/NodeThumbnail.svelte";
  import LinkTypeIndicator from "./LinkTypeIndicator.svelte";
  import { LinkType } from "@nucleum/datafn/link.type";
  let {
    accessPointId,
    link,
    item,
    accessPoint = ResourceAccessPoint.NODE_LINKS,
    accessPointContext = undefined,
    onAction = undefined,
    onClick = undefined,
    onLinkTypeSelect = undefined,
    onTag = undefined,
    onTagClick = undefined
  }: {
    accessPointId: IRecordId;
    link: INodeLinkThumb;
    item: INode | INodeThumb;
    accessPoint?: ResourceAccessPoint;
    accessPointContext?: string | undefined;
    onAction?: ((event: CustomEvent<any>) => void) | undefined;
    onClick?: ((event: MouseEvent) => void) | undefined;
    onLinkTypeSelect?:
      | ((
          event: CustomEvent<{
            linkType: LinkType;
            direction: "incoming" | "outgoing" | undefined;
          }>
        ) => void)
      | undefined;
    onTag?: ((event: CustomEvent<any>) => void) | undefined;
    onTagClick?: ((event: CustomEvent<any>) => void) | undefined;
  } = $props();
  let isShowLinkTagger = false;

  function propagateLinkTypeClick(
    linkType: LinkType,
    direction: "incoming" | "outgoing" | undefined
  ) {
    return (e: Event) => {
      e.stopPropagation();
      const linkTypeSelectEvent = new CustomEvent<{
        linkType: LinkType;
        direction: "incoming" | "outgoing" | undefined;
      }>("linkTypeSelect", {
        detail: { linkType, direction }
      });
      onLinkTypeSelect?.(linkTypeSelectEvent);
    };
  }
</script>

<!-- TODO - add parent breadcrumbs  and avatar in below component - moving from LinkSuggestionItem.svelte -->

<button
  data-testid={`node-link-item:${item.id}`}
  onclick={(event) => {
    onClick?.(event);
  }}
>
  <NodeThumbnail
    {item}
    {accessPoint}
    {accessPointId}
    {accessPointContext}
    onAction={(event) => {
      onAction?.(event);
    }}
    isAlwaysShowContextMenuOnTouchDevice={true}
  >
    {#snippet right()}
      <span class="flex items-center gap-2">
        <span class="flex bg-bgs2 rounded-md border border-brs3">
          <Toggle icon="relation" bind:on={isShowLinkTagger} />
        </span>
      </span>
    {/snippet}
    {#snippet bottom()}
      <span
        class={cn("flex flex-col gap-2", {
          "pt-3":
            (link.tags && link.tags.length > 0) ||
            (link.links && link.links.length > 0) ||
            isShowLinkTagger
        })}
      >
        <span class="flex gap-2">
          {#if link.links && link.links.length > 0}
            <span class="flex gap-1">
              {#each link.links as linkType}
                <LinkTypeIndicator
                  linkType={linkType.linkType}
                  direction={linkType.direction}
                  onclick={propagateLinkTypeClick(
                    linkType.linkType,
                    linkType.direction
                  )}
                />
              {/each}
            </span>
          {/if}
          {#if link.tags && link.tags.length > 0}
            <LinkTags
              bind:link
              onTagClick={(event) => {
                onTagClick?.(event);
              }}
            />
          {/if}
        </span>
        {#if isShowLinkTagger}
          <div class="w-full py-2">
            <LinkTagger
              bind:link
              onTag={(event) => {
                onTag?.(event);
              }}
            />
          </div>
        {/if}
      </span>
    {/snippet}
  </NodeThumbnail>
</button>
