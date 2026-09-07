<script lang="ts">
  import { activeSession } from "@nucleum/features/focus/session.store";
  import {
    BreakCompositionType,
    SessionCompositionType,
    type SessionComposition
  } from "@21n/types/pointron/sessionComposition.type";
  import { getTotalsFromComposition } from "@nucleum/features/focus/composition.utils";
  import { formatSeconds } from "@21n/utils/time.utils";
  import { bg, cn } from "@21n/utils/ui.utils";
  let {
    composition,
    parentBgIndex = 1
  }: {
    composition: SessionComposition;
    parentBgIndex?: number;
  } = $props();
  let totals = $derived(getTotalsFromComposition({
    composition, endTime: $activeSession.end
  }));
</script>

<div
  class={cn(
    "flex w-full justify-around opacity-90 text-fgs2 text-b3 sm:text-b2 py-2 rounded-md",
    bg(parentBgIndex)
  )}
>
  <div class="flex justify-start gap-1">
    Total: <span class="min-w-[2rem]">
      {composition.type === SessionCompositionType.COUNTUP
        ? "∞"
        : formatSeconds(totals.duration)}
    </span>
  </div>
  <div class="flex justify-start gap-1 text-aps1">
    Focus: <span class="min-w-[2rem]">
      {composition.type === SessionCompositionType.COUNTUP
        ? "∞"
        : formatSeconds(totals.focus)}
    </span>
  </div>
  <div class="text-ass1">
    Break: {composition.breakType === BreakCompositionType.REMINDER ||
    composition.type === SessionCompositionType.COUNTUP
      ? "NA"
      : formatSeconds(totals.brek)}
  </div>
</div>
