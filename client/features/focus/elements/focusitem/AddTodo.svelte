<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import { Placement } from "@21n/types/direction.enum";
  import { InputStyle } from "@21n/types/input.type";
  import { Size } from "@21n/types/size.enum";
  import type { IRecordId } from "@21n/types/data.type";
  import TextSearchInput from "@21n/elements/input/TextSearchInput.svelte";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { toasts } from "@nucleum/stores/notification.store";
  import { ErrorMessage } from "@21n/types/resource-error.type";
  import { datafn } from "@nucleum/datafn/datafn.store";

  let {
    objectiveId,
    placeholder = "+ add a task",
    onCreateNew = undefined,
    onSelect = undefined,
    onBlur = undefined,
    onFocus = undefined
  }: {
    objectiveId: IRecordId;
    placeholder?: string;
    onCreateNew?:
      | ((
          event: CustomEvent<{ label: string; objectiveId: IRecordId }>
        ) => void)
      | undefined;
    onSelect?: ((event: CustomEvent<any>) => void) | undefined;
    onBlur?: ((event: CustomEvent<void>) => void) | undefined;
    onFocus?: ((event: CustomEvent<void>) => void) | undefined;
  } = $props();
  let label = $state("");
  let inputRef = $state<TextSearchInput | undefined>();
  export function focus() {
    inputRef?.focus();
  }

  async function createNew() {
    if (!label) return;
    const labelCopy = label;
    reset();
    const createNewEvent = new CustomEvent<{
      label: string;
      objectiveId: IRecordId;
    }>("createNew", {
      detail: {
        label: labelCopy,
        objectiveId
      }
    });
    onCreateNew?.(createNewEvent);
  }

  function reset() {
    label = "";
    inputRef?.reset();
  }

  async function searchCallback(search: string) {
    const trimmedSearch = search?.trim();
    if (!trimmedSearch) {
      const result = await datafn.task.query({
        filters: {
          objectiveId: objectiveId.toString(),
          isChecked: false
        },
        limit: 50,
        sort: ["-updatedAt"]
      });
      return result.data ?? [];
    }
    const result = await datafn.search({
      query: trimmedSearch,
      resources: [Resource.task],
      fields: ["label"],
      filters: {
        [Resource.task]: {
          objectiveId: objectiveId.toString(),
          isChecked: false
        }
      },
      source: "local",
      prefix: true,
      fuzzy: 0.2
    });
    return result.results?.map((entry: any) => entry.data) ?? [];
  }

  async function handleSelect(event: any) {
    try {
      if (!event.detail.item) return;
      const task = event.detail.item;
      const selectEvent = new CustomEvent("select", { detail: task });
      onSelect?.(selectEvent);
    } catch (error: any) {
      toasts.error(error.message ?? ErrorMessage.DEFAULT);
    }
  }
</script>

<div
  class="flex items-center gap-1 w-full pl-3 {objectiveId ? 'h-12' : 'h-14'}"
>
  <TextSearchInput
    onSelect={handleSelect}
    onEmptyEnter={createNew}
    {onFocus}
    {onBlur}
    bind:value={label}
    bind:this={inputRef}
    {searchCallback}
    style={InputStyle.PLAIN}
    {placeholder}
    icon="plus"
    emptyStateLabel={{
      mainText: "No tasks found.",
      subText: "Press **Enter** to create a new task."
    }}
  />
  <div class=" flex justify-end items-center">
    {#if label}
      <div class="flex gap-2 items-center">
        {#if label}
          <Button
            onclick={createNew}
            size={Size.xs}
            icon="plus"
            tooltip="Add"
            ariaLabel="Add task"
            testId={`focus-add-task:${objectiveId}`}
            isPreventMinWidth={true}
          />
        {/if}
        <Button
          onclick={reset}
          icon="cross"
          size={Size.xs}
          tooltip="Clear"
          tooltipOptions={{
            placement: Placement.BottomCenter
          }}
        />
      </div>
    {/if}
  </div>
</div>
