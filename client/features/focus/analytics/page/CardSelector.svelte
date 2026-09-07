<script lang="ts">
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import ContextMenuAction from "@21n/elements/contextMenu/ContextMenuAction.svelte";
  import DropDown from "@21n/elements/dropdown/DropDown.svelte";
  import type {
    DropdownGroup,
    DropdownItem
  } from "@21n/elements/dropdown/dropdownItem.type";
  import { InputStyle } from "@21n/elements/input/input.type";
  import { Size } from "@21n/elements/size.enum";
  import { AnalyticsCardType } from "@nucleum/features/focus/analytics/analytics.types";

  let {
    accessPoint,
    selected = $bindable(),
    onSelect = undefined
  }: {
    accessPoint: ResourceAccessPoint;
    selected: AnalyticsCardType;
    onSelect?: ((event: CustomEvent<AnalyticsCardType>) => void) | undefined;
  } = $props();

  let chartTypes: DropdownItem[] = [
    {
      label: "Pie chart",
      value: AnalyticsCardType.PIE,
      icon: resolveChartIcon(AnalyticsCardType.PIE),
      groupId: "charts"
    },
    {
      label: "Donut chart",
      value: AnalyticsCardType.DONUT,
      icon: resolveChartIcon(AnalyticsCardType.DONUT),
      groupId: "charts"
    },
    {
      label: "Line chart",
      value: AnalyticsCardType.LINE,
      icon: resolveChartIcon(AnalyticsCardType.LINE),
      groupId: "charts"
    },
    {
      label: "Bar chart",
      value: AnalyticsCardType.BAR,
      icon: resolveChartIcon(AnalyticsCardType.BAR),
      groupId: "charts"
    },
    {
      label: "Area chart",
      value: AnalyticsCardType.AREA,
      icon: resolveChartIcon(AnalyticsCardType.AREA),
      groupId: "charts"
    },
    {
      label: "Calendar heatmap",
      value: AnalyticsCardType.CALENDAR,
      icon: resolveChartIcon(AnalyticsCardType.CALENDAR),
      groupId: "other",
      badge: "new"
    },
    {
      label: "Hourly distribution",
      value: AnalyticsCardType.HOURLY,
      icon: resolveChartIcon(AnalyticsCardType.HOURLY),
      groupId: "other",
      badge: "new"
    },
    {
      label: "Hourly heatmap",
      value: AnalyticsCardType.HOURLY_HEATMAP,
      icon: resolveChartIcon(AnalyticsCardType.HOURLY_HEATMAP),
      groupId: "other",
      badge: "new"
    },
    {
      label: "Sunburst",
      value: AnalyticsCardType.SUNBURST,
      icon: resolveChartIcon(AnalyticsCardType.SUNBURST),
      groupId: "charts",
      badge: "new"
    },
    {
      label: "Treemap",
      value: AnalyticsCardType.TREEMAP,
      icon: resolveChartIcon(AnalyticsCardType.TREEMAP),
      groupId: "charts",
      badge: "new"
    },
    {
      label: "Top objectives",
      value: AnalyticsCardType.TOP_N,
      icon: resolveChartIcon(AnalyticsCardType.TOP_N),
      groupId: "other"
    },
    {
      label: "Metrics",
      value: AnalyticsCardType.METRICS,
      icon: resolveChartIcon(AnalyticsCardType.METRICS),
      groupId: "other"
    }
  ];
  let groups: DropdownGroup[] = [
    {
      id: "charts",
      label: "Base charts",
      order: 0
    }
  ];
  if (accessPoint !== ResourceAccessPoint.OBJECTIVE) {
    groups.push(
      ...[
        {
          id: "trends",
          label: "Trends",
          order: 1
        },
        {
          id: "other",
          label: "Other",
          order: 2
        }
      ]
    );
  }

  function resolveChartIcon(chartType: AnalyticsCardType) {
    switch (chartType) {
      case AnalyticsCardType.PIE:
        return "chart";
      case AnalyticsCardType.DONUT:
        return "ph:chart-donut-light";
      case AnalyticsCardType.LINE:
        return "chart-line";
      case AnalyticsCardType.BAR:
        return "chart-bar";
      case AnalyticsCardType.AREA:
        return "areachart";
      case AnalyticsCardType.CALENDAR:
        return "calendar";
      case AnalyticsCardType.HOURLY:
        return "clock";
      case AnalyticsCardType.HOURLY_HEATMAP:
        return "clock";
      case AnalyticsCardType.TOP_N:
        return "rocket";
      case AnalyticsCardType.METRICS:
        return "grid";
      case AnalyticsCardType.TARGETS:
        return "target";
      default:
        return "chart";
    }
  }

  function handleSelect(nextValue: AnalyticsCardType) {
    selected = nextValue;
    const selectEvent = new CustomEvent<AnalyticsCardType>("select", {
      detail: nextValue
    });
    onSelect?.(selectEvent);
  }
</script>

{#if accessPoint === ResourceAccessPoint.OBJECTIVE}
  <ContextMenuAction
    id="chart-selector"
    icon={resolveChartIcon(selected)}
    menuResolver={() => {
      return [
        {
          group: "charts",
          items: chartTypes.filter((x) => x.groupId !== "other")
        }
      ];
    }}
    actionBgSize={Size.sm}
    onAction={(event) => {
      const val = event.detail;
      if (!val) return;
      handleSelect(val);
    }}
  />
{:else}
  <DropDown
    parentBackgroundIndex={1}
    bind:value={selected}
    items={chartTypes}
    {groups}
    style={InputStyle.BORDERED}
    isDisableSearch={true}
    onSelect={(event) => handleSelect(event.detail)}
  />
{/if}
