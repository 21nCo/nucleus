<script lang="ts">
  import { focusItemsStore } from "@nucleum/features/focus/session.store";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { toasts } from "@nucleum/stores/notification.store";
  import Button from "@21n/elements/button/Button.svelte";
  import { Placement } from "@21n/elements/direction.enum";
  import { InputStyle } from "@21n/elements/input/input.type";
  import TextSearchInput from "@21n/elements/input/TextSearchInput.svelte";
  import {
    determineResourceType,
    resourceInList
  } from "@nucleum/datafn/resource.utils";
  import FocusItemSearchResultItem from "@nucleum/features/focus/elements/focusitem/FocusItemSearchResultItem.svelte";
  import { ObjectiveStatus } from "@nucleum/features/focus/goals/goal.type";
  import { datafn } from "@nucleum/datafn/datafn.store";
  let label = $state("");
  let inputRef = $state<any>();
  let {
    onBlur = undefined,
    onFocus = undefined,
    onSelect = undefined,
    onCreateObjective = undefined,
    onCreateTask = undefined
  }: {
    onBlur?: ((event: CustomEvent<void>) => void) | undefined;
    onFocus?: ((event: CustomEvent<void>) => void) | undefined;
    onSelect?: ((event: CustomEvent<any>) => void) | undefined;
    onCreateObjective?: ((event: CustomEvent<string>) => void) | undefined;
    onCreateTask?: ((event: CustomEvent<string>) => void) | undefined;
  } = $props();
  async function handleSelect(event: any) {
    let item = event?.detail?.item;
    if (!item || !item.id) return;
    if ($focusItemsStore.items.some(resourceInList(item))) {
      toasts.error("Item already exists in focus list");
      return;
    }
    reset();
    const selectEvent = new CustomEvent("select", { detail: item });
    onSelect?.(selectEvent);
  }

  function reset() {
    label = "";
    inputRef?.reset();
  }

  async function handleEmptyEnter(
    e: CustomEvent<{ event: KeyboardEvent; value: string }>
  ) {
    if (e.detail.event.shiftKey) {
      const createObjectiveEvent = new CustomEvent<string>("createObjective", {
        detail: e.detail.value
      });
      onCreateObjective?.(createObjectiveEvent);
      setTimeout(() => {
        reset();
      }, 500);
      return;
    }
    reset();
    const createTaskEvent = new CustomEvent<string>("createTask", {
      detail: e.detail.value
    });
    onCreateTask?.(createTaskEvent);
  }

  async function searchCallback(searchQuery: string) {
    const trimmedSearch = searchQuery?.trim();
    if (!trimmedSearch) {
      const [objectivesResult, tasksResult] = (await datafn.query([
        {
          resource: Resource.objective,
          filters: {
            id: { $ne: "" },
            status: {
              $ne: ObjectiveStatus.COMPLETED
            }
          },
          limit: 50,
          sort: ["-updatedAt"]
        },
        {
          resource: Resource.task,
          filters: {
            isChecked: false
          },
          limit: 50,
          sort: ["-updatedAt"]
        }
      ])) as Array<{ data?: any[] }>;
      return [...(objectivesResult.data ?? []), ...(tasksResult.data ?? [])];
    }
    const result = await datafn.search({
      query: trimmedSearch,
      resources: [Resource.objective, Resource.task],
      fields: ["label"],
      filters: {
        [Resource.objective]: {
          id: { $ne: "" },
          status: {
            $ne: ObjectiveStatus.COMPLETED
          }
        },
        [Resource.task]: {
          isChecked: false
        }
      },
      source: "local",
      prefix: true,
      fuzzy: 0.2
    });
    const results = result.results?.map((entry: any) => entry.data) ?? [];
    return [
      ...results.filter(
        (item: any) => determineResourceType(item.id) === Resource.objective
      ),
      ...results.filter(
        (item: any) => determineResourceType(item.id) === Resource.task
      )
    ];
  }
</script>

<div class="flex items-center gap-2 w-full px-4 h-14">
  <TextSearchInput
    {onBlur}
    {onFocus}
    onSelect={handleSelect}
    onEmptyEnter={handleEmptyEnter}
    bind:value={label}
    bind:this={inputRef}
    icon="plus"
    emptyStateLabel={{
      mainText: "No objectives or tasks found.",
      subText:
        "Press **Enter** to create a new task or **Shift+Enter** to create a new objective."
    }}
    searchResultComponent={FocusItemSearchResultItem}
    {searchCallback}
    style={InputStyle.PLAIN}
    popoverOptions={{ offsetInPx: 16 }}
    placeholder="start typing an objective or task name..."
  />

  <div class=" justify-end items-center">
    {#if label}
      <div class="flex gap-2">
        <Button
          onclick={reset}
          icon="cross"
          tooltip="Clear"
          tooltipOptions={{
            placement: Placement.Left
          }}
        />
      </div>
    {/if}
  </div>
</div>
