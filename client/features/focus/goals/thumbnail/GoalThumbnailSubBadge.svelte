<script lang="ts">
  import Badge from "@21n/elements/text/Badge.svelte";
  import { enumToString } from "@21n/shared-utils/text.utils";
  import type { IObjectiveThumb } from "@nucleum/features/focus/goals/goal.type";

  let { item }: { item: IObjectiveThumb } = $props();
</script>

<div class="flex gap-1 items-center">
  {#if item.children && item.children.length > 0}
    <Badge
      text={`${item.children.length} sub ${item.children.length === 1 ? "objective" : "objectives"}`}
    />
  {/if}
  <Badge text={item.status ? enumToString(item.status) : "Not started"} />
</div>
