<script lang="ts">
  import MacroIndicatorTIle from "@nucleum/features/calendar/calendarHeatmap/MacroIndicatorTIle.svelte";
  let { data }: { data: any } = $props();
  const QD = $derived(data[0]);
  const QDData = $derived(data[1]);
</script>

<div id={QD} class="quad">
  {#each QDData as yearData, index (index)}
    <MacroIndicatorTIle
      data={yearData}
      --width="4px"
      --height="0.5px"
      --direction="row"
    />
  {/each}
</div>

<style>
  .quad {
    display: grid;
    grid-auto-flow: column;
    /* grid-template-columns: repeat(4, 20px); */

    /* border: 1px solid blue; */
  }
</style>
