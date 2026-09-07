<script lang="ts">
  import { activeSession } from "@nucleum/features/focus/session.store";
  import { Size } from "@21n/types/size.enum";
  import { formatSeconds } from "@21n/utils/time.utils";
  import { onMount } from "svelte";
  import SessionTimeText from "@nucleum/features/focus/elements/sessionTimeText/SessionTimeText.svelte";
  import { SessionState } from "@21n/types/pointron/sessionState.enum";
  import modalEvent from "@nucleum/components/modal/modal.store";
  import { PointronEvent } from "@21n/types/pointron/pointronEvent.enum";
  onMount(() => {
    const sub = activeSession.subscribe((x) => {
      if (x.state === SessionState.BREAK_RUNNING) {
        modalEvent.hide(PointronEvent.BREAK_REMINDER);
      }
    });
    return () => {
      sub();
    };
  });
</script>

<div
  class="flex flex-col w-full gap-12 p-4 items-center justify-center text-center"
>
  <div class="flex flex-col gap-2">
    <div>
      Its been <strong>{formatSeconds($activeSession.timeElapsed)}</strong> since
      your last break.
    </div>
    <div class="text-b2 text-fgs3">
      To maintain optimal focus and well-being, consider taking a short break
      now.
    </div>
  </div>
  <div class="flex flex-col w-full items-center gap-4">
    <SessionTimeText size={Size.sm} parentBackgroundIndex={1} />
  </div>
</div>
