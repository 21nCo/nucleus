<script lang="ts">
  import MicroIndicatorTile from "@nucleum/features/calendar/calendarHeatmap/MicroIndicatorTile.svelte";
  let { data }: { data: any } = $props();
  const year = $derived(data[0]);
  const yearData = $derived(data[1]);
</script>

<div class="yearHolder">
  {year}
  <div id={year} class="year">
    {#each yearData as monthData, index (index)}
      <MicroIndicatorTile data={monthData} />
    {/each}
  </div>
</div>

<style>
  .yearHolder {
    text-align: center;
    margin-bottom: 24px;
  }
  .year {
    display: grid;
    grid-auto-flow: column;
    grid-template-rows: repeat(6, auto);
    justify-content: space-around;
    align-content: space-around;
    /* border: 1px solid blue; */
  }
</style>
