<script lang="ts">
  import { popover } from "@nucleum/actions/popover.action";
  import Button from "@21n/elements/button/Button.svelte";
  import view from "@nucleum/stores/view.store";
  import { Placement } from "@21n/types/direction.enum";
  import { Size } from "@21n/types/size.enum";
  import { type IAnalyticsCard } from "@nucleum/features/focus/analytics/analytics.types";
  import GroupingAndFiltersPopover from "@nucleum/features/focus/analytics/page/GroupingAndFiltersPopover.svelte";

  let {
    card,
    onGroupByChange,
    parentBgIndex = 1
  }: {
    card: IAnalyticsCard;
    onGroupByChange: (e: CustomEvent) => void;
    parentBgIndex?: number;
  } = $props();
</script>

<div
  use:popover={{
    content: GroupingAndFiltersPopover,
    placement: Placement.BottomRight,
    isRenderAsModalForCW: true,
    id: "analytics-grouping-filters-popover",
    componentProps: {
      isGroupByTopLevelObjectives: card.isGroupByTopLevelObjectives,
      onGroupByChange
    }
  }}
>
  <Button
    icon="sliders-horizontal"
    label={$view.isPortrait ? "" : "Options"}
    {parentBgIndex}
    isPreventMinWidth={true}
    tooltip={$view.isPortrait ? "Filters and grouping" : ""}
    size={$view.isPortrait ? Size.lg : Size.xs}
  />
</div>
