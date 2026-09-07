<script>
  import MicroIndicatorTile from "@nucleum/features/calendar/calendarHeatmap/MicroIndicatorTile.svelte";
  import { TileAppearance } from "@nucleum/features/calendar/calendarHeatmap/calendarHeatmap.types";
</script>

<div class="flex gap-2 justify-end mr-5 text-sm">
  {"Less"}
  {#each Array.from({ length: 5 }, (_, i) => 0 + i) as _, index}
    <MicroIndicatorTile
      data={{
        date: "",
        value: 0,
        display: TileAppearance.DEFAULT,
        color: index
      }}
    />
    <!-- stop propogation for emiited event from MicroIndicatorTile only for footer -->
  {/each}
  {"More"}
</div>
