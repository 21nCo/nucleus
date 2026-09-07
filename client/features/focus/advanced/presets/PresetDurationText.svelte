<script lang="ts">
  import {
    SessionCompositionType,
    type SessionComposition
  } from "@21n/types/pointron/sessionComposition.type";
  import { formatSeconds } from "@21n/utils/time.utils";
  import { bg, cn } from "@21n/utils/ui.utils";
  let {
    preset,
    isExpandedVariant,
    parentBackgroundIndex,
    isActive
  }: {
    preset: SessionComposition;
    isExpandedVariant: boolean;
    parentBackgroundIndex: number;
    isActive: boolean;
  } = $props();
</script>

{#if preset.type === SessionCompositionType.POMODORO && preset.numberOfFocusRounds}
  <div class="flex text-b3 gap-4 min-w-fit">
    <div class="flex {!isActive && 'text-aps1'}">
      {isExpandedVariant ? "Focus:" : "F:"}&nbsp;
      {#if preset.numberOfFocusRounds > 1}
        <div>
          {preset.numberOfFocusRounds}&nbsp;x&nbsp;
        </div>
      {/if}
      <div class="flex gap-1 items-center">
        <!-- <div>
          {padToTwo(
            preset.focusDuration > 60
              ? preset.focusDuration / 60
              : preset.focusDuration
          )}
        </div> -->
        <div>
          {formatSeconds(preset.focusDuration)}
        </div>
        {#if preset.additional && preset.additional.length > 0}
          <div
            class={cn(
              "flex items-center text-b4 rounded-sm px-1 text-aps1",
              bg(parentBackgroundIndex)
            )}
          >
            <div>+</div>
            <div>
              {preset.additional.length}
            </div>
          </div>
        {/if}
      </div>
    </div>
    {#if isExpandedVariant}
      <div class="flex {!isActive && 'text-ass1'}">
        Break:&nbsp;
        {formatSeconds(preset.breakDuration)}
      </div>
    {/if}
  </div>
{/if}
<div class="flex text-b3">
  {#if preset.type === SessionCompositionType.TARGET_FOCUS}
    {isExpandedVariant ? "Focus target:" : "F:"}&nbsp;
    {formatSeconds(preset.focusDuration)}
  {:else if preset.type === SessionCompositionType.TOTAL_DURATION}
    {isExpandedVariant ? "Total:" : "T:"}&nbsp;
    {formatSeconds(preset.totalDuration)}
  {:else if preset.type === SessionCompositionType.COUNTUP}
    Count up
  {/if}
</div>
