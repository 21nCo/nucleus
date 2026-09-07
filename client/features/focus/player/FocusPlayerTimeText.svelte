<script lang="ts">
  import {
    activeSession,
    currentFocusItem
  } from "@nucleum/features/focus/session.store";
  import { SessionUIContext } from "@21n/types/pointron/session.type";
  import { SessionState } from "@21n/types/pointron/sessionState.enum";
  import { Size } from "@21n/types/size.enum";
  import { TimeFormat } from "@21n/types/time.type";
  import { formatSeconds } from "@21n/utils/time.utils";
  import { cn } from "@21n/utils/ui.utils";
  import SessionStatusLabel from "@nucleum/features/focus/elements/sessionTimeText/SessionStatusLabel.svelte";
  import { determineResourceType } from "@nucleum/datafn/resource.utils";
  import type { IRecordId } from "@21n/types/data.type";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { toSvelteStore } from "@datafn/svelte";

  let { context = SessionUIContext.DEFAULT }: { context?: SessionUIContext } =
    $props();

  let isBreakReminderMode = $derived(
    $activeSession.timeRemainingToTakeBreak != undefined &&
      $activeSession.timeRemainingToTakeBreak < 0
  );

  const currentTaskRecordStore = $derived.by(() => {
    const focusItem = $currentFocusItem;
    if (!focusItem?.id) return undefined;
    const resource = determineResourceType(focusItem.id);
    return toSvelteStore<Array<{ id: IRecordId; label?: string }>>(
      datafn.table(resource).signal({
        filters: { id: focusItem.id },
        select: ["id", "label"],
        limit: 1,
        metadata: {
          includeTrashed: true,
          includeArchived: true
        }
      }),
      { initialData: [] }
    );
  });

  const currentTask = $derived.by(() => {
    if (!currentTaskRecordStore) return undefined;
    const record = $currentTaskRecordStore!.data[0];
    if (!record) return undefined;
    return {
      id: record.id,
      label: record.label ?? ""
    };
  });
</script>

<div class="flex flex-col items-start w-full">
  <div class="flex-1 min-w-0 w-full text-start">
    {#if isBreakReminderMode}
      <div class="animate-pulse">BREAK REMINDER</div>
    {:else if currentTask?.label && $activeSession.state === SessionState.FOCUS_RUNNING}
      <div
        class={cn("text-left truncate text-b2 dp:text-base userdata", {
          "text-ccs1":
            context === SessionUIContext.PIP ||
            context === SessionUIContext.OBJECTIVE_PAGE
        })}
      >
        {context === SessionUIContext.OBJECTIVE_PAGE
          ? "Focusing now..."
          : (currentTask?.label ?? "")}
      </div>
    {:else}
      <SessionStatusLabel
        size={Size.sm}
        isDefaultColor={context === SessionUIContext.FOCUS_PLAYER}
      />
    {/if}
  </div>
  <div class="font-semibold text-h2 leading-tight tabular-nums">
    {formatSeconds($activeSession.timeElapsed, TimeFormat.CLOCK)}
  </div>
</div>
