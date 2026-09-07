<script lang="ts">
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import type {
    INode,
    INodeLinkThumb
  } from "@nucleum/features/memory/node/node.type";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import LinkItem from "@nucleum/features/memory/node/links/LinkItem.svelte";
  let {
    links,
    accessPointId,
    accessPoint = ResourceAccessPoint.NODE_LINKS,
    accessPointContext = undefined,
    onAction = undefined,
    onClick = undefined,
    onLinkTypeSelect = undefined,
    onTag = undefined,
    onTagClick = undefined
  }: {
    links: { link: INodeLinkThumb; node: INode }[];
    accessPointId: IRecordId;
    accessPoint?: ResourceAccessPoint;
    accessPointContext?: string | undefined;
    onAction?: ((event: CustomEvent<any>) => void) | undefined;
    onClick?:
      | ((event: CustomEvent<{ event: MouseEvent; id: IRecordId }>) => void)
      | undefined;
    onLinkTypeSelect?: ((event: CustomEvent<any>) => void) | undefined;
    onTag?: ((event: CustomEvent<any>) => void) | undefined;
    onTagClick?: ((event: CustomEvent<any>) => void) | undefined;
  } = $props();
</script>

<div class="flex flex-col gap-3 w-full">
  {#each links as item (item.link.linkedTo)}
    <LinkItem
      link={item.link}
      item={item.node}
      {accessPointId}
      {accessPoint}
      {accessPointContext}
      onClick={(event) => {
        const clickEvent = new CustomEvent<{
          event: MouseEvent;
          id: IRecordId;
        }>("click", {
          detail: { event, id: item.node.id }
        });
        onClick?.(clickEvent);
      }}
      onLinkTypeSelect={(event) => {
        onLinkTypeSelect?.(event);
      }}
      onAction={(event) => {
        onAction?.(event);
      }}
      onTagClick={(event) => {
        onTagClick?.(event);
      }}
      onTag={(event) => {
        onTag?.(event);
      }}
    />
  {/each}
</div>
