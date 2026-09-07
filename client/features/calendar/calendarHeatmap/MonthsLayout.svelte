<script lang="ts">
  import MicroIndicatorTile from "@nucleum/features/calendar/calendarHeatmap/MicroIndicatorTile.svelte";
  let { data }: { data: any } = $props();
  const monthName = $derived(data[0]);
  const monthData = $derived(data[1]);
  const index = $derived(data[2]);
  const firstDay = $derived.by(() => {
    const day = new Date(monthData[0].date).getDay();
    return day == 0 ? 7 : day;
  });
  const year = $derived.by(() => {
    const yearValue = monthData[0].date.split("-")[0];
    return " " + yearValue[2] + yearValue[3];
  });
</script>

<div class="py-2">
  <span class="p-1 text-fgs2 text-b2">
    {monthName}
    {index === 0 || monthName === "Jan" ? year : ""}
    <!-- {year} -->
  </span>
  <div class="month">
    <MicroIndicatorTile
      data={monthData[0]}
      classList="firstDay"
      --height="3px"
      --startDay={firstDay}
    />
    {#each monthData.slice(1) as daydata, index (index)}
      <MicroIndicatorTile data={daydata} --height="3px" />
    {/each}
  </div>
</div>

<style>
  .month {
    display: grid;
    grid-auto-flow: column;
    grid-template-rows: repeat(7, auto);
    align-items: normal;
    /* gap: 8px 4px; */
    /* grid-template-columns: repeat(5,auto); */
    /* border: 1px solid blue; */
  }
</style>
