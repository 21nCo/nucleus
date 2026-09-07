<script lang="ts">
  import { Size } from "@21n/elements/size.enum";
  import type { ITaskThumb } from "./task.type";
  import type { Arrangement } from "@21n/elements/direction.enum";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import TaskThumbnail from "./TaskThumbnail.svelte";
  import TaskThumbnailObjectiveLabel from "./TaskThumbnailGoalLabel.svelte";
  import type { IObjectiveThumb } from "../goals/goal.type";
  import CreateTaskInlineWizard from "./CreateTaskInlineWizard.svelte";
  import Button from "@21n/elements/button/Button.svelte";
  import { truncateString } from "@21n/shared-utils/text.utils";

  let {
    tasks,
    accessPoint,
    accessPointId = undefined,
    parentBgIndex,
    arrangement,
    isDisableGrouping = false,
    date = undefined
  }: {
    tasks: ITaskThumb[];
    accessPoint: ResourceAccessPoint;
    accessPointId?: IRecordId | undefined;
    parentBgIndex: number;
    arrangement: Arrangement;
    isDisableGrouping?: boolean;
    date?: Date | undefined;
  } = $props();

  let createTaskWizardForObjective = $state<IRecordId | undefined>(undefined);
  const tasksByObjective = $derived(
    isDisableGrouping ? null : groupTasksByObjective(tasks)
  );

  function resolveSize(accessPoint: ResourceAccessPoint) {
    if (
      accessPoint === ResourceAccessPoint.LIBRARY ||
      accessPoint === ResourceAccessPoint.OBJECTIVE
    ) {
      return Size.lg;
    }
    return Size.md;
  }

  function groupTasksByObjective(tasks: ITaskThumb[]) {
    const groups = new Map<
      IRecordId,
      { tasks: ITaskThumb[]; objective: IObjectiveThumb }
    >();
    let nonObjectiveTasks: ITaskThumb[] = [];
    const tasksByObjectiveId = new Map<IRecordId, ITaskThumb[]>();

    for (const task of tasks) {
      if (!task.objectiveId) {
        nonObjectiveTasks.push(task);
        continue;
      }

      const existing = tasksByObjectiveId.get(task.objectiveId);
      if (existing) {
        existing.push(task);
      } else {
        tasksByObjectiveId.set(task.objectiveId, [task]);
      }
    }

    for (const [objectiveId, objectiveTasks] of tasksByObjectiveId.entries()) {
      if (objectiveTasks.length > 1 && objectiveTasks[0].objective) {
        groups.set(objectiveId, {
          tasks: objectiveTasks,
          objective: objectiveTasks[0].objective
        });
      } else {
        nonObjectiveTasks.push(...objectiveTasks);
      }
    }

    return { groups, nonObjectiveTasks };
  }
</script>

{#if isDisableGrouping}
  <div class="flex flex-col gap-2">
    {#each tasks as item (item.id)}
      <TaskThumbnail
        {item}
        {accessPoint}
        {accessPointId}
        {parentBgIndex}
        {arrangement}
        isShowObjective={accessPoint !== ResourceAccessPoint.OBJECTIVE}
        size={resolveSize(accessPoint)}
      />
    {/each}
  </div>
{:else if tasksByObjective}
  <div class="flex flex-col gap-2">
    {#each [...tasksByObjective.groups.entries()] as [objectiveId, group] (objectiveId)}
      <div
        class="flex flex-col gap-1 pl-1 py-2 pr-1 border rounded-md border-brs2"
      >
        <div class="px-2 flex justify-between w-full">
          <div class="flex flex-1 min-w-0">
            <TaskThumbnailObjectiveLabel objective={group.objective} {accessPoint} />
          </div>
          <Button
            icon="plus"
            tooltip={`Create task for ${truncateString(group.objective.label ?? "objective", 20)}`}
            size={Size.sm}
            onclick={() => (createTaskWizardForObjective = objectiveId)}
          />
        </div>
        {#if createTaskWizardForObjective === objectiveId}
          <div class="flex w-full mb-2">
            <CreateTaskInlineWizard
              {objectiveId}
              {date}
              onClose={() => (createTaskWizardForObjective = undefined)}
            />
          </div>
        {/if}
        {#each group.tasks as task (task.id)}
          <TaskThumbnail
            item={task}
            {accessPoint}
            {accessPointId}
            {parentBgIndex}
            {arrangement}
            size={resolveSize(accessPoint)}
          />
        {/each}
      </div>
    {/each}
    {#each tasksByObjective.nonObjectiveTasks as task (task.id)}
      <TaskThumbnail
        item={task}
        {accessPoint}
        {accessPointId}
        {parentBgIndex}
        {arrangement}
        isShowObjective={true}
        size={resolveSize(accessPoint)}
      />
    {/each}
  </div>
{/if}
