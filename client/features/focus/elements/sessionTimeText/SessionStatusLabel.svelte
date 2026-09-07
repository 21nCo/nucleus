<script lang="ts">
  import { activeSession } from "@nucleum/features/focus/session.store";
  import { BlockType } from "@nucleum/features/focus/session.type";
  import { SessionState } from "@nucleum/features/focus/sessionState.enum";
  import { SessionType } from "@nucleum/features/focus/logs/log.type";
  import { Size } from "@21n/elements/size.enum";
  import { formatSeconds } from "@21n/utils/time.utils";
  let {
    size = Size.md,
    isDefaultColor = false
  }: {
    size?: Size;
    isDefaultColor?: boolean;
  } = $props();

  let extentionElapsed = $derived(
    $activeSession.type === SessionType.COUNTDOWN &&
      $activeSession.plannedDuration
      ? $activeSession.totalElapsed -
          ($activeSession.plannedDuration - $activeSession.totalExtended)
      : 0
  );
  let labelClasses = $derived(
    `${size === Size.md ? "font-medium p-3 text-h5 dp:text-h3" : "text-b2"} ` +
      (!isDefaultColor
        ? $activeSession.state === SessionState.FOCUS_RUNNING
          ? "text-aps1"
          : $activeSession.state === SessionState.BREAK_RUNNING
            ? "text-ass1"
            : "text-accent3"
        : "")
  );
  let sessionLabel = $derived(
    $activeSession.state === SessionState.FINISHED
      ? "SESSION FINISHED"
      : $activeSession.state === SessionState.TIME_IS_UP
        ? "TIME UP"
        : $activeSession.state === SessionState.FOCUS_COMPLETED
          ? "INTERVAL COMPLETED"
          : $activeSession.state === SessionState.BREAK_COMPLETED
          ? "BREAK COMPLETED"
          : $activeSession.state === SessionState.BREAK_RUNNING
            ? "CURRENT BREAK"
            : "CURRENT FOCUS"
  );
</script>

<div class={labelClasses}>
  {sessionLabel}
  {#if extentionElapsed && extentionElapsed > 0 && $activeSession.isSessionRunning}
    | extended: {formatSeconds(extentionElapsed)}
  {/if}
</div>
