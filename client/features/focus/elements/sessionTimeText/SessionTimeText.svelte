<script lang="ts">
  import { activeSession } from "@nucleum/features/focus/session.store";
  import view from "@nucleum/stores/view.store";
  import { Size } from "@21n/types/size.enum";
  import { TimeFormat } from "@21n/types/time.type";
  import { formatSeconds } from "@21n/utils/time.utils";
  import SessionStatusLabel from "@nucleum/features/focus/elements/sessionTimeText/SessionStatusLabel.svelte";
  import { bg, cn } from "@21n/utils/ui.utils";
  import { deepCopy } from "@21n/shared-utils/obj.utils";
  import { SessionCompositionType } from "@21n/types/pointron/sessionComposition.type";
  import { resolveSessionSplitFromIntervals } from "@nucleum/features/focus/composition.utils";
  let {
    parentBackgroundIndex = 1,
    size = Size.md
  }: {
    parentBackgroundIndex?: number;
    size?: Size;
  } = $props();
  let splits = $derived(resolveSessionSplitFromIntervals($activeSession.intervals));
</script>

<div class="flex w-full flex-col items-center gap-3">
  <div class="flex flex-col items-center gap-1">
    <SessionStatusLabel size={$view.isPortrait ? Size.sm : Size.md} />
    <div
      class={cn("flex justify-center tabular-nums slashed-zero", {
        "text-5xl dp:text-7xl font-bold": size === Size.sm,
        "text-7xl dp:text-9xl font-black": size !== Size.sm,
        "text-ars1":
          $activeSession.timeRemainingToTakeBreak != undefined &&
          $activeSession.timeRemainingToTakeBreak < 0
      })}
    >
      {formatSeconds(
        $activeSession.isSessionRunning
          ? $activeSession.timeElapsed
          : splits.focus + splits.brek,
        TimeFormat.CLOCK
      )}
    </div>
  </div>
  <div
    class={cn(
      "flex justify-evenly rounded-md py-3 w-full mo:text-b3 text-b2 dp:text-base text-wrap tabular-nums",
      bg(parentBackgroundIndex)
    )}
  >
    <div>
      Session: {formatSeconds($activeSession.totalElapsed, TimeFormat.CLOCK)}
    </div>
    <div class="text-aps1">
      F: {formatSeconds(splits.focus, TimeFormat.CLOCK)}
      {#if $activeSession.composition?.type == SessionCompositionType.TARGET_FOCUS}
        / {formatSeconds(
          $activeSession.composition.focusDuration,
          TimeFormat.CLOCK
        )}
      {/if}
    </div>
    <div class="text-ass1">
      B: {formatSeconds(splits.brek, TimeFormat.CLOCK)}
    </div>
  </div>
</div>
