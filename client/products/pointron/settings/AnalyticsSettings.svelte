<script lang="ts">
  import { pointronPreferences } from "@nucleum/features/focus/preferences.store";
  import SwitchInput from "@21n/elements/toggle/SwitchInput.svelte";
  import { Orientation } from "@21n/elements/direction.enum";
</script>

<div class="flex flex-col gap-4 w-full">
  <SwitchInput
    label={{
      label: "Include break in analytics",
      orientation: Orientation.Horizontal
    }}
    isExpanded={true}
    bind:checked={$pointronPreferences.isIncludeBreakInAnalytics}
  />
</div>
