<script>
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
</script>

<div class="monthsHeader">
  <span class="hid">{"Months"}</span>
  {#each monthNames as month}
    <div class="month">{month}</div>
  {/each}
</div>

<style>
  .monthsHeader {
    display: flex;
    font-size: 11px;
    /* height: 10px; */
    justify-content: space-between;
    margin-bottom: 8px;
    margin-right: 5px;
  }
  /* .monthsHeader .month {
    margin-right: 2px;
  } */
  .hid {
    visibility: hidden;
    font-size: 10px;
  }
</style>
