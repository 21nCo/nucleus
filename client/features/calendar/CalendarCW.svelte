<svelte:options runes={true} />

<script lang="ts">
  import DatePickerRow from "@21n/elements/datetime/DatePickerRow.svelte";
  import Text from "@21n/elements/text/Text.svelte";
  import { Size } from "@21n/elements/size.enum";
  import { TextStyle } from "@21n/elements/text/text.enum";
  import { TimeScaleUnit } from "@21n/utils/time.type";
  import CalendarColumn from "@nucleum/features/calendar/column/CalendarColumn.svelte";
  let selectedDate = $state(new Date());
  let viewDate = $state(new Date());
</script>

<main class="flex flex-col gap-6 w-full p-4 cw:pt-16">
  <!-- <Text style={TextStyle.PAGE_HEADING_SUBTLE} content="Calendar" /> -->
  <div class="flex flex-grow w-full">
    {#key selectedDate}
      <CalendarColumn
        scale={TimeScaleUnit.DAY}
        date={selectedDate}
        isCwContext={true}
        onDateChange={(e) => {
          if (e.detail) selectedDate = e.detail;
        }}
      />
    {/key}
  </div>
</main>
