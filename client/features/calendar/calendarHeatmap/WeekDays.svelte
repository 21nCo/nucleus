<script lang="ts">
  let days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
</script>

<div>
  <span class="weekDays">Days</span>
  <div class="column text-b5 text-fgs3">
    {#each days as day, index (index)}
      <div class="d+{index} daysItem">{day}</div>
    {/each}
  </div>
</div>

<style>
  .column {
    display: grid;
    grid-auto-flow: column;
    grid-template-rows: repeat(7, auto);
    /* font-size: 12px; */
    gap: 3px 0px;
  }
  .daysItem:nth-child(odd) {
    visibility: hidden;
  }
  .weekDays {
    visibility: hidden;
    font-size: 12px;
  }
</style>
