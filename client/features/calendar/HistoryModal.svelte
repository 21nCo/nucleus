<script lang="ts">
  import CalendarHistoryPanel from "@nucleum/features/calendar/column/CalendarHistoryPanel.svelte";
  import { AppSearchParam } from "@nucleum/stores/appStore.type";
  import { page } from "$app/stores";
  let {
    date = new Date(
      $page.url?.searchParams?.get(AppSearchParam.DATE) ??
        new Date().toISOString()
    )
  }: {
    date?: Date;
  } = $props();
</script>

<CalendarHistoryPanel {date} />
