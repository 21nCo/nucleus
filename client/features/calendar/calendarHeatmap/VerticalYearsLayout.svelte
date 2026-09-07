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
      <MicroIndicatorTile
        data={monthData}
        --width="7px"
        --height="0.5px"
        --direction="row"
      />
    {/each}
  </div>
</div>

<style>
  .yearHolder {
    display: flex;
    gap: 0px 8px;
    align-items: center;
    height: 44px;
    font-size: 12px;
    margin-bottom: 24px;
    /* border: 1px solid blue; */
  }
  .year {
    display: grid;
    grid-auto-flow: column;
    /* column-gap: 2px; */
    /* grid-template-columns: repeat(12, auto); */
    /* justify-content: space-around; */
    /* align-content: space-around; */
  }
</style>
