<script lang="ts">
  import ObjectiveThumbnailDates from "@nucleum/features/focus/goals/thumbnail/GoalThumbnailDates.svelte";
  import { renderMdAsHtml } from "@nucleum/features/memory/markdown/markdown.utils";
  import { parseAndFormatDate } from "@21n/utils/time.utils";
  import { ObjectiveType, type IObjectiveThumb } from "@nucleum/features/focus/goals/goal.type";
  import ObjectiveThumbnailSubBadge from "@nucleum/features/focus/goals/thumbnail/GoalThumbnailSubBadge.svelte";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";

  let {
    item,
    isCurrentlyFocusing = false,
    accessPoint = ResourceAccessPoint.BROWSER
  }: {
    item: IObjectiveThumb;
    isCurrentlyFocusing?: boolean;
    accessPoint?: ResourceAccessPoint;
  } = $props();
</script>

<div class="flex justify-between items-center gap-1">
  {#if isCurrentlyFocusing || (item.type === ObjectiveType.DEFINITE && (item.startDate || item.endDate)) || (item.description && item.description?.blocks?.[0]?.body)}
    <div class="text-b3 text-fgs3 truncate text-left max-h-5">
      {#if isCurrentlyFocusing}
        <span class="text-ccs1"> Currently focusing... </span>
      {:else if item.type === ObjectiveType.DEFINITE && (item.startDate || item.endDate)}
        <ObjectiveThumbnailDates {item} />
      {:else if item.description?.blocks?.[0]?.body}
        {@html renderMdAsHtml(
          typeof item.description.blocks?.[0]?.body === "string"
            ? item.description.blocks[0].body
            : ""
        )}
        <!-- {:else}
      <span class="text-left text-b3 text-fgs3">
        Created: {formatDate(new Date(item.createdAt))}
        </span> -->
      {/if}
    </div>
  {/if}
  {#if accessPoint !== ResourceAccessPoint.PICKER}
    <ObjectiveThumbnailSubBadge {item} />
  {/if}
</div>
