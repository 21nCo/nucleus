<script lang="ts">
  import { ChartType } from "@nucleum/components/charts/analytics.type";
  import Chart from "@nucleum/components/charts/Chart.svelte";
  import {
    determineTimePeriodv2,
    parseAndFormatDate,
    formatSeconds
  } from "@21n/utils/time.utils";
  import { pointronPreferences } from "@nucleum/features/focus/preferences.store";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import { Size } from "@21n/elements/size.enum";
  import { TimeScale } from "@21n/utils/time.type";
  import { getCorrespoingHorizonFrequencyLabel } from "@21n/utils/time.utils";
  import {
    resolveSaturationAndLightness,
    retrieveCurrentColors
  } from "@21n/utils/theme.utils";
  import { ChartVariant } from "@nucleum/features/focus/analytics/chartVariant.enum";
  import appearance from "@nucleum/stores/appearance.store";
  import {
    AnalyticsCardGrouping,
    AnalyticsCardType,
    type IAnalyticsCard,
    type AnalyticsDataRecord,
    type ChartDataRecord,
    type IAnalyticsLabelColor
  } from "@nucleum/features/focus/analytics/analytics.types";
  import { cn } from "@21n/utils/ui.utils";
  import view from "@nucleum/stores/view.store";
  let {
    chart,
    rawData,
    objectiveColors,
    showLegend = true
  }: {
    chart: IAnalyticsCard;
    rawData: AnalyticsDataRecord[];
    objectiveColors: IAnalyticsLabelColor[];
    showLegend?: boolean;
  } = $props();
  const colors = $derived(retrieveCurrentColors($appearance));
  const data = $derived.by<(ChartDataRecord & { parentGroup?: string })[]>(
    () => {
      if (!rawData) return [];

      let nextData: (ChartDataRecord & { parentGroup?: string })[] =
        rawData.map((r: any) => {
          const focus = $pointronPreferences.isIncludeBreakInAnalytics
            ? r.focus + r.brek
            : r.focus;
          const start = new Date(r.start);
          const startOfDay = new Date(start);
          startOfDay.setHours(0, 0, 0, 0);

          return {
            parentGroup: r.topLevelObjectiveLabel,
            group:
              r.objectiveLabel === null
                ? "Other"
                : chart.isGroupByTopLevelObjectives
                  ? r.topLevelObjectiveLabel
                  : r.objectiveLabel,
            key:
              chart.type == AnalyticsCardType.BAR
                ? resolveXValueForStackedBarChart(start)
                : chart.type == AnalyticsCardType.LINE ||
                    chart.type === AnalyticsCardType.AREA
                  ? startOfDay
                  : chart.type === AnalyticsCardType.CALENDAR ||
                      chart.type === AnalyticsCardType.HOURLY ||
                      chart.type === AnalyticsCardType.HOURLY_HEATMAP
                    ? start
                    : r.start,
            value: +(+focus / (60 * 60)).toFixed(2)
          };
        });

      if (
        chart.type === AnalyticsCardType.PIE ||
        chart.type === AnalyticsCardType.DONUT
      ) {
        const result = nextData.reduce((acc: Record<string, number>, entry) => {
          acc[`${entry.group}`] = (acc[`${entry.group}`] || 0) + entry.value;
          return acc;
        }, {});
        nextData = Object.keys(result).map((key) => ({
          group: key,
          key,
          value: result[key]
        }));
      } else if (
        chart.type === AnalyticsCardType.LINE ||
        chart.type === AnalyticsCardType.AREA
      ) {
        const grouped = nextData.reduce((acc: Record<string, any>, entry) => {
          const key = `${entry.group}-${entry.key}`;
          if (acc[key]) {
            acc[key].value += entry.value;
          } else {
            acc[key] = { ...entry };
          }
          return acc;
        }, {});
        nextData = Object.values(grouped) as (ChartDataRecord & {
          parentGroup?: string;
        })[];
        nextData.sort(
          (a: { key: string }, b: { key: string }) =>
            new Date(a.key).getTime() - new Date(b.key).getTime()
        );
      } else if (
        chart.type === AnalyticsCardType.CALENDAR ||
        chart.type === AnalyticsCardType.HOURLY ||
        chart.type === AnalyticsCardType.HOURLY_HEATMAP
      ) {
        const dayMap = nextData.reduce(
          (acc: Record<string, number>, entry) => {
            const date = new Date(entry.key);
            const dateKey =
              chart.type === AnalyticsCardType.CALENDAR
                ? date.toISOString().split("T")[0]
                : `${entry.key}`;
            acc[dateKey] = (acc[dateKey] || 0) + entry.value;
            return acc;
          },
          {}
        );
        nextData = Object.keys(dayMap).map((key) => ({
          group: "Total",
          key,
          value: dayMap[key]
        }));
        nextData.sort(
          (a: { key: string }, b: { key: string }) =>
            new Date(a.key).getTime() - new Date(b.key).getTime()
        );
      } else if (
        chart.type === AnalyticsCardType.SUNBURST ||
        chart.type === AnalyticsCardType.TREEMAP
      ) {
        const hierarchicalMap = nextData.reduce(
          (acc: Record<string, any>, entry) => {
            const compositeKey = `${entry.parentGroup}-${entry.group}`;
            if (acc[compositeKey]) {
              acc[compositeKey].value += entry.value;
            } else {
              acc[compositeKey] = { ...entry };
            }
            return acc;
          },
          {}
        );
        nextData = Object.values(hierarchicalMap) as (ChartDataRecord & {
          parentGroup?: string;
        })[];
      }

      return nextData;
    }
  );
  const options = $derived.by<any>(() => {
    let nextOptions: any = {
      ...(chart.type === AnalyticsCardType.BAR
        ? { stackedBarMode: chart.stackedBarMode ?? "value" }
        : {}),
      color: {
        scale: {} as Record<string, string>
      },
      valueLabel: "Focus",
      primarySeriesName: "Focus",
      yAxisName: "Focus Time",
      donutLabel: "Total focus",
      donutFormatter: (value: any) => {
        return formatSeconds(value * 60 * 60);
      },
      timeInterval: chart.period.scale,
      timeIntervalFormats: {
        daily: {
          primary: "y MMM d",
          secondary: "d"
        }
      },
      xScale: chart.type == AnalyticsCardType.BAR && "labels"
    };

    const targetValue = $pointronPreferences.horizonTargets?.find(
      (x) => x.scale === chart.period.scale
    )?.target;
    if (targetValue) {
      nextOptions = {
        ...nextOptions,
        yThresholds: [
          {
            label:
              getCorrespoingHorizonFrequencyLabel(chart.period.scale) +
              " target",
            value: targetValue / (60 * 60),
            fillColor: colors.aps1
          }
        ]
      };
    }

    const period = determineTimePeriodv2(chart.period);
    if (chart.type == AnalyticsCardType.BAR) {
      const xDomain: string[] = [];
      const begin = new Date(period.begin);
      const end = new Date(period.end);
      while (begin <= end) {
        xDomain.push(resolveXValueForStackedBarChart(begin));
        if (chart.period.scale === TimeScale.DAYS) {
          begin.setDate(begin.getDate() + 1);
        } else if (chart.period.scale === TimeScale.MONTHS) {
          begin.setMonth(begin.getMonth() + 1);
        } else if (chart.period.scale === TimeScale.YEARS) {
          begin.setFullYear(begin.getFullYear() + 1);
        }
      }
      nextOptions = {
        ...nextOptions,
        xDomain,
        barsWidth: Math.round(450 / xDomain.length)
      };
    }

    if (objectiveColors) {
      const values = resolveSaturationAndLightness($appearance);
      if (!values) return nextOptions;
      for (const item of objectiveColors) {
        const hueForOther = 10;
        nextOptions.color.scale["Other"] =
          `hsl(${hueForOther}, ${values.saturation}%, ${values.lightness}%)`;
        if (data.some((entry: any) => entry.group == item.label)) {
          nextOptions.color.scale[item.label] =
            `hsl(${item.color}, ${values.saturation}%, ${values.lightness}%)`;
        }
        if (
          data.some(
            (entry: any) => entry.parentGroup == item.label
          )
        ) {
          const matchingEntries = data.filter(
            (entry: any) => entry.parentGroup == item.label
          );
          matchingEntries.forEach((entry: any) => {
            nextOptions.color.scale[entry.group] =
              `hsl(${item.color}, ${values.saturation}%, ${values.lightness}%)`;
          });
        }
      }
    }

    return nextOptions;
  });
  const isLoadingState = $derived(!rawData);
  function resolveXValueForStackedBarChart(begin: Date): string {
    if (chart.period.scale === TimeScale.DAYS) {
      return parseAndFormatDate(begin, "mmm-dd");
    } else if (chart.period.scale === TimeScale.MONTHS) {
      return parseAndFormatDate(begin, "mmm-yy");
    } else if (chart.period.scale === TimeScale.YEARS) {
      return `${begin.getFullYear()}`;
    }
    return "";
  }
