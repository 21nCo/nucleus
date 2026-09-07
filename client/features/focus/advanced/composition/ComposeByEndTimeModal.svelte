<script lang="ts">
  import { activeSession } from "@nucleum/features/focus/session.store";
  import {
    SessionCompositionType,
    type SessionComposition
  } from "@21n/types/pointron/sessionComposition.type";
  import TimeSelector from "@nucleum/components/TimeSelector.svelte";
  import { Orientation } from "@21n/types/direction.enum";
  import { incrementTime } from "@21n/utils/time.utils";
  import ComposeBreak from "@nucleum/features/focus/advanced/composition/ComposeBreak.svelte";
  import ComposeTotalsText from "@nucleum/features/focus/advanced/composition/ComposeTotalsText.svelte";
  import { deepCopy } from "@21n/shared-utils/obj.utils";
  import { advancedCompositionDraft } from "@nucleum/features/focus/advanced/composition/advancedCompositionDraft.store";
  export const id: string = "";
  let endTime: Date = new Date(incrementTime(new Date(), 1, true));
  let hour = $state(endTime.getHours());
  let minute = $state(endTime.getMinutes());
  let composition = $state<SessionComposition>(
    deepCopy(activeSession.get().composition)
  );
  onChange();
  function resolveEndTime() {
    const endTime = new Date();
    endTime.setHours(hour);
    endTime.setMinutes(minute);
    endTime.setSeconds(0);
    endTime.setMilliseconds(0);
    return endTime;
  }
  async function onChange() {
    composition.type = SessionCompositionType.END_TIME_FIXED;
    const nextComposition = deepCopy(composition);
    advancedCompositionDraft.set(nextComposition);
    await activeSession.modify(
      {
        end: resolveEndTime(),
        composition: nextComposition
      },
      { isPersist: false }
    );
    activeSession.onComposeComplete(false);
  }
</script>

<div class="flex flex-col h-full w-full gap-12">
  <ComposeTotalsText {composition} />
  <div class="flex flex-col gap-6 w-full">
    <TimeSelector
      label="Session end time"
      bind:hour
      bind:minute
      labelOrientation={Orientation.Horizontal}
      onChange={onChange}
      isShowOnlyAfterCurrentTime={true}
    />
    <ComposeBreak
      onChange={onChange}
      bind:composition
    />
  </div>
</div>
