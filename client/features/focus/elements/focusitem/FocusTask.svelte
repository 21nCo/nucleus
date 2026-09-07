<script lang="ts">
  import {
    focusItemsStore,
    activeSession,
    currentFocusItem
  } from "@nucleum/features/focus/session.store";
  import type {
    ISessionInterval,
    IFocusItem,
    ICurrentFocusItem
  } from "@21n/types/pointron/session.type";
  import { SessionState } from "@21n/types/pointron/sessionState.enum";
  import Button from "@21n/elements/button/Button.svelte";
  import Icon from "@21n/elements/Icon.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import view from "@nucleum/stores/view.store";
  import { Size } from "@21n/types/size.enum";
  import { formatSeconds } from "@21n/utils/time.utils";
  import { onMount } from "svelte";
  import { InputStyle } from "@21n/types/input.type";
  import { cn } from "@21n/utils/ui.utils";
  import { SessionType } from "@nucleum/features/focus/logs/log.type";
  import { resolveTaskFocus } from "@nucleum/features/focus/session.utils";
  import { isSameResource } from "@nucleum/datafn/resource.utils";
  import type { ITaskThumb } from "@nucleum/features/focus/tasks/task.type";
  import TaskCheckbox from "@nucleum/features/focus/tasks/TaskCheckbox.svelte";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import { popover } from "@nucleum/actions/popover.action";
  import FocusTaskEstimatedTimePopover from "@nucleum/features/focus/elements/focusitem/FocusTaskEstimatedTimePopover.svelte";
  import { datafn } from "@nucleum/datafn/datafn.store";
  let {
    task,
    focusItem,
    isInEditMode = false,
    intervals = [],
    context = "current",
    isStandalone = false,
    onRemove = undefined
  }: {
    task: ITaskThumb;
    focusItem: IFocusItem;
    isInEditMode?: boolean;
    intervals?: ISessionInterval[];
    context?: "current" | "history";
    isStandalone?: boolean;
    onRemove?: ((event: CustomEvent<any>) => void) | undefined;
  } = $props();
  let workedTime: number = 0;
  let isInprogress = $state(false);
  let isChecked = $state(false);
  let labelInputElement: any;
  let labelEntry = $state("");
  let scrollToTask: any = null;
  function resolveWorkedTime() {
    if (
      context === "history" &&
      "worked" in focusItem &&
      typeof focusItem.worked === "number"
    ) {
      return focusItem.worked;
    }
    return resolveTaskFocus(
      context === "history" ? intervals : $activeSession.intervals,
      focusItem.blocks,
      isInprogress && $currentFocusItem ? $currentFocusItem.start : undefined
    );
  }
  let workedTimeDerived = $derived(resolveWorkedTime());
  onMount(() => {
    // workedTime = +task.worked;
    // estimateInMinutes = task.estimated;
    if (context === "history") return;
    const sub = currentFocusItem.subscribe(
      (x: ICurrentFocusItem | undefined) => {
        if (x && isSameResource(x, focusItem)) {
          isInprogress = true;
        } else {
          isInprogress = false;
        }
      }
    );
    return () => sub();
  });

  $effect(() => {
    labelEntry = task.label ?? "";
  });

  $effect(() => {
    isChecked = Boolean(task.isChecked);
  });

  $effect(() => {
    if (isInprogress && scrollToTask) {
      scrollToTask.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  async function onLabelChange(event: CustomEvent<string>) {
    task.label = event.detail;
    await datafn.task.mutate({
      operation: "merge",
      id: task.id.toString(),
      record: {
        id: task.id.toString(),
        label: event.detail
      },
      context: ResourceAccessPoint.FOCUS
    });
  }

  async function onCheckClicked(event: CustomEvent<any>) {
    if (context === "history") return;
    if (isInprogress) {
      isInprogress = false;
      await activeSession.stopCurrentFocusItem();
    }
  }

  async function clickHandler() {
    if (
      isInEditMode ||
      context === "history" ||
      ($activeSession.isSessionRunning &&
        $activeSession.type === SessionType.PREDEFINED_INTERVALS &&
        $activeSession.state === SessionState.BREAK_RUNNING)
    )
      return;
    if ($activeSession.isSessionRunning) {
      if (isInprogress) {
        await activeSession.stopCurrentFocusItem();
      } else {
        if (isChecked) {
          isChecked = false;
          task.isChecked = false;
        }
        await activeSession.startTask(focusItem.id);
      }
    } else {
      labelInputElement.focus();
    }
  }

  async function handleRemove() {
    const removeEvent = new CustomEvent("remove", {
      detail: focusItem.id
    });
    onRemove?.(removeEvent);
  }

  async function onEstimatedTimeChange(e: CustomEvent<{ value: number }>) {
    if (!e.detail?.value) return;
    const value = e.detail.value;
    task.estimated = value;
    await datafn.task.mutate({
      operation: "merge",
      id: task.id.toString(),
      record: {
        id: task.id.toString(),
        estimated: value
      },
      context: ResourceAccessPoint.FOCUS
    });
  }

  function handleRootKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      void clickHandler();
    }
  }
</script>

<div
  class={cn("flex gap-2 items-center w-full", {
    "border border-brs3 rounded-md": isStandalone
  })}
>
  <div
    class={cn(
      "relative w-full flex gap-2 items-center justify-between px-4 h-12 rounded-md ",
      {
        "bg-ccs1 border-ccs1": isInprogress,
        "pl-8": isInEditMode
      }
    )}
    data-current-focus={isInprogress ? "true" : "false"}
    onclick={clickHandler}
    role="button"
    tabindex="0"
    onkeydown={handleRootKeyDown}
  >
    {#if isInEditMode}
      <span class="absolute left-2 top-3.5">
        <Icon
          icon="rearrange"
          class={cn({
            "text-cbg": isInprogress,
            "text-fgs2": !isInprogress
          })}
        />
      </span>
    {/if}
    <div
      class="flex gap-2 flex-grow justify-start items-center truncate {isChecked &&
        'line-through'}"
    >
      <TaskCheckbox
        id={task.id}
        bind:isChecked
        accessPoint={ResourceAccessPoint.FOCUS}
        onToggle={onCheckClicked}
        isAccentBg={isInprogress}
      />
      {#if isInEditMode || (context === "current" && !$activeSession.isSessionRunning)}
        <TextInput
          onDebouncedChange={onLabelChange}
          bind:this={labelInputElement}
          bind:value={labelEntry}
          placeholder="Enter task label"
          style={InputStyle.PLAIN}
          size={Size.md}
          isAccentBackground={isInprogress}
        />
      {:else}
        <div class="text-b2" bind:this={scrollToTask}>{task.label}</div>
      {/if}
    </div>
    <div class="min-w-fit flex justify-center items-center">
      <button
        class="flex items-center gap-1 text-b3"
        onclick={(event) => event.stopPropagation()}
        use:popover={{
          content: FocusTaskEstimatedTimePopover,
          isRenderAsModalForCW: true,
          componentProps: {
            estimatedTime: task.estimated,
            onChange: onEstimatedTimeChange
          }
        }}
      >
        <Icon
          icon="ph:clock-countdown-light"
          size={Size.sm}
          class={cn({
            "fill-cbg": isInprogress
          })}
        />
        <div
          class={task.estimated == 0 || !task.estimated || isInprogress
            ? ""
            : workedTimeDerived >= task.estimated
              ? "text-ars1"
              : "text-ags1"}
        >
          {formatSeconds(workedTimeDerived)}
        </div>
        {task.estimated && task.estimated != 0
          ? "/ " + formatSeconds(task.estimated)
          : ""}
      </button>
    </div>
  </div>
  {#if isInEditMode || (context === "current" && !$activeSession.isSessionRunning)}
    <Button
      icon="cross"
      onclick={handleRemove}
      tooltip="Remove"
      ariaLabel={`Remove ${task.label}`}
      testId={`focus-session-remove:${focusItem.id}`}
    />
  {/if}
</div>
