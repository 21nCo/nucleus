<script lang="ts">
  import { parseAndFormatDate } from "@21n/utils/time.utils";
  import type { IObjectiveThumb } from "@nucleum/features/focus/goals/goal.type";

  let { item }: { item: IObjectiveThumb } = $props();
</script>

{#if item.startDate || item.endDate}
  <span class="text-left text-b3 text-fgs3">
    {#if item.startDate}
      {parseAndFormatDate(item.startDate)}
    {/if}
    {#if item.endDate}
      - {parseAndFormatDate(item.endDate)}
    {/if}
  </span>
{/if}