</script>

<div
  class={cn(
    "gap-2 w-full h-full flex flex-col justify-center items-center userdata",
    {
      "p-2": !$view.isPortrait
    }
  )}
>
  {#if options && data && data.length > 0}
    <div
      class={cn("flex w-full justify-center", {
        "h-4/5":
          $view.isPortrait &&
          (chart.type === AnalyticsCardType.PIE ||
            chart.type === AnalyticsCardType.DONUT),
        "h-full":
          !$view.isPortrait ||
          (chart.type !== AnalyticsCardType.PIE &&
            chart.type !== AnalyticsCardType.DONUT)
      })}
    >
      <Chart
        type={chart.type == AnalyticsCardType.BAR
          ? ChartType.STACKEDBAR
          : chart.type === AnalyticsCardType.PIE
            ? ChartType.PIE
            : chart.type === AnalyticsCardType.DONUT
              ? ChartType.DOUGHNUT
              : chart.type === AnalyticsCardType.LINE
                ? ChartType.LINE
                : chart.type === AnalyticsCardType.CALENDAR
                  ? ChartType.CALENDAR
                  : chart.type === AnalyticsCardType.HOURLY
                    ? ChartType.HOURLY
                    : chart.type === AnalyticsCardType.HOURLY_HEATMAP
                      ? ChartType.HOURLY_HEATMAP
                      : chart.type === AnalyticsCardType.SUNBURST
                        ? ChartType.SUNBURST
                        : chart.type === AnalyticsCardType.TREEMAP
                          ? ChartType.TREEMAP
                          : ChartType.AREA}
        {data}
        {options}
        {showLegend}
      />
    </div>
  {:else}
    <EmptyStatusView
      size={Size.sm}
      {isLoadingState}
      mainText="No data available"
      subText="Please come back after you focus for this time period or choose a different time period."
    />
  {/if}
</div>
