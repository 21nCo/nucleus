<script lang="ts">
  import { onMount } from "svelte";
  import modalEvent from "@nucleum/components/modal/modal.store";
  import { PointronAction } from "@21n/types/pointron/pointronAction.enum";
  import { activeSession } from "@nucleum/features/focus/session.store";
  import { SessionState } from "@21n/types/pointron/sessionState.enum";
  import { cn } from "@21n/utils/ui.utils";
  import { tweened } from "svelte/motion";
  import { linear } from "svelte/easing";

  const duration = 4000; // 4 seconds
  const progress = tweened(100, {
    duration,
    easing: linear
  });

  onMount(() => {
    progress.set(0);
    const timer = setTimeout(() => {
      modalEvent.hide(PointronAction.PREDEFINED_INTERVAL_NOTIFIER_OVERLAY);
    }, duration);
    return () => clearTimeout(timer);
  });
</script>

<div
  data-testid="predefined-interval-notifier"
  role="status"
  class={cn("flex w-full h-full items-center justify-center p-4 text-abg", {
    "bg-ass1": $activeSession.state === SessionState.BREAK_RUNNING,
    "bg-aps1": $activeSession.state === SessionState.FOCUS_RUNNING
  })}
>
  <!-- TODO - Add illustrations -->
  {#if $activeSession.state === SessionState.BREAK_RUNNING}
    BREAK STARTED
  {:else}
    FOCUS STARTED
  {/if}
  <div
    class={cn("absolute bottom-0 left-0 w-full h-2", {
      "bg-ass1": $activeSession.state === SessionState.BREAK_RUNNING,
      "bg-aps1": $activeSession.state === SessionState.FOCUS_RUNNING
    })}
  >
    <div
      class={cn("h-full transition-all duration-100 ease-linear", {
        "bg-ass2": $activeSession.state === SessionState.BREAK_RUNNING,
        "bg-aps2": $activeSession.state === SessionState.FOCUS_RUNNING
      })}
      style="width: {$progress}%;"
    ></div>
  </div>
</div>
