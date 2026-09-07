<script lang="ts">
  import { pointronPreferences } from "@nucleum/products/pointron/pointron.store";
  import DurationInput from "@21n/elements/input/durationInput/DurationInput.svelte";
  import QuickAddDurationsEditor from "@nucleum/features/focus/logs/manualLog/QuickAddDurationsEditor.svelte";
  import { Orientation } from "@21n/types/direction.enum";
  import SwitchInput from "@21n/elements/toggle/SwitchInput.svelte";
  import context from "@nucleum/stores/context.store";

  if (!$pointronPreferences.manualEntryQuickDurations) {
    pointronPreferences.setSeedManualEntryQuickDurations();
  }

  function onManualEntryQuickDurationsChange(event: CustomEvent) {
    if (!event.detail.values) return;
    pointronPreferences.updateManualEntryQuickDurations(event.detail.values);
  }

  function onBreakReminderChange(event: CustomEvent<{ value: number }>) {
    const value = event.detail?.value;
    if (value != null) pointronPreferences.modify({ breakReminder: value });
  }

  function onPiPChange(event: CustomEvent<boolean>) {
    if (event.detail != null)
      pointronPreferences.modify({ isEnableAutoPiP: !!event.detail });
  }
</script>

<div class="flex flex-col gap-4 w-full">
  <!-- <div>
    <DurationInput
      label={{
        label: "Extend duration",
        tooltip: {
          body: "The default duration to extend the session, when you use dynamic duration."
        },
        orientation: Orientation.Vertical
      }}
      bind:value={$userLocalPreferences.extendDuration}
    />
  </div> -->
  <QuickAddDurationsEditor
    values={$pointronPreferences.manualEntryQuickDurations}
    onChange={onManualEntryQuickDurationsChange}
  />
  <div>
    <DurationInput
      label={{
        label: "Default break reminder",
        tooltip: {
          body: "The maximum duration of an interval after which you will be notified to take a break. This does not apply if you start focus using presets"
        },
        orientation: Orientation.Vertical
      }}
      value={$pointronPreferences.breakReminder ?? 60 * 30}
      onChange={onBreakReminderChange}
    />
  </div>
  {#if !$context.isEmbed}
    <SwitchInput
      label={{
        label: "Automatically activate Picture-in-Picture (PiP) on focus start",
        tooltip: {
          body: "When enabled, the PiP will be automatically activated when a focus session starts. Note: PiP is currently only available on web app."
        }
      }}
      checked={$pointronPreferences.isEnableAutoPiP ?? false}
      onChange={onPiPChange}
      isExpanded={true}
    />
  {/if}
</div>
