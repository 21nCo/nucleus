<script lang="ts">
  import DatePicker from "@21n/elements/datetime/DatePicker.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import TextSearchInput from "@21n/elements/input/TextSearchInput.svelte";
  import type { IRecordId } from "@21n/types/data.type";
  import { InputStyle } from "@21n/types/input.type";
  import { Size } from "@21n/types/size.enum";
  import { onMount } from "svelte";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import {
    ResourceAccessPoint,
    ResourceActionType
  } from "@nucleum/datafn/resource.type";
  import { resourceAction } from "@nucleum/datafn/resource.utils";
  import {
    ObjectiveStatus,
    type IObjective,
    type IObjectiveThumb
  } from "@nucleum/features/focus/goals/goal.type";
  import modalEvent from "@nucleum/components/modal/modal.store";
  import ModalFooter from "@nucleum/components/modal/ModalFooter.svelte";
  import TaskThumbnailObjectiveLabel from "@nucleum/features/focus/tasks/TaskThumbnailGoalLabel.svelte";
  import { Product } from "@21n/types/product.type";
  import { appStore } from "@nucleum/stores/app.store";
  import { resolveUnixTimestamp } from "@21n/shared-utils/time.utils";
  import ShortcutText from "@21n/elements/text/ShortcutText.svelte";
  import { ModifierKey } from "@21n/types/keyboard.type";
  import { toasts } from "@nucleum/stores/notification.store";
  import context from "@nucleum/stores/context.store";
  import { Embed } from "@21n/types/context.type";
  import ObjectiveSearchResultItem from "@nucleum/features/focus/goals/GoalSearchResultItem.svelte";
  import ModalContentPadded from "@nucleum/components/modal/ModalContentPadded.svelte";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { generateResourceId } from "@nucleum/datafn/id.utils";
  import { assertDatafnMutationSucceeded } from "@nucleum/datafn/mutation.utils";

  let {
    date: initialDate = undefined,
    objectiveId: initialObjectiveId = undefined
  }: {
    date?: Date | undefined;
    objectiveId?: IRecordId | undefined;
  } = $props();

  const action = resourceAction(Resource.task, ResourceActionType.CREATE);
  let date = $state<Date | undefined>(initialDate);
  let objectiveId = $state<IRecordId | undefined>(initialObjectiveId);
  let label = $state("");
  let inputRef = $state<TextInput | undefined>(undefined);
  let isShowObjectivePicker = $state(
    $appStore.product === Product.POINTRON ||
      $appStore.product === Product.NUCLEUM
  );
  let objectiveSearchQuery = $state("");
  let objectiveSearchInput = $state<TextSearchInput | undefined>(undefined);
  let objective = $state<IObjective | undefined>(undefined);

  onMount(async () => {
    if (objectiveId) {
      const result = await datafn.objective.query({
        select: ["*", "parent.*"],
        filters: { id: objectiveId.toString() },
        limit: 1
      });
      objective = result.data[0] as IObjective | undefined;
      isShowObjectivePicker = false;
    }
  });

  async function handleCreate(event?: any) {
    const task = {
      id: generateResourceId(Resource.task),
      label,
      dateUnix: date ? resolveUnixTimestamp(date) : 0,
      isChecked: false,
      objectiveId: objectiveId ?? objective?.id ?? ""
    };
    const mutationResult = await datafn.task.mutate({
      operation: "insert",
      id: task.id,
      record: task,
      context: action
    });
    assertDatafnMutationSucceeded(mutationResult);
    appStore.addToRecents({
      record: task,
      type: Resource.task,
      timestamp: new Date()
    });
    const result = [task];
    if (result) {
      if (event instanceof KeyboardEvent && event.shiftKey === true) {
        toasts.success("Task created successfully");
        label = "";
        isShowObjectivePicker = true;
        objectiveId = undefined;
        objective = undefined;
        return;
      }
    }
    return result;
  }

  async function handleCreateOnEnter(e: any) {
    const result = await handleCreate(e.detail.event);
    if (result) modalEvent.hide(action);
  }

  function resolveObjectiveThumb(objective: IObjective) {
    return objective as unknown as IObjectiveThumb;
  }

  function searchObjectiveCallback(query: string) {
    return datafn.objective.query({
      select: ["*", "parent.*"],
      search: query ? { query, fields: ["label"] } : undefined,
      limit: 30,
      filters: {
        status: {
          $ne: ObjectiveStatus.COMPLETED
        }
      }
    }).then((result) => result.data);
  }
</script>

<div
  class="cw:w-full w-[32rem] h-auto min-h-[16rem] flex flex-col justify-between gap-4 rounded-lg bg-bgs1"
>
  <ModalContentPadded class="flex flex-col gap-3">
    {#if isShowObjectivePicker}
      <div class="transition-all duration-200">
        <TextSearchInput
          bind:value={objectiveSearchQuery}
          bind:this={objectiveSearchInput}
          searchCallback={searchObjectiveCallback}
          searchResultComponent={ObjectiveSearchResultItem}
          placeholder="Assign to an objective"
          onSelect={(e) => {
            objective = e.detail.item;
            isShowObjectivePicker = false;
          }}
          style={InputStyle.PLAIN}
        />
      </div>
    {:else if objective}
      <div class="transition-all duration-200">
        <TaskThumbnailObjectiveLabel
          objective={resolveObjectiveThumb(objective)}
          onClearObjective={() => {
            isShowObjectivePicker = true;
          }}
          accessPoint={ResourceAccessPoint.CAPTURE}
        />
      </div>
    {/if}
    <div class="flex items-center gap-3">
      <div class="flex-1">
        <TextInput
          bind:value={label}
          bind:this={inputRef}
          size={Size.lg}
          onMount={() => {
            inputRef?.focus();
          }}
          placeholder="Enter task name"
          testId="task-name-input"
          style={InputStyle.PLAIN}
          onEnter={handleCreateOnEnter}
        />
      </div>
      <span class="flex items-center shrink-0">
        <DatePicker
          bind:date
          style={InputStyle.PLAIN}
          variant={date ? "inline-with-icon" : "icon-only"}
        />
      </span>
    </div>
  </ModalContentPadded>
  <div class="flex flex-col gap-3 mt-2">
    {#if $context.embed !== Embed.HANDSET}
      <div class="text-b3 text-fgs3 flex gap-1 justify-center py-1">
        <span>Press</span>
        <ShortcutText
          parentBgIndex={1}
          isAlwaysShown={true}
          shortcut={{
            key: "Enter",
            modifiers: [ModifierKey.SHIFT]
          }}
        />
        <span>to save this task and create another</span>
      </div>
    {/if}
    <ModalFooter
      {action}
      size={Size.sm}
      primaryAction={{
        label: "Create",
        icon: "proceed",
        callback: handleCreate
      }}
      secondaryAction={{
        label: "Cancel",
        icon: "cross"
      }}
    />
  </div>
</div>
