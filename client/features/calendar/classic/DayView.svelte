<script lang="ts">
  import { Size } from "@21n/types/size.enum";
  import { cn } from "@21n/utils/ui.utils";

  let {
    selectedDate,
    events = []
  }: {
    selectedDate: Date;
    events?: any[];
  } = $props();

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const weekDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];

  const isToday = $derived(
    selectedDate.getDate() === new Date().getDate() &&
      selectedDate.getMonth() === new Date().getMonth() &&
      selectedDate.getFullYear() === new Date().getFullYear()
  );
</script>

<div class="grid grid-cols-[auto_1fr] h-full">
  <!-- Time labels -->
  <div class="border-r border-brs3">
    <div class="h-12 border-b border-brs3" />
    <!-- Empty corner -->
    {#each hours as hour}
      <div
        class="h-12 px-2 border-b border-brs3 text-fgs3 text-sm flex items-center justify-end"
      >
        {hour === 0 ? "12" : hour > 12 ? hour - 12 : hour}
        {hour >= 12 ? "PM" : "AM"}
      </div>
    {/each}
  </div>

  <!-- Day grid -->
  <div class="overflow-auto">
    <!-- Day header -->
    <div
      class="h-12 border-b border-brs3 sticky top-0 bg-bgs1 flex flex-col items-center justify-center"
    >
      <div class="text-sm text-fgs2">{weekDays[selectedDate.getDay()]}</div>
      <div class={cn("text-sm font-medium", isToday && "text-aps1")}>
        {selectedDate.getDate()}
      </div>
    </div>

    <!-- Time slots -->
    <div>
      {#each hours as hour}
        <div class="h-12 border-b border-brs3" />
      {/each}
    </div>
  </div>
</div>
