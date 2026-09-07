<script lang="ts">
  import type { IActiveNodeStore } from "@nucleum/features/memory/node/node.store";
  import { NodeType } from "@nucleum/features/memory/node/node.type";
  import type { ITaskThumb } from "@nucleum/features/focus/tasks/task.type";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import TaskThumbnail from "@nucleum/features/focus/tasks/TaskThumbnail.svelte";
  import { LoadingAnimationType } from "@21n/types/feedback.type";
  import type { IEmbedBlock } from "@nucleum/components/markdown/md.type";
  import type { IRecordId } from "@21n/types/data.type";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { toSvelteStore } from "@datafn/svelte";

  let {
    node = null
  }: {
    node?: IActiveNodeStore | null;
  } = $props();
  const taskIds = $derived.by(() => {
    if (!node || !$node?.md?.blocks) return [];
    return $node.md.blocks
      .filter(
        (b): b is IEmbedBlock =>
          b.contentType === NodeType.EMBED &&
          typeof b.body === "object" &&
          b.body !== null &&
          "subType" in b.body &&
          b.body.subType === NodeType.TASK_AS_EMBED &&
          "id" in b.body
      )
      .map((b) => b.body.id)
      .filter((id): id is IRecordId => Boolean(id));
  });
  const taskStore = $derived.by(() =>
    toSvelteStore<ITaskThumb[]>(
      datafn.task.signal({
        select: ["*", "objective.*"],
        filters: {
          id: { $in: taskIds }
        }
      }),
      { initialData: [] }
    )
  );
  const tasks = $derived.by(() => {
    const order = new Map(taskIds.map((id, index) => [id.toString(), index]));
    return [...$taskStore.data].sort(
      (a, b) =>
        (order.get(a.id?.toString()) ?? 0) -
        (order.get(b.id?.toString()) ?? 0)
    );
  });
  const isRefreshing = $derived($taskStore.loading || $taskStore.refreshing);
</script>

{#if tasks.length > 0}
  {#each tasks as task}
    <TaskThumbnail item={task} />
  {/each}
{:else}
  <EmptyStatusView
    isLoadingState={isRefreshing}
    loadingAnimation={LoadingAnimationType.FOCUS_ITEMS_PULSE}
    mainText="No tasks found"
    subText="This page doesn't have any tasks yet"
  />
{/if}
