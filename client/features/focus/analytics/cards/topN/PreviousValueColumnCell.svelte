<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/elements/size.enum";
  import { formatSeconds } from "@21n/utils/time.utils";
  import { cn } from "@21n/utils/ui.utils";
  import type { TopNCardDataRecord } from "@nucleum/features/focus/analytics/analytics.types";

  let { row }: { row: TopNCardDataRecord } = $props();
</script>

<span
  class="text-fgs3 flex h-full w-full items-center text-b4 dp:text-b3 2k:text-b2"
>
  <span class="flex items-center gap-1">
    <Icon
      icon={row.value >= row.previousValue ? "arrow-up" : "arrow-down"}
      class={cn({
        "stroke-ags1": row.value > row.previousValue,
        "stroke-fgs1": row.value === row.previousValue,
        "stroke-ars1": row.value < row.previousValue
      })}
      size={Size.sm}
    />
    {formatSeconds(Math.abs(row.value - row.previousValue))}
  </span>
</span>
