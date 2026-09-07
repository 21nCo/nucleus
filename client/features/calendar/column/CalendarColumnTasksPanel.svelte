<script lang="ts">
  import { onDestroy } from "svelte";
  import type { ITaskThumb } from "@nucleum/features/focus/tasks/task.type";
  import TaskRecords from "@nucleum/features/focus/tasks/TaskRecords.svelte";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { BulkEditor } from "@nucleum/components/record/record.store";
  import { appStore } from "@nucleum/stores/app.store";
  import type { IRecordId } from "@21n/types/data.type";
  import { toasts } from "@nucleum/stores/notification.store";
  import { dragSelection } from "@nucleum/actions/dragSelection.action";
  import { bulkEditStore } from "@nucleum/components/record/bulkedit.store";
  import { PointronAction } from "@21n/types/pointron/pointronAction.enum";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { toSvelteStore } from "@datafn/svelte";
  import { time } from "@datafn/client";

  let {
    date,
    accessPoint = ResourceAccessPoint.CALENDAR
  }: {
    date: Date;
    accessPoint?: ResourceAccessPoint;
  } = $props();

  let isInSelectionMode = $state(false);

  const taskStore = $derived.by(() =>
    toSvelteStore(
      datafn.task.signal({
        temporal: time.day("dateUnix", date),
        select: ["*", "objective.*"]
      }),
      { initialData: [] }
    )
  );

  const multiSelectContext = $derived({
    resource: Resource.task,
    accessPoint
  });

  onDestroy(() => {
    if (bulkEditStore.matchesContext(multiSelectContext)) {
      bulkEditStore.clear();
    }
  });

  async function handleCreateTask() {
    appStore.runAction(PointronAction.CREATE_TASK_INLINE, {
      componentParams: { date }
    });
  }

  function onSelectAll() {
    return $taskStore.data.map((x) => x.id);
  }

  async function onBulkAction(
    ids: IRecordId[],
    action: string,
    data?: unknown
  ) {
    try {
      const editor = new BulkEditor(Resource.task, bulkEditStore);
      await editor.run(action, data);
    } catch (e) {
      toasts.error("Failed to perform bulk action");
    }
  }
</script>

<div
  class="relative flex flex-col w-full h-full overflow-y-auto"
  id="calendar-tasks-panel"
  use:dragSelection={{
    selectableSelector: "div[id^='thumbnail-']",
    containerId: "calendar-tasks-panel",
    onSelectionChange: (elements, ids) => {
      bulkEditStore.activate(multiSelectContext, {
        onAction: onBulkAction,
        onSelectAll: onSelectAll,
        subContext: date.toISOString()
      });
      const state = bulkEditStore.getState();
      if (isInSelectionMode) {
        bulkEditStore.select([...new Set([...state.selectedIds, ...ids])]);
      } else {
        isInSelectionMode = true;
        bulkEditStore.select(ids);
      }
    }
  }}
>
  <div class="flex py-3 w-full flex-grow styledscroll">
    <TaskRecords
      data={$taskStore.data}
      {accessPoint}
      isRefreshing={$taskStore.loading || $taskStore.refreshing}
      {date}
      onCreate={handleCreateTask}
    />
  </div>

  <!-- <FloatingButton
      params={[
        {
          icon: "plus",
          label: "Create new task",
          callback: handleCreateTask
          // variant: ButtonVariant.PRIMARY,
          // style: ButtonStyle.OUTLINED
        }
      ]}
    /> -->
</div>
