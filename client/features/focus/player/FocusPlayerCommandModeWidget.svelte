<script>
  import { fullScreen } from "@nucleum/stores/overlays/modal.store";
  import { PointronAction } from "@nucleum/client/config/focus-action.enum";
  import { SessionUIContext } from "@nucleum/features/focus/session.type";
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
