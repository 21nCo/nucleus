<script lang="ts">
  import {
    focusItemsStore,
    lastActiveObjectiveIdForEditing,
    activeSession,
    currentFocusItem
  } from "@nucleum/features/focus/session.store";
  import FocusItem from "@nucleum/features/focus/elements/focusitem/FocusItem.svelte";
  import AddFocusItem from "@nucleum/features/focus/elements/focusitem/AddFocusItem.svelte";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import { Size } from "@21n/types/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import {
    ObjectiveStatus,
    ObjectiveType,
    type IObjectiveThumb
  } from "@nucleum/features/focus/goals/goal.type";
  import { onMount } from "svelte";
  import {
    isSameResource,
    resourceInList
  } from "@nucleum/datafn/resource.utils";
  import type { ITaskThumb } from "@nucleum/features/focus/tasks/task.type";
  import { isValidArrayWithData } from "@21n/shared-utils/obj.utils";
  import { toasts } from "@nucleum/stores/notification.store";
  import { ErrorMessage } from "@21n/types/resource-error.type";
  import type { IRecordId } from "@21n/types/data.type";
  import { LoadingAnimationType } from "@21n/types/feedback.type";
  import PanelSwitcher from "@21n/elements/switcher/PanelSwitcher.svelte";
  import { BarStyle, PanelSwitcherStyle } from "@21n/types/switcher.enum";
  import Records from "@nucleum/application/record/Records.svelte";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import Text from "@21n/elements/text/Text.svelte";
  import { TextStyle } from "@21n/types/text.enum";
  import { uiState } from "@nucleum/stores/uiState/uiState.store";
  import { UIState } from "@nucleum/stores/uiState/uiState.type";
  import CalendarColumnTasksPanel from "@nucleum/features/calendar/column/CalendarColumnTasksPanel.svelte";
  import { reorderList } from "@nucleum/actions/rearrange.action";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { generateResourceId } from "@nucleum/datafn/id.utils";
  import { toSvelteStore } from "@datafn/svelte";
  let { isInEditMode = false }: { isInEditMode?: boolean } = $props();
  let isFocusingAddObjective = $state(false);
  let isRefreshing = $state(true);
  let selectedPickFromPanel = $state<"recents" | "calendar">(
    uiState.getState(UIState.focusItemsPickFromPanel) ?? "recents"
  );

  const focusItemIds = $derived(
    $focusItemsStore.items.map((item) => item.id.toString())
  );
  const tasksWithObjective = $derived.by(() =>
    $focusItemsStore.items
      .map((item) => item.tasks)
      .flat()
      .filter((id): id is IRecordId => Boolean(id))
  );
  const focusItems = $derived.by(() => {
    return [
      ...($focusItemsStore.items.filter(
        (item) => !tasksWithObjective.some(resourceInList(item))
      ) ?? [])
    ];
  });
  const objectiveStore = $derived.by(() => {
    return toSvelteStore<IObjectiveThumb[]>(
      datafn.objective.signal({
        select: ["*", "children.*", "tasks.*"],
        filters: {
          id: { $in: focusItemIds }
        }
      }),
      { initialData: [] }
    );
  });
  const taskStore = $derived.by(() => {
    return toSvelteStore<ITaskThumb[]>(
      datafn.task.signal({
        select: ["*", "objective.*"],
        filters: {
          id: { $in: focusItemIds }
        }
      }),
      { initialData: [] }
    );
  });
  const objectives = $derived($objectiveStore.data);
  const tasks = $derived($taskStore.data);

  function onBlur() {
    isFocusingAddObjective = false;
  }

  function onfocus() {
    isFocusingAddObjective = true;
  }

  onMount(async () => {
    while (!focusItemsStore.isInitialized) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    const state = uiState.getState(UIState.recentFocusItems);
    if (state) {
      await focusItemsStore.refreshRecents(state);
    }
    isRefreshing = false;
  });

  async function onCreateNewObjectiveTask(event: any) {
    try {
      const { label, objectiveId } = event.detail;
      const result = await focusItemsStore.addNewTask(label, objectiveId);
      if (isValidArrayWithData(result)) {
        return;
      } else {
        toasts.error(ErrorMessage.DEFAULT);
      }
    } catch (error) {
      toasts.error(ErrorMessage.DEFAULT);
    }
  }

  async function onSelect(event: any) {
    const item = event.detail;
    if (!item || !item.id) return;
    if (item.objective || item.objectiveId) {
      const objectiveId = item.objective?.id ?? item.objectiveId;
      await focusItemsStore.addTask(item.id, objectiveId);
    } else {
      await focusItemsStore.addObjective(item.id);
    }
  }

  async function onRemove(event: any) {
    const id = event.detail;
    focusItemsStore.removeFocusItem(id);
    if ($currentFocusItem && isSameResource($currentFocusItem, id)) {
      await activeSession.stopCurrentFocusItem();
    }
  }

  async function onCreateObjective(event: any) {
    const label = event.detail;
    const objective = {
      id: generateResourceId(Resource.objective),
      label,
      type: ObjectiveType.INDEFINITE,
      status: ObjectiveStatus.NOT_STARTED,
      isPinnedForQuickFocus: false
    };
    await datafn.objective.mutate({
      operation: "insert",
      id: objective.id,
      record: objective
    });
    toasts.success("New objective created successfully");
    await focusItemsStore.addObjective(objective.id);
  }

  async function onCreateStandaloneTask(event: any) {
    const label = event.detail;
    await focusItemsStore.addNewTask(label);
  }

  function onReorderFocusItems(event: any) {
    const { fromId, toId } = event;
    focusItemsStore.rearrangeFocusItems(fromId, toId);
  }

  function onReorderTasksInObjective(event: any) {
    const { fromId, toId, objectiveId } = event.detail;
    focusItemsStore.rearrangeTasksInObjective(objectiveId, fromId, toId);
  }
