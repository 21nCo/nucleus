<script lang="ts">
  import CalendarColumn from "@nucleum/features/calendar/column/CalendarColumn.svelte";
  import { TimeScaleUnit } from "@21n/utils/time.type";
  import view from "@nucleum/stores/view.store";
  import { AppSearchParam } from "@nucleum/stores/appStore.type";
  import { page } from "$app/stores";

  let {
    date = new Date(
      $page.url?.searchParams?.get(AppSearchParam.DATE) ??
        new Date().toISOString()
    ),
    scale = TimeScaleUnit.DAY
  }: {
    date?: Date;
    scale?: TimeScaleUnit;
  } = $props();
</script>

<CalendarColumn
  {date}
  {scale}
  isRewind={true}
  isCwContext={$view.isConstrainedWidth}
/>
