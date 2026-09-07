<script lang="ts">
  import CustomColorPropagator from "@21n/elements/style/CustomColorPropagator.svelte";
  import TextWithHoverTooltip from "@21n/elements/text/TextWithHoverTooltip.svelte";
  import type { TopNCardDataRecord } from "@nucleum/features/focus/analytics/analytics.types";

  let { row }: { row: TopNCardDataRecord } = $props();
</script>

<span class="flex items-center gap-2">
  <CustomColorPropagator
    color={row.color}
    class="w-2 h-2 shrink-0 rounded-md bg-ccs1"
  />
  <span class="w-32 grow">
    <TextWithHoverTooltip text={row.label} class="truncate" />
  </span>
</span>
