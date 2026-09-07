<script>
  import { fullScreen } from "@nucleum/components/modal/modal.store";
  import { PointronAction } from "@21n/types/pointron/pointronAction.enum";
  import { SessionUIContext } from "@21n/types/pointron/session.type";
  import IntervalBar from "@nucleum/features/focus/elements/intervalbar/IntervalBar.svelte";
  import FocusPlayerTimeText from "@nucleum/features/focus/player/FocusPlayerTimeText.svelte";
</script>

<button
  class="flex flex-col gap-2 items-start justify-center w-80 rounded-md p-2 hover:bg-bgs2"
  onclick={() => {
    fullScreen.show(PointronAction.FULL_SCREEN_FOCUS);
  }}
>
  <FocusPlayerTimeText />
  <!-- <IntervalBar context={SessionUIContext.PIP} /> -->
</button>
