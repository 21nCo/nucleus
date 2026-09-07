<script lang="ts">
  import { mount } from "@nucleum/actions/mount.action";
  import { type IActiveObjectiveStore } from "@nucleum/features/focus/goals/goal.store";
  import Breadcrumbs from "@21n/elements/breadcrumbsV2/Breadcrumbs.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import { AccessMode } from "@nucleum/datafn/resource.type";
  import RecordStarStatusFeedback from "@nucleum/components/record/RecordStarStatusFeedback.svelte";
  import { AlertType, type IInlineStatus } from "@21n/types/notification.type";
  import ResourceInlineCloseButton from "@21n/elements/button/ResourceInlineCloseButton.svelte";

  let {
    objective,
    isConstrainedWidth = false,
    status = $bindable()
  }: {
    objective: IActiveObjectiveStore;
    isConstrainedWidth?: boolean;
    status?: IInlineStatus | undefined;
  } = $props();

  let labelEditVal = $state($objective.label);
  let inputRef = $state<TextInput | undefined>(undefined);

  function resolveBreadcrumbs() {
    if (!$objective.parent) return [];
    const parentItems = $objective.parent?.map((p) => ({
      label: p.label ?? "",
      resourceId: p.id?.toString()
    }));
    if (parentItems && parentItems.length > 0) {
      parentItems.push({
        label: $objective.label ?? "",
        resourceId: $objective.id?.toString()
      });
    }
    return parentItems;
  }

  async function handleLabelChange(e: CustomEvent<string>) {
    status = {
      message: "Saving...",
      type: AlertType.PROGRESS
    };
    try {
      await objective.modify({
        label: e.detail
      });
    } catch {
      status = {
        message: "Failed to save objective name",
        type: AlertType.ERROR
      };
      return;
    }
    status = {
      message: "Objective name saved",
      type: AlertType.SUCCESS
    };
  }

  async function handleLabelSave(e: CustomEvent<{ value?: string }>) {
    const nextLabel = e.detail?.value ?? labelEditVal;
    $objective.label = nextLabel;
    await objective.modify({
      label: nextLabel
    });
    labelEditVal = "";
    objective.toggleEditMode(false);
  }
</script>

<div
  class={cn("flex flex-col items-center gap-1 userdata", {
    "px-3 lp:px-6 pt-2": isConstrainedWidth
  })}
>
  <!-- <Icon icon={resolveTaskTypeIcon($task.type)} class="text-fgs3" /> -->
  <div class="w-full flex items-center justify-between gap-1">
    <div class="flex flex-col flex-1 min-w-0">
      {#if !$objective.isInEditMode}
        <Breadcrumbs items={resolveBreadcrumbs()} />
      {/if}
      {#if $objective.isInEditMode}
        <div
          class="flex items-center gap-2 w-full"
          use:mount={() => {
            labelEditVal = $objective.label;
            inputRef?.focus();
          }}
        >
          <span class="flex-1">
            <TextInput
              bind:this={inputRef}
              bind:value={labelEditVal}
              placeholder="Enter objective name"
              testId="objective-name-input"
              width="w-full"
              parentBackgroundIndex={2}
              onDebouncedChange={handleLabelChange}
              onSave={handleLabelSave}
              onEnter={handleLabelSave}
              onCancel={() => {
                objective.toggleEditMode(false);
                labelEditVal = "";
              }}
            />
          </span>
        </div>
      {:else}
        <button
          class="w-full"
          onclick={() => {
            objective.toggleEditMode(true);
            labelEditVal = $objective.label;
          }}
        >
          <div class="flex items-center gap-2 w-full">
            <h1 class="text-left text-h4 lp:text-h3 font-medium text-ccs1-fgs1">
              {$objective.label ? $objective.label : "Untitled"}
            </h1>
            <RecordStarStatusFeedback isStarred={$objective.isStarred} />
          </div>
        </button>
      {/if}
    </div>
    {#if isConstrainedWidth}
      <ResourceInlineCloseButton
        accessMode={$objective.accessMode}
        additionalAccessModes={[AccessMode.POP]}
        parentBgIndex={2}
        id={$objective.id}
      />
    {/if}
  </div>
</div>
