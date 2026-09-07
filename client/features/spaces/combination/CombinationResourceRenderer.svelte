<script lang="ts">
  import EmptyStatusView from "@nucleum/client/elements/feedback/EmptyStatusView.svelte";
  import Collection from "@nucleum/features/collections/Collection.svelte";
  import Node from "@nucleum/features/memory/node/Node.svelte";
  import SideNavCombination from "@nucleum/features/spaces/combination/SideNavCombination.svelte";
  import {
    AccessMode,
    ResourceAccessPoint
  } from "@nucleum/datafn/resource.type";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import type { IRecordId } from "@nucleum/client/types/data.type";
  import Objective from "@nucleum/features/focus/goals/Goal.svelte";

  let {
    resourceId = undefined,
    resourceType = undefined,
    accessMode = AccessMode.INLINE,
    visitedCombinationIds = new Set(),
    parentCombinationId = undefined
  }: {
    resourceId?: IRecordId | undefined;
    resourceType?: Resource | undefined;
    accessMode?: AccessMode;
    visitedCombinationIds?: Set<string>;
    parentCombinationId?: IRecordId | undefined;
  } = $props();

  const unsupportedMessage = "Selected resource type is not yet supported";

  let isRecursiveLoop = $derived(
    resourceType === Resource.space &&
      resourceId &&
      visitedCombinationIds.has(resourceId.toString())
  );

  function resolveVisitedIds() {
    if (resourceType !== Resource.space || !resourceId)
      return visitedCombinationIds;
    const next = new Set(visitedCombinationIds);
    next.add(resourceId.toString());
    if (parentCombinationId) next.add(parentCombinationId.toString());
    return next;
  }
</script>

{#if !resourceId || !resourceType}
  <EmptyStatusView
    mainText="Pick a resource from the side nav"
    subText="Select an item to start reading"
    isSearchContext={false}
  />
{:else if isRecursiveLoop}
  <EmptyStatusView
    mainText="Recursive space detected"
    subText="This space references itself. Choose a different item."
    isSearchContext={false}
  />
{:else if resourceType === Resource.node}
  <Node id={resourceId} {accessMode} />
{:else if resourceType === Resource.collection}
  <Collection
    id={resourceId}
    {accessMode}
    accessPoint={ResourceAccessPoint.COMBINATION}
  />
{:else if resourceType === Resource.objective}
  <Objective
    id={resourceId}
    {accessMode}
    accessPoint={ResourceAccessPoint.COMBINATION}
  />
{:else if resourceType === Resource.space}
  <SideNavCombination
    id={resourceId}
    {accessMode}
    isEmbedded={true}
    visitedCombinationIds={resolveVisitedIds()}
  />
{:else}
  <EmptyStatusView mainText={unsupportedMessage} isSearchContext={false} />
{/if}