</script>

<div
  class={cn("flex flex-col w-full h-full pb-48 overflow-auto", {
    "pt-6": isInEditMode && $focusItemsStore.items.length > 0,
    "gap-6": isInEditMode,
    "gap-4": !isInEditMode
  })}
>
  {#if ($focusItemsStore.items?.length === 0 && !isInEditMode && $activeSession.isSessionRunning) || isRefreshing}
    <div class="h-full">
      <EmptyStatusView
        size={Size.sm}
        isLoadingState={isRefreshing}
        loadingAnimation={LoadingAnimationType.FOCUS_ITEMS_PULSE}
        mainText="No focus items added."
        subText="Toggle edit mode to add focus items."
      />
      <!-- TODO - input is added to avoid flickering issue on extra wide screens. Without this, causing layout shift when refreshing -->
      <input class="bg-none opacity-0" />
    </div>
  {:else if $focusItemsStore.items?.length > 0 && focusItems.length > 0}
    <div
      use:reorderList={{
        listId: "focusItems",
        draggedOverClass: "outline outline-aps1",
        dragImage: "dragimage",
        onDrop: onReorderFocusItems
      }}
      class={cn("flex flex-col", {
        "gap-6": isInEditMode,
        "gap-4": !isInEditMode
      })}
    >
      {#each focusItems as focusItem, index (focusItem.id)}
        <div
          data-index={index}
          data-id={focusItem.id}
          data-testid={`focus-session-item:${focusItem.id}`}
          data-current-focus={$currentFocusItem &&
          isSameResource(focusItem, $currentFocusItem)
            ? "true"
            : "false"}
          draggable={!$activeSession.isSessionRunning || isInEditMode}
        >
          <FocusItem
            {isInEditMode}
            {focusItem}
            {tasks}
            {objectives}
            onCreateNew={onCreateNewObjectiveTask}
            {onSelect}
            {onRemove}
            onReorderTasks={onReorderTasksInObjective}
            isFocusAddTask={$lastActiveObjectiveIdForEditing
              ? $lastActiveObjectiveIdForEditing === focusItem.id
              : index === $focusItemsStore.items.length - 1}
          />
        </div>
      {/each}
    </div>
  {/if}

  {#if !isRefreshing && (!$activeSession.isSessionRunning || isInEditMode)}
    <div class="flex flex-col gap-2 w-full pt-4">
      <div
        class="flex items-center w-full border rounded-md {isFocusingAddObjective
          ? 'border-aps1'
          : 'border-brs3'}"
      >
        <AddFocusItem
          {onBlur}
          onFocus={onfocus}
          {onSelect}
          {onCreateObjective}
          onCreateTask={onCreateStandaloneTask}
        />
      </div>
    </div>
  {/if}
  {#if isInEditMode && !isRefreshing}
    <div class="flex flex-col gap-4 w-full pt-12">
      <div class="flex items-center gap-2">
        <div class="flex-grow">
          <Text content="Pick from" style={TextStyle.PANEL_HEADING_SMALL} />
        </div>
        <PanelSwitcher
          items={[
            {
              label: "Recents",
              value: "recents"
            },
            {
              label: "Today's tasks",
              value: "calendar"
            }
          ]}
          bind:value={selectedPickFromPanel}
          style={PanelSwitcherStyle.BAR}
          barStyle={BarStyle.DOT}
          size={Size.xs}
          onSwitch={() => {
            uiState.setState(
              UIState.focusItemsPickFromPanel,
              selectedPickFromPanel
            );
          }}
        />
      </div>
      {#if selectedPickFromPanel === "recents"}
        {#if $focusItemsStore.recents && $focusItemsStore.recents.length > 0}
          <Records
            data={$focusItemsStore.recents.map((x) => x.item).slice(0, 5)}
            resource={Resource.everything}
            accessPoint={ResourceAccessPoint.PICKER}
          />
        {:else}
          <div class="flex pt-12">
            <EmptyStatusView
              size={Size.sm}
              isLoadingState={isRefreshing}
              loadingAnimation={LoadingAnimationType.FOCUS_ITEMS_PULSE}
              mainText="No recents found."
              subText="Recent focus items will appear here as you complete few focus sessions."
            />
          </div>
        {/if}
      {:else if selectedPickFromPanel === "calendar"}
        <CalendarColumnTasksPanel
          date={new Date()}
          accessPoint={ResourceAccessPoint.PICKER}
        />
      {/if}
    </div>
  {/if}
</div>
