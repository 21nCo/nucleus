<script lang="ts">
  import { formatSeconds } from "@21n/utils/time.utils";
  import type { TopNCardDataRecord } from "@nucleum/features/focus/analytics/analytics.types";

  let { row }: { row: TopNCardDataRecord } = $props();
</script>

<span class="flex gap-2">
  <span class="min-w-fit text-b3 dp:text-b2 2k:text-base">
    {formatSeconds(row.value)}
  </span>
</span>
