<script lang="ts">
  import { onMount } from "svelte";
  import "@carbon/charts/styles.css";
  import { ChartType } from "@21n/types/analytics.type";
  import {
    ChartTheme,
    ScaleTypes,
    type ChartOptions,
    Alignments
  } from "@carbon/charts-svelte";
  import { retrieveCurrentColors } from "@21n/utils/theme.utils";
  import { determineCarbonChartTimeInterval } from "@21n/utils/carbon.utils";
  import { pieLabelFormatter } from "@21n/utils/carbon.utils";
  import { BarChartSimple, BarChartStacked } from "@nucleum/components/charts/custom/charts";
  import appearance from "@nucleum/stores/appearance.store";
  let type: ChartType;
  let data: any;
  let additionalOptions: any;

  export { type, data, additionalOptions };
  let isShow: boolean = false;
  let stackedBarChartRef: any;
  let defaultOptions: ChartOptions = {
    axes: {
      left: {
        mapsTo: "value",
        scaleType: ScaleTypes.LINEAR,
        stacked: true,
        percentage: additionalOptions?.percentage,
        thresholds: additionalOptions?.yThresholds
      },
      bottom: {
        mapsTo: "key",
        scaleType:
          additionalOptions?.xScale && additionalOptions.xScale === "labels"
            ? ScaleTypes.LABELS
            : ScaleTypes.TIME
        // ticks: {
        //   formatter: function (date: any) {
        //     return new Date(date).getDate();
        //   },
        //   values: additionalOptions?.xTicks,
        // },
      }
    },
    height: "100%",
    width: "100%",
    grid: {
      x: {
        enabled: false
      },
      y: {
        enabled: false
      }
    },
    resizable: false,
    animations: false,
    bars: {
      // width: 20,
      width: additionalOptions?.barsWidth ?? 30,
      maxWidth: 30
    },
    pie: {
      alignment: Alignments.CENTER,
      labels: {
        formatter: pieLabelFormatter
      }
    },
    donut: {
      alignment: Alignments.CENTER
    },
    theme: $appearance.colorScheme.isDark ? ChartTheme.G100 : ChartTheme.WHITE,
    zoomBar: {
      top: {
        enabled: false
      }
    },
    tooltip: {
      valueFormatter: (d: any) => d
    },
    legend: {
      enabled: false,
      alignment: Alignments.CENTER,
      clickable: true,
      truncation: {
        // threshold: 50,
        numCharacter: 20
      }
    },
    toolbar: {
      enabled: false
    }
  };
  let options: ChartOptions = defaultOptions;
  let currentColors = retrieveCurrentColors($appearance);
  initializeOptions();
  // type === ChartType.STACKEDBAR && console.log({ options, data });
  onMount(() => {
    manipulateCarbonToTidy();
    setTimeout(() => {
      isShow = true;
    }, 10);
  });

  function initializeOptions() {
    if (
      additionalOptions?.xDomain &&
      "axes" in options &&
      options.axes?.bottom
    ) {
      options.axes.bottom.domain = additionalOptions?.xDomain;
    }
    if (type === ChartType.STACKEDBAR) {
      options = {
        ...defaultOptions,
        timeScale: {
          timeInterval:
            additionalOptions?.timeInterval &&
            determineCarbonChartTimeInterval(additionalOptions?.timeInterval),
          timeIntervalFormats: additionalOptions?.timeIntervalFormats
        },
        ...additionalOptions
      };
    } else if (type === ChartType.STACKEDAREA) {
      options = {
        ...defaultOptions,
        ...additionalOptions,
        curve: "curveMonotoneX"
      };
    } else if (type === ChartType.PIE) {
      options = {
        ...defaultOptions,
        ...additionalOptions,
        resizable: true,
        donut: {
          center: {
            label: additionalOptions?.donutLabel ?? "",
            number: undefined,
            numberFormatter: additionalOptions?.donutFormatter
          },
          alignment: Alignments.CENTER
        },
        width: "100%"
      };
    } else if (type === ChartType.GUAGE) {
      options = {
        ...defaultOptions,
        ...additionalOptions,
        resizable: true,
        gauge: {
          type: additionalOptions?.guageType ?? "full",
          arcWidth: additionalOptions?.arcWidth ?? 10,
          alignment: Alignments.CENTER,
          showPercentageSymbol: false,
          numberFormatter: (d: any) => d.toFixed(0) + " %",
          valueFontSize: (v: any) => {
            if (v < 10) {
              return 2;
            } else if (v < 100) {
              return 12;
            } else {
              return 2;
            }
          }
        },
        legend: {
          enabled: false
        },
        color: {
          scale: {
            value: currentColors?.aps1!
          }
        }
      };
    }
  }

  function manipulateCarbonToTidy() {
    let backdrops = document.getElementsByClassName("chart-grid-backdrop");
    // console.log({ backdrops });
    for (let i = 0; i < backdrops.length; i++) {
      let backdrop = backdrops[i] as HTMLElement;
      // backdrop.style.fill = currentColors?.bgs1!;
      backdrop.style.fill = "transparent";
    }
    let skel = document.getElementsByClassName("cds--cc--skeleton");
    // console.log({ skel });
    for (let i = 0; i < skel.length; i++) {
      let sk = skel[i] as HTMLElement;
      sk.style.width = "100%";
    }
    // let mainDonutFigure = document.getElementsByClassName(
    //   "donut-figure"
    // )[0] as HTMLElement;
    // if (mainDonutFigure) {
    //   mainDonutFigure.style.fill = currentColors?.fgs1!;
    //   mainDonutFigure.style.fontSize = "5rem";
    // }
  }

  function paintAdditionalBarOptions() {
    if (stackedBarChartRef) {
      // console.log({ stackedBarChartRef });
    }
    // // Adding the totals on bars
    // data.forEach((d: any, i: any) => {
    //   const bar = stackedBarChartRef.getSVGRefs().nodes[i];

    //   // Create text elements for the totals
    //   const total = document.createElementNS(
    //     "http://www.w3.org/2000/svg",
    //     "text"
    //   );
    //   total.textContent = d.value;

    //   // Position the totals on the top of the bars
    //   const bbox = bar.getBBox();
    //   const x = bbox.x + bbox.width / 2;
    //   const y = bbox.y;

    //   // Set attributes and append to the chart SVG
    //   total.setAttribute("x", x);
    //   //total.setAttribute("y", y - 5); // 5px offset to position it above the bar
    //   stackedBarChartRef.getSVGRefs().holder.appendChild(total);
    // });

    // let sums = [1, 2, 3, 4];
    // const chartSVG = document.querySelector(".bx--cc--chart-svg");
    // sums.forEach((sum, idx) => {
    //   let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    //   text.setAttribute("x" /* x-coordinate based on idx */);
    //   text.setAttribute("y" /* y-coordinate based on sum or other measures */);
    //   text.textContent = sum;
    //   chartSVG?.appendChild(text);
    // });
  }
</script>

<div
  class="flex w-full h-full justify-center items-center {isShow
    ? ''
    : 'opacity-0'}"
>
  {#if type === ChartType.BAR}
    <BarChartSimple {data} {options} />
  {:else if type === ChartType.STACKEDBAR}
    <BarChartStacked {data} {options} />
    <!-- {:else if type === ChartType.LINE}
    <LineChart {data} {options} />
  {:else if type === ChartType.STACKEDAREA}
    <StackedAreaChart {data} {options} />
  {:else if type === ChartType.AREA}
    <AreaChart {data} {options} />
  {:else if type === ChartType.PIE}
    <DonutChart {data} {options} />
  {:else if type === ChartType.GUAGE}
    <GaugeChart {data} {options} /> -->
  {:else}
    <div>Chart type not supported yet</div>
  {/if}
</div>
