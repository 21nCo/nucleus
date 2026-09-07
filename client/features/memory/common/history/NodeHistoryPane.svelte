<script lang="ts">
  import { get } from "svelte/store";
  import type { DatafnChangelogEntry } from "@datafn/client";
  import type { IActiveNodeStore } from "@nucleum/features/memory/node/node.store";
  import HistoryItem from "@nucleum/features/memory/common/history/HistoryItem.svelte";
  import { isValidArrayWithData } from "@21n/shared-utils/obj.utils";
  import type { IAccessLog } from "@nucleum/features/system/accessLogging/accessLog.type";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { logger } from "@nucleum/client/runtime/logging/logger";
  import ScrollViewBottomSpacer from "@21n/layout/scrollView/ScrollViewBottomSpacer.svelte";
  import { datafn, datafnRuntime } from "@nucleum/datafn/datafn.store";
  import { toSvelteStore } from "@datafn/svelte";

  type HistoryEntry = { action: string; timestamp: Date };

  let { node = null }: { node?: IActiveNodeStore | null } = $props();
  let changelogLogs = $state<HistoryEntry[]>([]);
  let isChangelogLoading = $state(false);
  const nodeId = $derived($node?.id?.toString());
  const accessLogStore = $derived.by(() =>
    toSvelteStore<IAccessLog[]>(
      nodeId
        ? datafn.accessLog.signal({
            filters: {
              resourceId: nodeId
            }
          })
        : datafn.emptySignal([]),
      { initialData: [] }
    )
  );
  const accessLogs = $derived.by(() => {
    const createdLogs: HistoryEntry[] = $node?.createdAt
      ? [
          {
            action: "Created",
            timestamp: new Date($node.createdAt)
          }
        ]
      : [];
    const openLogs = $accessLogStore.data.map((log) => ({
      action: "Opened",
      timestamp: new Date(log.createdAt)
    }));
    return [...createdLogs, ...openLogs, ...changelogLogs].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  });
  const isLoading = $derived(
    isChangelogLoading || $accessLogStore.loading || $accessLogStore.refreshing
  );

  $effect(() => {
    if (nodeId) void refreshChangelog(nodeId);
    else changelogLogs = [];
  });

  async function refreshChangelog(nodeId: string) {
    try {
      isChangelogLoading = true;
      const mutations = await get(datafnRuntime)?.storage?.changelogList({
        limit: 500
      });
      if (isValidArrayWithData(mutations)) {
        const nodeMutations = (mutations ?? []).filter((mutation) =>
          isNodeMutation(mutation, nodeId)
        );
        changelogLogs = [
          ...nodeMutations.map((mutation) => ({
            action: resolveDatafnAction(
              mutation.mutation.operation?.toString()
            ),
            timestamp: resolveDatafnTimestamp(mutation)
          }))
        ];
      } else {
        changelogLogs = [];
      }
    } catch (e) {
      logger.error({ at: "NodeHistoryPane.refreshChangelog", e });
      changelogLogs = [];
    } finally {
      isChangelogLoading = false;
    }
  }

  function isNodeMutation(entry: DatafnChangelogEntry, nodeId: string) {
    const mutation = entry.mutation;
    if (mutation.resource !== Resource.node) return false;
    const mutationIds = Array.isArray(mutation.id)
      ? mutation.id
      : [mutation.id, (mutation.record as Record<string, unknown>)?.id];
    return mutationIds.filter(Boolean).some((id) => id?.toString() === nodeId);
  }

  function resolveDatafnAction(operation?: string) {
    switch (operation) {
      case "insert":
        return "Created";
      case "merge":
      case "replace":
        return "Updated";
      case "trash":
        return "Deleted";
      case "archive":
        return "Archived";
      case "restore":
      case "unarchive":
        return "Restored";
      case "delete":
        return "Removed";
      default:
        return operation ?? "Updated";
    }
  }

  function resolveDatafnTimestamp(entry: DatafnChangelogEntry) {
    if (entry.timestampMs) return new Date(entry.timestampMs);
    if (entry.timestamp) return new Date(entry.timestamp);
    const record = entry.mutation.record as Record<string, unknown> | undefined;
    const recordTimestamp = record?.updatedAt ?? record?.createdAt;
    if (recordTimestamp) return new Date(recordTimestamp as string | number);
    return new Date();
  }
</script>

<div class="flex flex-col gap-6 w-full h-full">
  {#if isLoading || !accessLogs}
    <EmptyStatusView
      isLoadingState={isLoading}
      subText="History not available"
    />
  {:else}
    <div class="flex flex-col gap-3 overflow-y-auto">
      {#each accessLogs as accessLog}
        <HistoryItem item={accessLog} />
      {/each}
      <ScrollViewBottomSpacer />
    </div>
  {/if}
</div>
