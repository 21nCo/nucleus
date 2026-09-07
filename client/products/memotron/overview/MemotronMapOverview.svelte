<script lang="ts">
  import MemotronOverviewLayout from "@nucleum/products/memotron/overview/MemotronOverviewLayout.svelte";
  import MapOverview from "@nucleum/components/overview/MapOverview.svelte";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import type { INode } from "@nucleum/features/memory/node/node.type";
  import SwitchInput from "@21n/elements/toggle/SwitchInput.svelte";
  import { Size } from "@21n/types/size.enum";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { toSvelteStore } from "@datafn/svelte";

  interface MapDataPoint {
    id: string;
    label: string;
    latitude: number;
    longitude: number;
    contentType: string;
    createdAt: string;
    url?: string;
    metadata: any;
  }

  let isConstrainedWidth = $state(false);
  let isShowHeatmap = $state(false);
  const nodeStore = toSvelteStore<INode[]>(
    datafn.node.signal({
      select: ["id", "label", "contentType", "metadata", "createdAt", "url"]
    }),
    { initialData: [] }
  );
  const mapData = $derived(resolveMapData($nodeStore.data));

  function resolveMapData(nodes: INode[]): MapDataPoint[] {
    return nodes
      .filter((node: INode) => {
        return (
          node.metadata?.location?.latitude &&
          node.metadata?.location?.longitude
        );
      })
      .map((node: INode) => ({
        id: node.id.toString(),
        label: node.label || "Untitled",
        latitude: parseFloat(node.metadata.location.latitude),
        longitude: parseFloat(node.metadata.location.longitude),
        contentType: node.contentType,
        createdAt: new Date(node.createdAt).toISOString(),
        url: node.url,
        metadata: node.metadata
      }));
  }
</script>

<MemotronOverviewLayout bind:isConstrainedWidth>
  {#snippet right()}
    <span class="flex items-center gap-3 text-fgs3 text-b3 h-full">
      {#if !isConstrainedWidth && mapData.length > 0}
        <SwitchInput
          label={{ label: "Show as heatmap" }}
          size={Size.sm}
          bind:checked={isShowHeatmap}
        />
      {/if}
    </span>
  {/snippet}

  {#if $nodeStore.loading}
    <div
      class="absolute z-10 inset-0 w-full h-full flex justify-center items-center bg-bgs1"
    >
      <EmptyStatusView isLoadingState={true} mainText="Loading map data..." />
    </div>
  {:else if mapData.length === 0}
    <div
      class="absolute z-10 inset-0 w-full h-full flex justify-center items-center bg-bgs1"
    >
      <EmptyStatusView
        mainText="No nodes with location data found."
        subText="Please make sure location permission is enabled while capturing a node."
      />
    </div>
  {:else}
    <div class="rounded-md overflow-hidden p-2 w-full h-full">
      <MapOverview data={mapData} {isShowHeatmap} />
    </div>
  {/if}
</MemotronOverviewLayout>
