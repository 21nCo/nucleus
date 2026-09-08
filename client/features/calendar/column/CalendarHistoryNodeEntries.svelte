<script lang="ts">
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import type { INodeThumb } from "@nucleum/features/memory/node/node.type";
  import { Arrangement } from "@21n/elements/direction.enum";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import { requireRecordRenderer } from "@nucleum/stores/resources/record-renderer";
  const Records = requireRecordRenderer();
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { time } from "@datafn/client";
  import { toSvelteStore } from "@datafn/svelte";

  let { date }: { date: Date } = $props();
  const nodeStore = $derived.by(() => {
    if (date) {
      return toSvelteStore<INodeThumb[]>(
        datafn.node.signal({
          select: ["*", "parent.*", "file.*"],
          temporal: time.day("createdAt", date, { storage: "date" })
        }),
        { initialData: [] }
      );
    }
    return toSvelteStore<INodeThumb[]>(datafn.emptySignal([]), {
      initialData: []
    });
  });
  const data = $derived.by(() =>
    [...$nodeStore.data].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  );
  const isLoading = $derived($nodeStore.loading || $nodeStore.refreshing);
</script>

{#if data.length > 0}
  <Records
    {data}
    arrangement={Arrangement.LIST}
    accessPoint={ResourceAccessPoint.CALENDAR}
    isShowBottomSpacer={true}
  />
{:else}
  <EmptyStatusView mainText="No history entries" isLoadingState={isLoading} />
{/if}
