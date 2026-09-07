<script>
  import { TimeScaleUnit } from "@21n/types/time.type";
  import CalendarColumn from "./column/CalendarColumn.svelte";
</script>

<div class="w-full h-full flex flex-grow bg-bgs1">
  <CalendarColumn date={new Date()} scale={TimeScaleUnit.DAY} />
</div>
