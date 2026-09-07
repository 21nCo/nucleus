<script lang="ts">
  import { onDestroy } from "svelte";
  import * as echarts from "echarts";
  import type { ECharts, EChartsOption } from "echarts";
  import { ChartType } from "@21n/types/analytics.type";
  import { retrieveCurrentColors } from "@21n/utils/theme.utils";
  import appearance from "@nucleum/stores/appearance.store";
  import {
    sortGroupsByTotalValue,
    sortGroupsByLineValue,
    sortTooltipByValue,
    filterZeroValues,
    filterZeroValuesLine,
    truncateText
  } from "./chart.utils";
  import { userPreferences } from "@nucleum/stores/preferences/user-preferences.store";

  let {
    type,
    data,
    options,
    showLegend = true,
    isConstrainedWidth = false
  }: {
    type: ChartType;
    data: any;
    options: any;
    showLegend?: boolean;
    isConstrainedWidth?: boolean;
  } = $props();

  const supportedTypes = new Set([
    ChartType.BAR,
    ChartType.STACKEDBAR,
    ChartType.LINE,
    ChartType.AREA,
    ChartType.STACKEDAREA,
    ChartType.PIE,
    ChartType.DOUGHNUT,
    ChartType.CALENDAR,
    ChartType.HOURLY,
    ChartType.SUNBURST,
    ChartType.TREEMAP,
    ChartType.HOURLY_HEATMAP
  ]);

  let container = $state<HTMLDivElement | undefined>();
  let chart: ECharts | undefined;
  let resizeObserver: ResizeObserver | undefined;

  const currentAppearance = $derived($appearance);
  const currentColors = $derived(
    currentAppearance ? retrieveCurrentColors(currentAppearance) : undefined
  );
  const shouldRenderChart = $derived(supportedTypes.has(type));

  const defaultPaletteKeys = [
    "aps1",
    "ass1",
    "ars1",
    "ags1",
    "aps2",
    "ass2",
    "ars2",
    "ags2",
    "aps3"
  ];

  function normalizeColor(color?: string) {
    if (!color || typeof color !== "string") return undefined;
    if (!color.startsWith("hsl")) return color;
    const inner = color.slice(color.indexOf("(") + 1, color.lastIndexOf(")"));
    if (inner.includes(",")) return color;
    const [componentsPart, alphaPart] = inner.split("/");
    const components = componentsPart
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .join(", ");
    if (alphaPart) {
      const alpha = alphaPart.trim();
      return `hsla(${components}, ${alpha})`;
    }
    return `hsl(${components})`;
  }

  function resolvePalette(groups: string[]) {
    const palette: string[] = [];
    if (options?.color?.scale) {
      for (const group of groups) {
        const provided = options.color.scale[group];
        if (provided) {
          const normalized = normalizeColor(provided);
          if (normalized && !palette.includes(normalized)) {
            palette.push(normalized);
          }
        }
      }
    }
    if (currentColors) {
      const colorRecord = currentColors as Record<string, string | undefined>;
      for (const key of defaultPaletteKeys) {
        const normalized = normalizeColor(colorRecord[key]);
        if (normalized && !palette.includes(normalized)) {
          palette.push(normalized);
        }
      }
    }
    if (!palette.length) {
      palette.push("#3b82f6", "#ef4444", "#22c55e", "#f97316", "#a855f7");
    }
    return palette;
  }

  function resolveColor(group: string, index: number, palette: string[]) {
    const provided = options?.color?.scale?.[group];
    if (provided) {
      return normalizeColor(provided) ?? palette[index % palette.length];
    }
    return palette[index % palette.length];
  }

  function resolveMetricLabel() {
    return String(options?.valueLabel ?? options?.metricLabel ?? "Value");
  }

  function resolvePrimarySeriesName() {
    return String(options?.primarySeriesName ?? resolveMetricLabel());
  }

  function resolveYAxisName() {
    return String(options?.yAxisName ?? resolveMetricLabel());
  }

  function resolveHierarchyParentGroup(item: any) {
    return String(item?.parentGroup ?? item?.group ?? "Other");
  }

  function resolveHierarchyGroup(item: any) {
    return String(item?.group ?? item?.label ?? "Other");
  }

  function formatTooltipValue(value: number | string) {
    const formatter = options?.tooltip?.valueFormatter;
    if (typeof formatter === "function") {
      try {
        return formatter(value);
      } catch (_) {
        return value;
      }
    }
    return value;
  }

  function resolveAxisLabelColor() {
    return (
      normalizeColor(currentColors?.fgs2) ??
      normalizeColor(currentColors?.fgs1) ??
      "#6b7280"
    );
  }

  function resolveAxisLineColor() {
    return (
      normalizeColor(currentColors?.brs2) ??
      normalizeColor(currentColors?.fgs3) ??
      "rgba(148, 163, 184, 0.35)"
    );
  }

  function resolveTypeface() {
    return $userPreferences?.appearance?.typeface ?? "Sen";
  }

  function resolveTooltipBackground() {
    return normalizeColor(currentColors?.bgs2) ?? "rgba(17, 24, 39, 0.9)";
  }

  function escapeHtml(text: string): string {
    const htmlEscapes: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "/": "&#x2F;"
    };
    return String(text).replace(/[&<>"'\/]/g, (match) => htmlEscapes[match] || match);
  }

  type BarDisplayMode = "value" | "percentage";

  function roundToTwoDecimals(value: number) {
    return Math.round(value * 100) / 100;
  }

  function resolveBarDisplayMode(isStacked: boolean): BarDisplayMode {
    const explicitMode =
      options?.stackedBarMode ??
      options?.stackedBarDisplay ??
      options?.barDisplayMode;

    if (explicitMode === "percentage" || explicitMode === "value") {
      return explicitMode;
    }

    if (typeof options?.showAsPercentage === "boolean") {
      return options.showAsPercentage ? "percentage" : "value";
    }

    if (typeof options?.percentage === "boolean") {
      return options.percentage ? "percentage" : "value";
    }

    if (isStacked && typeof options?.stackedPercentage === "boolean") {
      return options.stackedPercentage ? "percentage" : "value";
    }

    return "value";
  }

  function buildBarOption(isStacked: boolean): EChartsOption {
    const dataset = Array.isArray(data) ? data : [];
    const categories =
      options?.xDomain &&
      Array.isArray(options.xDomain) &&
      options.xDomain.length
        ? options.xDomain
        : Array.from(
            new Set(dataset.map((item: any) => String(item?.key ?? "")))
          );
    const groups = Array.from(
      new Set(dataset.map((item: any) => String(item?.group ?? "Value")))
    );
    const palette = resolvePalette(groups);
    const axisLabelColor = resolveAxisLabelColor();
    const axisLineColor = resolveAxisLineColor();
    const displayMode = resolveBarDisplayMode(isStacked);
    const usePercentage = displayMode === "percentage";

    const valueLookup = new Map<string, Map<string, number>>();
    dataset.forEach((item: any) => {
      const group = String(item?.group ?? "Value");
      const category = String(item?.key ?? "");
      const value = Number(item?.value ?? 0);
      if (!valueLookup.has(group)) {
        valueLookup.set(group, new Map());
      }
      const previous = valueLookup.get(group)?.get(category) ?? 0;
      valueLookup.get(group)?.set(category, previous + value);
    });

    sortGroupsByTotalValue(groups, valueLookup);

    const totalsByCategory: Record<string, number> = {};
    if (usePercentage) {
      for (const category of categories) {
        totalsByCategory[category] = groups.reduce((total, group) => {
          const groupValue = valueLookup.get(group)?.get(category) ?? 0;
          return total + groupValue;
        }, 0);
      }
    }

    const series = groups.map((group, index) => {
      const seriesData = categories.map((category: string) => {
        const rawValue = valueLookup.get(group)?.get(category) ?? 0;
        if (usePercentage) {
          const total = totalsByCategory[category] ?? 0;
          const percentage = total > 0 ? (rawValue / total) * 100 : 0;
          return {
            value: Number(percentage.toFixed(2)),
            rawValue,
            percentage,
            category,
            group
          };
        }
        return {
          value: rawValue,
          rawValue,
          category,
          group
        };
      });

      const seriesOption: echarts.BarSeriesOption = {
        name: group,
        type: "bar",
        stack: isStacked ? "total" : undefined,
        emphasis: { focus: "series" },
        barWidth: options?.barsWidth ? `${options.barsWidth}px` : undefined,
        itemStyle: {
          color: resolveColor(group, index, palette)
        },
        label: {
          show: isStacked && index === groups.length - 1,
          position: "top",
          color: axisLabelColor,
          fontSize: Math.min(options?.barsWidth ?? 20, 20) / 1.5,
          formatter: (params: any) => {
            const category = params?.data?.category;
            let total = 0;
            for (const g of groups) {
              total += valueLookup.get(g)?.get(category) ?? 0;
            }
            const rounded = roundToTwoDecimals(total);
            return formatTooltipValue(rounded);
          }
        },
        data: seriesData
      };

      if (
        Array.isArray(options?.yThresholds) &&
        options.yThresholds.length &&
        index === 0
      ) {
        seriesOption.markLine = {
          symbol: "none",
          data: options.yThresholds.map((threshold: any) => ({
            yAxis: Number(threshold?.value ?? 0),
            name: String(threshold?.label ?? "")
          })),
          lineStyle: {
            type: "dashed",
            color:
              normalizeColor(options.yThresholds[0]?.fillColor) ??
              axisLabelColor
          },
          label: {
            formatter: ({ name }) => name,
            color: axisLabelColor
          }
        };
      }

      return seriesOption;
    });

    return {
      animation: false,
      backgroundColor: "transparent",
      textStyle: {
        fontFamily: resolveTypeface()
      },
      color: palette,
      grid: {
        left: "3%",
        right: "3%",
        top: 50,
        bottom: 40,
        containLabel: true
      },
      tooltip: {
        trigger: "axis",
        textStyle: {
          color: axisLabelColor
        },
        axisPointer: { type: "shadow" },
        borderColor: normalizeColor(currentColors?.brs2),
        backgroundColor: resolveTooltipBackground(),
        formatter: (params: any) => {
          if (!Array.isArray(params)) return "";
          const [first] = params;
          const header = escapeHtml(first?.axisValueLabel ?? "");
          const sorted = sortTooltipByValue(params);
          const body = filterZeroValues(sorted)
            .map((param: any) => {
              const rawValue = param?.data?.rawValue ?? param?.value;
              const rounded = roundToTwoDecimals(rawValue);
              const formattedRaw = escapeHtml(formatTooltipValue(rounded));
              const seriesName = escapeHtml(param.seriesName ?? "");
              if (usePercentage) {
                const percentage = param?.data?.percentage ?? param?.value;
                return `${param.marker} ${seriesName}: ${formattedRaw} (${Number(percentage).toFixed(1)}%)`;
              }
              return `${param.marker} ${seriesName}: ${formattedRaw}`;
            })
            .join("<br/>");
          return header ? `${header}<br/>${body}` : body;
        }
      },
      legend: showLegend
        ? {
            data: groups,
            orient: "horizontal",
            type: "scroll",
            itemWidth: 12,
            itemHeight: 12,
            textStyle: {
              color: axisLabelColor
            },
            pageIconColor: axisLabelColor,
            pageIconInactiveColor:
              normalizeColor(currentColors?.fgs3) ?? "rgba(128, 128, 128, 0.5)",
            pageTextStyle: {
              color: axisLabelColor
            },
            ...(isConstrainedWidth && {
              bottom: 0,
              left: "center"
            })
          }
        : { show: false },
      xAxis: {
        type: "category",
        data: categories,
        axisLabel: {
          color: axisLabelColor
        },
        axisTick: {
          alignWithLabel: true
        },
        axisLine: {
          lineStyle: {
            color: axisLineColor
          }
        }
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: axisLabelColor,
          formatter: usePercentage ? "{value}%" : undefined
        },
        axisLine: {
          lineStyle: {
            color: axisLineColor
          }
        },
        splitLine: {
          lineStyle: {
            color: axisLineColor,
            type: "dashed"
          }
        },
        max: usePercentage ? 100 : undefined
      },
      series
    };
  }

  function toTimestamp(value: any) {
    if (value instanceof Date) return value.getTime();
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) return undefined;
    return parsed;
  }

  function buildLineOption({
    isArea,
    isStacked
  }: {
    isArea: boolean;
    isStacked: boolean;
  }): EChartsOption {
    const dataset = Array.isArray(data) ? data : [];
    const groups = Array.from(
      new Set(dataset.map((item: any) => String(item?.group ?? "Value")))
    );
    const palette = resolvePalette(groups);
    const axisLabelColor = resolveAxisLabelColor();
    const axisLineColor = resolveAxisLineColor();

    const grouped = new Map<string, any[]>();
    dataset.forEach((item: any) => {
      const group = String(item?.group ?? "Value");
      if (!grouped.has(group)) {
        grouped.set(group, []);
      }
      grouped.get(group)?.push(item);
    });

    sortGroupsByLineValue(groups, grouped);

    const series = groups.map((group, index) => {
      const seriesData = (grouped.get(group) ?? [])
        .map((item) => {
          const timestamp = toTimestamp(item?.key ?? 0);
          if (typeof timestamp !== "number") return null;
          return [timestamp, Number(item?.value ?? 0)] as [number, number];
        })
        .filter((entry): entry is [number, number] => Array.isArray(entry));
      seriesData.sort((a, b) => a[0] - b[0]);

      const baseSeries: echarts.LineSeriesOption = {
        name: group,
        type: "line",
        smooth: true,
        showSymbol: false,
        connectNulls: true,
        emphasis: { focus: "series" },
        itemStyle: {
          color: resolveColor(group, index, palette)
        },
        lineStyle: {
          width: 2,
          color: resolveColor(group, index, palette)
        },
        areaStyle: isArea
          ? {
              opacity: 0.18,
              color: resolveColor(group, index, palette)
            }
          : undefined,
        stack: isStacked ? "total" : undefined,
        data: seriesData
      };

      return baseSeries;
    });

    return {
      animation: false,
      backgroundColor: "transparent",
      textStyle: {
        fontFamily: resolveTypeface()
      },
      grid: {
        left: "3%",
        right: "3%",
        top: 40,
        bottom: 40,
        containLabel: true
      },
      tooltip: {
        trigger: "axis",
        borderColor: normalizeColor(currentColors?.brs2),
        backgroundColor: resolveTooltipBackground(),
        textStyle: {
          color: axisLabelColor
        },
        formatter: (params: any) => {
          if (!Array.isArray(params)) return "";
          const [first] = params;
          const header = first?.axisValueLabel ?? "";
          const body = filterZeroValuesLine(params)
            .map((param: any) => {
              const value = param?.value?.[1] ?? param?.value ?? 0;
              const rounded = roundToTwoDecimals(value);
              const formattedValue = formatTooltipValue(rounded);
              return `${param.marker} ${param.seriesName}: ${formattedValue}`;
            })
            .join("<br/>");
          return header ? `${header}<br/>${body}` : body;
        }
      },
      legend: showLegend
        ? {
            data: groups,
            type: "scroll",
            itemWidth: 16,
            itemHeight: 12,
            textStyle: {
              color: axisLabelColor
            },
            pageIconColor: axisLabelColor,
            pageIconInactiveColor:
              normalizeColor(currentColors?.fgs3) ?? "rgba(128, 128, 128, 0.5)",
            pageTextStyle: {
              color: axisLabelColor
            },
            ...(isConstrainedWidth && {
              orient: "horizontal",
              bottom: 0,
              left: "center"
            })
          }
        : { show: false },
      xAxis: {
        type: "time",
        axisLabel: {
          color: axisLabelColor
        },
        axisLine: {
          lineStyle: {
            color: axisLineColor
          }
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: axisLineColor,
            type: "dashed"
          }
        }
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: axisLabelColor
        },
        axisLine: {
          lineStyle: {
            color: axisLineColor
          }
        },
        splitLine: {
          lineStyle: {
            color: axisLineColor,
            type: "dashed"
          }
        }
      },
      series
    };
  }

  function buildCalendarOption(): EChartsOption {
    const dataset = Array.isArray(data) ? data : [];
    const axisLabelColor = resolveAxisLabelColor();
    const axisLineColor = resolveAxisLineColor();

    const yearData = dataset.map((item: any) => {
      const date = new Date(item?.key ?? item?.start ?? 0);
      const dateStr = date.toISOString().split("T")[0];
      const value = Number(item?.value ?? 0);
      return [dateStr, value];
    });

    const values = yearData.map((d) => d[1] as number).filter((v) => v > 0);
    const maxValue = values.length > 0 ? Math.max(...values) : 1;
    const minValue = values.length > 0 ? Math.min(...values) : 0;

    const currentYear = new Date().getFullYear();
    const startDate =
      yearData.length > 0
        ? new Date(
            Math.min(...yearData.map((d) => new Date(d[0] as string).getTime()))
          )
        : new Date(currentYear, 0, 1);
    const year = startDate.getFullYear();

    return {
      animation: false,
      backgroundColor: "transparent",
      textStyle: {
        fontFamily: resolveTypeface()
      },
      tooltip: {
        position: "top",
        borderColor: normalizeColor(currentColors?.brs2),
        textStyle: {
          color: axisLabelColor
        },
        backgroundColor: resolveTooltipBackground(),
        formatter: (params: any) => {
          const date = params.data[0];
          const value = roundToTwoDecimals(params.data[1]);
          const formattedValue = formatTooltipValue(value);
          return `<strong>${date}</strong><br/>${escapeHtml(resolveMetricLabel())}: ${formattedValue}`;
        }
      },
      visualMap: {
        min: minValue,
        max: maxValue,
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: 20,
        textStyle: {
          color: axisLabelColor
        },
        inRange: {
          color: [
            normalizeColor(currentColors?.bgs1) ?? "#216e39",
            normalizeColor(currentColors?.aps1) ?? "#216e39",
            normalizeColor(currentColors?.aps2) ?? "#30a14e"
          ]
        }
      },
      calendar: {
        top: 60,
        left: 50,
        right: 30,
        bottom: 100,
        cellSize: ["auto", "auto"],
        range: year,
        itemStyle: {
          borderWidth: 0.5,
          borderColor: axisLineColor,
          color: "transparent"
        },
        yearLabel: {
          show: true,
          color: axisLabelColor,
          fontFamily: resolveTypeface()
        },
        monthLabel: {
          nameMap: "en",
          color: axisLabelColor
        },
        dayLabel: {
          nameMap: "en",
          color: axisLabelColor
        },
        splitLine: {
          lineStyle: {
            color: axisLineColor
          }
        }
      },
      series: [
        {
          type: "heatmap",
          coordinateSystem: "calendar",
          data: yearData
        }
      ]
    };
  }

  function buildSunburstOption(): EChartsOption {
    const dataset = Array.isArray(data) ? data : [];
    const labelColor = resolveAxisLabelColor();
    const palette = resolvePalette(
      Array.from(
        new Set(dataset.map((item: any) => resolveHierarchyParentGroup(item)))
      )
    );

    const hierarchyMap = new Map<
      string,
      { name: string; value: number; children: any[] }
    >();
    const topLevelMap = new Map<string, number>();

    dataset.forEach((item: any) => {
      const topLevel = resolveHierarchyParentGroup(item);
      const subGroup = resolveHierarchyGroup(item);
      const value = Number(item?.value ?? 0);

      if (!hierarchyMap.has(topLevel)) {
        hierarchyMap.set(topLevel, {
          name: topLevel,
          value: 0,
          children: []
        });
      }

      const parent = hierarchyMap.get(topLevel)!;
      parent.value += value;

      if (topLevel !== subGroup) {
        const existingChild = parent.children.find(
          (c) => c.name === subGroup
        );
        if (existingChild) {
          existingChild.value += value;
        } else {
          parent.children.push({
            name: subGroup,
            value
          });
        }
      }
    });

    const hierarchyData = Array.from(hierarchyMap.values()).map(
      (parent, index) => {
        const color = resolveColor(parent.name, index, palette);
        return {
          ...parent,
          itemStyle: { color },
          children:
            parent.children.length > 0
              ? parent.children.map((child) => ({
                  ...child,
                  itemStyle: { color }
                }))
              : undefined
        };
      }
    );

    const total = hierarchyData.reduce((sum, item) => sum + item.value, 0);

    return {
      animation: false,
      backgroundColor: "transparent",
      textStyle: {
        fontFamily: resolveTypeface()
      },
      tooltip: {
        trigger: "item",
        backgroundColor: resolveTooltipBackground(),
        borderColor: normalizeColor(currentColors?.brs2),
        textStyle: {
          color: labelColor
        },
        formatter: (params: any) => {
          const value = roundToTwoDecimals(params.value ?? 0);
          const formattedValue = escapeHtml(formatTooltipValue(value));
          const name = escapeHtml(params.name ?? "");
          const percent =
            total > 0 ? ((params.value / total) * 100).toFixed(1) : "0";
          return `${params.marker} ${name}<br/>${escapeHtml(resolveMetricLabel())}: ${formattedValue} (${percent}%)`;
        }
      },
      series: [
        {
          type: "sunburst",
          data: hierarchyData,
          radius: ["15%", "90%"],
          itemStyle: {
            borderRadius: 4,
            borderWidth: 2,
            borderColor: normalizeColor(currentColors?.bgs1) ?? "#fff"
          },
          label: {
            rotate: "radial",
            minAngle: 10,
            formatter: (params: any) => {
              const name = escapeHtml(truncateText(params.name ?? "", 15));
              return name;
            }
          },
          emphasis: {
            focus: "ancestor"
          },
          levels: [
            {},
            {
              r0: "15%",
              r: "45%",
              label: {
                rotate: 0,
                minAngle: 15
              }
            },
            {
              r0: "45%",
              r: "60%",
              label: {
                position: "outside",
                padding: 1,
                silent: false,
                minAngle: 8,
                color: labelColor,
                textBorderWidth: 0,
                textShadowBlur: 0,
                formatter: (params: any) => {
                  const percent = total > 0 ? (params.value / total) * 100 : 0;
                  if (percent < 2) {
                    return "";
                  }
                  const name = escapeHtml(truncateText(params.name ?? "", 20));
                  return name;
                }
              }
            }
          ]
        }
      ]
    };
  }

  function buildTreemapOption(): EChartsOption {
    const dataset = Array.isArray(data) ? data : [];
    const labelColor = resolveAxisLabelColor();
    const palette = resolvePalette(
      Array.from(
        new Set(dataset.map((item: any) => resolveHierarchyParentGroup(item)))
      )
    );

    const hierarchyMap = new Map<
      string,
      { name: string; value: number; children: any[] }
    >();

    dataset.forEach((item: any) => {
      const topLevel = resolveHierarchyParentGroup(item);
      const subGroup = resolveHierarchyGroup(item);
      const value = Number(item?.value ?? 0);

      if (!hierarchyMap.has(topLevel)) {
        hierarchyMap.set(topLevel, {
          name: topLevel,
          value: 0,
          children: []
        });
      }

      const parent = hierarchyMap.get(topLevel)!;
      parent.value += value;

      if (topLevel !== subGroup) {
        const existingChild = parent.children.find(
          (c) => c.name === subGroup
        );
        if (existingChild) {
          existingChild.value += value;
        } else {
          parent.children.push({
            name: subGroup,
            value
          });
        }
      }
    });

    const treemapData = Array.from(hierarchyMap.values()).map(
      (parent, index) => {
        const color = resolveColor(parent.name, index, palette);
        return {
          ...parent,
          itemStyle: {
            color,
            borderColor: normalizeColor(currentColors?.bgs1) ?? "#fff",
            borderWidth: 2,
            gapWidth: 2
          },
          children:
            parent.children.length > 0
              ? parent.children.map((child) => ({
                  ...child,
                  itemStyle: {
                    color,
                    borderColor: normalizeColor(currentColors?.bgs1) ?? "#fff",
                    borderWidth: 1
                  }
                }))
              : undefined
        };
      }
    );

    return {
      animation: false,
      backgroundColor: "transparent",
      textStyle: {
        fontFamily: resolveTypeface()
      },
      tooltip: {
        trigger: "item",
        textStyle: {
          color: labelColor
        },
        borderColor: normalizeColor(currentColors?.brs2),
        backgroundColor: resolveTooltipBackground(),
        formatter: (params: any) => {
          const value = roundToTwoDecimals(params.value ?? 0);
          const formattedValue = formatTooltipValue(value);
          return `${params.marker} ${params.name}<br/>${escapeHtml(resolveMetricLabel())}: ${formattedValue}`;
        }
      },
      series: [
        {
          type: "treemap",
          data: treemapData,
          width: "100%",
          height: "100%",
          roam: false,
          nodeClick: "zoomToNode",
          breadcrumb: {
            show: true,
            height: 22,
            top: 0,
            itemStyle: {
              color: normalizeColor(currentColors?.bgs2) ?? "rgba(0,0,0,0.1)",
              borderColor:
                normalizeColor(currentColors?.brs2) ?? "rgba(0,0,0,0.2)",
              borderWidth: 1,
              textStyle: {
                color: labelColor
              }
            },
            emphasis: {
              itemStyle: {
                color:
                  normalizeColor(currentColors?.bgs3) ?? "rgba(0,0,0,0.15)",
                textStyle: {
                  color: labelColor
                }
              }
            }
          },
          label: {
            show: true,
            formatter: (params: any) => {
              const value = roundToTwoDecimals(params.value ?? 0);
              const formattedValue = formatTooltipValue(value);
              return `{name|${params.name}}\n{value|${formattedValue}}`;
            },
            rich: {
              name: {
                fontSize: 13
              },
              value: {
                fontSize: 12
              }
            }
          },
          upperLabel: {
            show: true,
            height: 24,
            fontSize: 14,
            color: labelColor,
            formatter: (params: any) => params.name
          },
          itemStyle: {
            borderColor: normalizeColor(currentColors?.bgs1) ?? "#fff",
            borderWidth: 1,
            gapWidth: 1
          },
          emphasis: {
            label: {
              show: true
            }
          },
          levels: [
            {
              itemStyle: {
                borderWidth: 1,
                gapWidth: 2
              }
            },
            {
              itemStyle: {
                gapWidth: 1
              }
            },
            {
              colorSaturation: [0.35, 0.5],
              itemStyle: {
                gapWidth: 1,
                borderColorSaturation: 0.6
              }
            }
          ]
        }
      ]
    };
  }

  function buildHourlyHeatmapOption(): EChartsOption {
    const dataset = Array.isArray(data) ? data : [];
    const axisLabelColor = resolveAxisLabelColor();
    const axisLineColor = resolveAxisLineColor();

    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = i % 12 || 12;
      const period = i < 12 ? "a" : "p";
      return `${hour}${period}`;
    });

    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday"
    ];

    const heatmapData = new Map<string, number>();

    dataset.forEach((item: any) => {
      const date = new Date(item?.key ?? item?.start ?? 0);
      const dayOfWeek = date.getDay();
      const hour = date.getHours();
      const value = Number(item?.value ?? 0);
      const key = `${dayOfWeek}-${hour}`;
      heatmapData.set(key, (heatmapData.get(key) || 0) + value);
    });

    const chartData = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const key = `${day}-${hour}`;
        const value = heatmapData.get(key) || 0;
        chartData.push([hour, day, value > 0 ? roundToTwoDecimals(value) : 0]);
      }
    }

    const values = chartData.map((d) => d[2] as number).filter((v) => v > 0);
    const maxValue = values.length > 0 ? Math.max(...values) : 1;

    return {
      animation: false,
      backgroundColor: "transparent",
      textStyle: {
        fontFamily: resolveTypeface()
      },
      tooltip: {
        position: "top",
        backgroundColor: resolveTooltipBackground(),
        borderColor: normalizeColor(currentColors?.brs2),
        textStyle: {
          color: axisLabelColor
        },
        formatter: (params: any) => {
          const [hourIdx, dayIdx, value] = params.data;
          const formattedValue = formatTooltipValue(value);
          return `${days[dayIdx]}, ${hours[hourIdx]}<br/>${escapeHtml(resolveMetricLabel())}: ${formattedValue}`;
        }
      },
      grid: {
        height: "65%",
        top: "5%",
        left: "10%",
        right: "5%"
      },
      xAxis: {
        type: "category",
        data: hours,
        splitArea: {
          show: true,
          areaStyle: {
            color: [
              normalizeColor(currentColors?.bgs1) ?? "#fff",
              normalizeColor(currentColors?.bgs2) ?? "#f5f5f5"
            ]
          }
        },
        axisLabel: {
          color: axisLabelColor
        },
        axisLine: {
          lineStyle: {
            color: axisLineColor
          }
        }
      },
      yAxis: {
        type: "category",
        data: days,
        splitArea: {
          show: true,
          areaStyle: {
            color: [
              normalizeColor(currentColors?.bgs1) ?? "#fff",
              normalizeColor(currentColors?.bgs2) ?? "#f5f5f5"
            ]
          }
        },
        axisLabel: {
          color: axisLabelColor
        },
        axisLine: {
          lineStyle: {
            color: axisLineColor
          }
        }
      },
      visualMap: {
        min: 0,
        max: maxValue,
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: "5%",
        textStyle: {
          color: axisLabelColor
        },
        inRange: {
          color: [
            normalizeColor(currentColors?.bgs2) ?? "#ebedf0",
            normalizeColor(currentColors?.aps2) ?? "#40c463",
            normalizeColor(currentColors?.aps1) ?? "#30a14e"
          ]
        }
      },
      series: [
        {
          name: resolveYAxisName(),
          type: "heatmap",
          data: chartData,
          label: {
            show: true,
            formatter: (params: any) => {
              const value = params.data[2];
              return value > 0 ? value : "";
            }
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: "rgba(0, 0, 0, 0.5)"
            }
          }
        }
      ]
    };
  }

  function buildHourlyDistributionOption(): EChartsOption {
    const dataset = Array.isArray(data) ? data : [];
    const axisLabelColor = resolveAxisLabelColor();
    const axisLineColor = resolveAxisLineColor();

    const hourlyData = new Array(24)
      .fill(0)
      .map(() => ({ total: 0, count: 0 }));

    dataset.forEach((item: any) => {
      const date = new Date(item?.key ?? item?.start ?? 0);
      const hour = date.getHours();
      const value = Number(item?.value ?? 0);
      hourlyData[hour].total += value;
      hourlyData[hour].count += 1;
    });

    const hours = Array.from(
      { length: 24 },
      (_, i) => i.toString().padStart(2, "0") + ":00"
    );

    const chartData = hourlyData.map((data, hour) => ({
      hour,
      value: data.total,
      average: data.count > 0 ? data.total / data.count : 0,
      sessions: data.count
    }));

    const palette = resolvePalette([resolvePrimarySeriesName()]);
    const mainColor = palette[0];

    return {
      animation: false,
      backgroundColor: "transparent",
      textStyle: {
        fontFamily: resolveTypeface()
      },
      grid: {
        left: "3%",
        right: "3%",
        top: 40,
        bottom: 60,
        containLabel: true
      },
      tooltip: {
        trigger: "axis",
        borderColor: normalizeColor(currentColors?.brs2),
        textStyle: {
          color: axisLabelColor
        },
        backgroundColor: resolveTooltipBackground(),
        axisPointer: {
          type: "shadow"
        },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return "";
          const param = params[0];
          const hourData = chartData[param.dataIndex];
          const value = roundToTwoDecimals(hourData.value);
          const formattedValue = formatTooltipValue(value);
          const sessions = hourData.sessions;
          return `${hours[param.dataIndex]}<br/>${param.marker} Total: ${formattedValue}<br/>Sessions: ${sessions}`;
        }
      },
      xAxis: {
        type: "category",
        data: hours,
        axisLabel: {
          color: axisLabelColor,
          interval: 1,
          rotate: 45
        },
        axisTick: {
          alignWithLabel: true
        },
        axisLine: {
          lineStyle: {
            color: axisLineColor
          }
        }
      },
      yAxis: {
        type: "value",
        name: resolveYAxisName(),
        nameTextStyle: {
          color: axisLabelColor
        },
        axisLabel: {
          color: axisLabelColor
        },
        axisLine: {
          lineStyle: {
            color: axisLineColor
          }
        },
        splitLine: {
          lineStyle: {
            color: axisLineColor,
            type: "dashed"
          }
        }
      },
      series: [
        {
          name: resolvePrimarySeriesName(),
          type: "bar",
          data: chartData.map((d) => d.value),
          itemStyle: {
            color: mainColor
          },
          emphasis: {
            itemStyle: {
              color: mainColor
            }
          }
        }
      ]
    };
  }

  function buildPieOption(isDonut: boolean): EChartsOption {
    const dataset = Array.isArray(data) ? data : [];
    const groups = dataset.map((item: any) =>
      String(item?.group ?? item?.key ?? "Value")
    );
    const palette = resolvePalette(groups);
    const sliceColors = groups.map((group, index) =>
      resolveColor(group, index, palette)
    );
    const labelColor = resolveAxisLabelColor();
    const valueData = dataset.map((item: any) => ({
      value: Number(item?.value ?? 0),
      name: String(item?.group ?? item?.key ?? "Value")
    }));
    const total = valueData.reduce((sum, item) => sum + (item.value ?? 0), 0);
    const formattedTotal = formatTooltipValue(roundToTwoDecimals(total));
    const donutLabel = options?.donutLabel ? String(options.donutLabel) : "";
    const donutValue =
      typeof options?.donutFormatter === "function"
        ? options.donutFormatter(total)
        : formattedTotal;

    const series: echarts.PieSeriesOption = {
      type: "pie",
      radius: isDonut ? ["45%", "70%"] : "70%",
      center: ["45%", "50%"],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 6,
        borderColor: normalizeColor(currentColors?.bgs1) ?? "#fff",
        borderWidth: 2,
        color: ({ dataIndex }) => sliceColors[dataIndex % sliceColors.length]
      },
      label: {
        color: labelColor,
        formatter: (params: any) => {
          const rawValue =
            typeof params?.value === "number"
              ? roundToTwoDecimals(params.value)
              : params?.value;
          return `${params.name}: ${formatTooltipValue(rawValue)}`;
        }
      },
      emphasis: {
        scale: true,
        scaleSize: 6
      },
      tooltip: {
        trigger: "item",
        borderColor: normalizeColor(currentColors?.brs2)
      },
      data: valueData
    };

    const graphicElements =
      isDonut && donutLabel
        ? [
            {
              type: "text",
              left: "40%",
              top: "45%",
              style: {
                text: donutLabel,
                textAlign: "center",
                fill: labelColor,
                fontSize: 14,
                fontWeight: 500
              }
            },
            {
              type: "text",
              left: "40%",
              top: "50%",
              style: {
                text: String(donutValue ?? ""),
                textAlign: "center",
                fill: labelColor,
                fontSize: 16,
                fontWeight: 600
              }
            }
          ]
        : [];

    return {
      animation: false,
      backgroundColor: "transparent",
      textStyle: {
        fontFamily: resolveTypeface()
      },
      color: palette,
      tooltip: {
        trigger: "item",
        borderColor: normalizeColor(currentColors?.brs2),
        textStyle: {
          color: labelColor
        },
        backgroundColor: resolveTooltipBackground(),
        formatter: (params: any) => {
          const rawValue =
            typeof params?.value === "number"
              ? roundToTwoDecimals(params.value)
              : (params?.value ?? 0);
          const value = escapeHtml(formatTooltipValue(rawValue));
          const name = escapeHtml(params.name ?? "");
          const percent =
            typeof params?.percent === "number"
              ? `${params.percent.toFixed(1)}%`
              : "";
          return `${params.marker} ${name}: ${value}${percent ? ` (${percent})` : ""}`;
        }
      },
      legend: showLegend
        ? {
            orient: isConstrainedWidth ? "horizontal" : "vertical",
            type: "scroll",
            itemWidth: 12,
            itemHeight: 12,
            backgroundColor:
              normalizeColor(currentColors?.bgs1) ?? "rgba(0,0,0,0.1)",
            ...(isConstrainedWidth
              ? { bottom: 0, left: "center" }
              : { right: 0, top: "top" }),
            textStyle: {
              color: labelColor,
              overflow: "truncate"
            },
            pageIconColor: labelColor,
            pageIconInactiveColor:
              normalizeColor(currentColors?.fgs3) ?? "rgba(128, 128, 128, 0.5)",
            pageTextStyle: {
              color: labelColor
            },
            formatter: (name: string) => truncateText(name, 20),
            tooltip: {
              show: true,
              borderColor: normalizeColor(currentColors?.brs2)
            }
          }
        : { show: false },
      graphic: graphicElements,
      series: [series]
    };
  }

  function buildOption(): EChartsOption {
    switch (type) {
      case ChartType.STACKEDBAR:
        return buildBarOption(true);
      case ChartType.BAR:
        return buildBarOption(false);
      case ChartType.STACKEDAREA:
        return buildLineOption({ isArea: true, isStacked: true });
      case ChartType.AREA:
        return buildLineOption({ isArea: true, isStacked: false });
      case ChartType.LINE:
        return buildLineOption({ isArea: false, isStacked: false });
      case ChartType.DOUGHNUT:
        return buildPieOption(true);
      case ChartType.PIE:
        return buildPieOption(false);
      case ChartType.CALENDAR:
        return buildCalendarOption();
      case ChartType.HOURLY:
        return buildHourlyDistributionOption();
      case ChartType.HOURLY_HEATMAP:
        return buildHourlyHeatmapOption();
      case ChartType.SUNBURST:
        return buildSunburstOption();
      case ChartType.TREEMAP:
        return buildTreemapOption();
      default:
        return {};
    }
  }

  function ensureChart() {
    if (!shouldRenderChart || chart || !container) return;
    chart = echarts.init(container);
    resizeObserver = new ResizeObserver(() => {
      chart?.resize();
    });
    resizeObserver.observe(container);
    window.addEventListener("resize", handleResize);
  }

  function destroyChart() {
    if (resizeObserver && container) {
      resizeObserver.unobserve(container);
      resizeObserver.disconnect();
      resizeObserver = undefined;
    }
    window.removeEventListener("resize", handleResize);
    chart?.dispose();
    chart = undefined;
  }

  function updateChart() {
    if (!chart || !shouldRenderChart) return;
    const option = buildOption();
    chart.setOption(option, true);
  }

  function handleResize() {
    chart?.resize();
  }

  $effect(() => {
    if (shouldRenderChart) {
      ensureChart();
      updateChart();
    } else if (chart) {
      destroyChart();
    }
  });

  onDestroy(() => {
    destroyChart();
  });
</script>

{#if shouldRenderChart}
  <div bind:this={container} class="w-full h-full"></div>
{:else}
  <div class="flex w-full h-full items-center justify-center text-fgs2 text-sm">
    Chart type not supported yet
  </div>
{/if}
