<script lang="ts">
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { onMount } from "svelte";
  import Records from "@nucleum/application/record/Records.svelte";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import { InputStyle } from "@21n/elements/input/input.type";
  import { Size } from "@21n/elements/size.enum";
  import Icon from "@21n/elements/Icon.svelte";
  import { recentsStore } from "@nucleum/application/record/recent.store";
  import { NodeType } from "@nucleum/features/memory/node/node.type";
  import { Arrangement } from "@21n/elements/direction.enum";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { activeResourceFilter } from "@21n/utils/utils";

  let {
    onSelect = undefined
  }: {
    onSelect?: ((event: CustomEvent<any>) => void) | undefined;
  } = $props();

  let isLoading = false;
  let searchQuery = "";
  let imageNodes: any[] = [];
  onMount(async () => {
    imageNodes = await refresh();
  });
  async function refresh() {
    try {
      isLoading = true;
      if (searchQuery) {
        const result = await datafn.search({
          query: searchQuery,
          resources: [Resource.node],
          fields: ["label", "text"],
          filters: {
            [Resource.node]: {
              contentType: NodeType.IMAGE
            }
          },
          source: "local",
          prefix: true,
          fuzzy: 0.2
        });
        return ((result as { results?: { data: unknown }[] }).results ?? [])
          .map((entry: any) => entry.data)
          .filter(activeResourceFilter);
      } else {
        const recentNodes = recentsStore.resolve({ type: Resource.node });
        return recentNodes.filter(
          (node) => node.contentType === NodeType.IMAGE
        );
      }
    } catch (error) {
      console.error("Error fetching images from library:", error);
      return [];
    } finally {
      isLoading = false;
    }
  }

  async function handleSearch(e: Event) {
    imageNodes = await refresh();
  }
</script>

<div class="flex flex-col gap-4 h-full">
  <div class="flex items-center gap-2">
    <TextInput
      bind:value={searchQuery}
      style={InputStyle.BORDERED}
      size={Size.sm}
      placeholder="Search Image nodes from library..."
      onDebouncedChange={handleSearch}
    />
    {#if isLoading}
      <Icon icon="svg-spinners:90-ring-with-bg" class="stroke-fgs1" />
    {/if}
  </div>
  {#if imageNodes.length > 0}
    <div class="flex overflow-auto">
      <Records
        resource={Resource.node}
        accessPoint={ResourceAccessPoint.PICKER}
        arrangement={Arrangement.GRID}
        data={imageNodes}
        isPreventDefault={true}
        onClick={onSelect}
      />
    </div>
  {:else}
    <div class="flex flex-1 w-full items-center justify-center">
      <EmptyStatusView subText="No images found from library" />
    </div>
  {/if}
</div>
