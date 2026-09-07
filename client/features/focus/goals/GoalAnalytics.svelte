<script lang="ts">
  import AnalyticsChartStandalone from "@nucleum/features/focus/analytics/page/AnalyticsChartStandalone.svelte";
  import type { IRecordId } from "@21n/types/data.type";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";

  let { id }: { id: IRecordId } = $props();
</script>

<div class="w-full h-full">
  <AnalyticsChartStandalone
    objectiveId={id}
    accessPoint={ResourceAccessPoint.OBJECTIVE}
  />
</div>
