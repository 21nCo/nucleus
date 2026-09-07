<script lang="ts">
  import { onMount } from "svelte";
  import TimeSelector from "@nucleum/components/TimeSelector.svelte";
  import { userPreferences } from "@nucleum/stores/preferences/user-preferences.store";
  import DropDown from "@21n/elements/dropdown/DropDown.svelte";
  import MultiselectDropdown from "@21n/elements/dropdown/MultiselectDropdown.svelte";
  import type { DropdownItem } from "@21n/types/dropdownItem.type";
  import Button from "@21n/elements/button/Button.svelte";
  import { ButtonStyle } from "@21n/types/button.type";
  import { Size } from "@21n/types/size.enum";
  import { TimeScale } from "@21n/types/time.type";
  import { properCase } from "@21n/shared-utils/text.utils";
  import { getTimeZonesWithOffsets } from "@21n/utils/time.utils";
  import { InputStyle } from "@21n/types/input.type";
  import { Orientation } from "@21n/types/direction.enum";
  let timeZones: { label: string; offset: number; zone: string }[] = [];
  let timeZoneDropdownItems: (Omit<DropdownItem, "value"> & {
    value: string;
  })[];
  let selectedTimezone: string;
  let isTimezoneReady = $state(false);
  let labelProps = { orientation: Orientation.Vertical };
  let timescaleOptions = Object.keys(TimeScale).map((key) => {
    return {
      label: properCase(key),
      value: TimeScale[key]
    };
  });
  onMount(() => {
    void initializeTimezoneSettings();
  });

  async function initializeTimezoneSettings() {
    timeZones = getTimeZonesWithOffsets();
    if ($userPreferences.timeZone) {
      selectedTimezone = $userPreferences.timeZone;
    } else if (typeof $userPreferences.timeZoneOffset === "number") {
      const savedSetting = timeZones.find(
        (zone) => zone.offset * 60 === $userPreferences.timeZoneOffset
      )?.zone;
      if (savedSetting === undefined) {
        const { timezone } = await userPreferences.setTimeZone();
        selectedTimezone = timezone!;
      } else {
        selectedTimezone = savedSetting;
      }
    } else {
      const { timezone } = await userPreferences.setTimeZone();
      selectedTimezone = timezone!;
    }
    timeZoneDropdownItems = timeZones.map((zone) => {
      return {
        label: zone.label,
        value: zone.zone
      };
    });
    isTimezoneReady = true;
  }

  $effect(() => {
    if (!isTimezoneReady || !selectedTimezone) return;
    const zone = timeZones.find((z) => z.zone === selectedTimezone);
    if (zone) {
      userPreferences.setTimeZone(zone.offset * 60, zone.label, zone.zone);
    }
  });
</script>

<div class="flex flex-col max-w-lg w-full gap-6">
  <!-- <MultiselectDropdown
    label={{
      ...labelProps,
      label: "Time scales",
      tooltip: {
        body: "Only selected time scales will be used throughout the application eg: Analytics, targets etc"
      }
    }}
    options={timescaleOptions}
    bind:selected={$userPreferences.timeScales}
    style={InputStyle.BORDERED}
  /> -->
  {#if timeZoneDropdownItems && timeZoneDropdownItems.length > 0}
    <div class="flex flex-col gap-2">
      <div>
        <DropDown
          label={{
            ...labelProps,
            label: "Timezone",
            tooltip: {
              body: "The timezone used to calculate your daily target and streak."
            }
          }}
          style={InputStyle.BORDERED}
          items={timeZoneDropdownItems}
          bind:value={selectedTimezone}
        />
      </div>
      <div>
        <Button
          label="Auto detect time zone"
          icon="sync"
          style={ButtonStyle.PLAIN}
          size={Size.sm}
          onclick={() => userPreferences.setTimeZone()}
        />
      </div>
    </div>
  {/if}
  <TimeSelector
    label="Day starts at"
    info="The time at which your day starts. This is used to calculate your daily target and streak."
    bind:hour={$userPreferences.dayStartHour}
    bind:minute={$userPreferences.dayStartMinute}
  />
</div>
