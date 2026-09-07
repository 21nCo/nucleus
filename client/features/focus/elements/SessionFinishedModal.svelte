<script lang="ts">
  import Celebrate from "@21n/icons/Celebrate.svelte";
  import { SessionUIContext } from "@nucleum/features/focus/session.type";
  import { Size } from "@21n/elements/size.enum";
  import IntervalBar from "@nucleum/features/focus/elements/intervalbar/IntervalBar.svelte";
  import SessionTimeText from "@nucleum/features/focus/elements/sessionTimeText/SessionTimeText.svelte";
  //import confetti from "canvas-confetti";
  // confetti({
  //   particleCount: 200,
  //   spread: 70,
  //   origin: { y: 0.6 },
  //   colors: ["#ff90a4", "#ffca65", "#ffe548", "#ffaa87", "#a34a9e", "#f73464"],
  //   zIndex: 2000,
  // });
</script>

<div
  class="flex flex-col w-full gap-12 p-4 items-center justify-center text-center"
>
  <!-- <div>Session finished!</div> -->
  <IntervalBar context={SessionUIContext.THIN_ON_DESKTOP} />
  <div class="flex flex-col w-full items-center gap-4">
    <SessionTimeText size={Size.sm} parentBackgroundIndex={1} />
  </div>
</div>
