<script lang="ts">
  import { Orientation } from "@21n/elements/direction.enum";
  import type { BarChartOptions } from "@carbon/charts-svelte";
  import {
    select,
    scaleLinear,
    max,
    scaleBand,
    axisLeft,
    axisBottom
  } from "d3";
  import { onDestroy, onMount } from "svelte";
  //TODO - import dependency on local
  import { roundOffToNdigitsAfterDecimal } from "@21n/shared-utils/number.utils";
  import {
    customColor,
    retrieveCurrentColors
  } from "@21n/utils/theme.utils";
  import type { ChartDataPoint } from "@nucleum/components/charts/chartDataPoint.type";
  import { generateUID } from "@21n/utils/utils";
  import appearance from "@nucleum/stores/appearance.store";

  let {
    data = [],
    options,
    orientation = Orientation.Vertical
  }: {
    data?: ChartDataPoint[];
    options: BarChartOptions;
    orientation?: Orientation;
  } = $props();

  let themeColors = $state(retrieveCurrentColors($appearance));
  const chartID = generateUID();

  let containerRef = $state<any>(null);
  let scrollableElementContainerRef = $state<any>(null);
  let fixedXAxisRef = $state<any>(null);
  let fixedYAxisRef = $state<any>(null);
  let legendContainerRef = $state<any>(null);
  let wrapperRef = $state<any>(null);
  let informationModal = $state<any>(null);
  let previouslyCheckedItem = $state<HTMLInputElement>();
  // let previouslyCheckedId: string = "";

  let currentDataLength: number = 0;

  let SVGScrollableDimensionLength: number = 0;

  let filteredData: ChartDataPoint[] = [];
  let sanitizedData: ChartDataPoint[] = [];
  // in sanitizedData we will be modifying the data so that if there are multiple data items present with same key then we will only be considering the first one and will be ignoring the rest

  let groups = $state<string[]>([]);

  let selectedGroups = $state<string[]>([]);

  let BARS_AND_AXIS_SVG: any = null;
  let FIXED_AXIS_GROUP: any = null;
  let isMounted = false;

  let colors = $state<Record<string, string>>({});

  let mouseHoverData = $state<ChartDataPoint>({
    key: "",
    value: 0,
    group: ""
  });

  // Please write these values along with their units
  const DEFAULT_CONTAINER_DIMENSIONS = {
    width: "100%",
    height: "100%"
  };

  // below default values are in px
  const DEFAULT_BARS = {
    width: 300,
    spacingFactor: 0.2 // this is not in px
  };
  // below default values are in px
  const DEFAULT_MARGIN = {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
  };

  // below default values are in px
  const FIXED_AXES_DIMENSION = {
    x: 40, //if x-axis is fixed(meaning: non-scrollable) then this will be used as height
    y: 50 //if y-axis is fixed(meaning: non-scrollable) then this will be used as width
  };

  // below default values are in px
  const MOBILE_AXES_DIMENSION = {
    x: 30, //if x-axis is mobile(meaning: scrollable) then this will be used as height
    y: 40 //if y-axis is mobile(meaning: scrollable) then this will be used as width
  };

  const CHART_PADDING = {
    top: 10,
    right: 30,
    bottom: 0,
    left: 0
  };

  const VALUE_RECTANGLE_DIMENSION = {
    width: 10,
    height: 10
  };
  // this will be the dimension of the text that will be on either top of the bar(when orientation vertical) or on the right(when horizontal), to showcase its value

  //there is one bug : currently if chart is in vertical orientation then the left padding is not being applied, and if the chart is in horizontal orientation then the bottom padding is not being applied

  let CONTAINER_DIMENSIONS = {
    width: options.width ?? DEFAULT_CONTAINER_DIMENSIONS.width,
    height: options.height ?? DEFAULT_CONTAINER_DIMENSIONS.height
  };

  let BARS = {
    width: options.bars?.width ?? DEFAULT_BARS.width, // in horizontal orientation this will be the height of the bars but for simplicity we are calling it width

    spacingFactor: options.bars?.spacingFactor ?? DEFAULT_BARS.spacingFactor
  };

  function refreshDerivedState() {
    themeColors = retrieveCurrentColors($appearance);
    CONTAINER_DIMENSIONS = {
      width: options.width ?? DEFAULT_CONTAINER_DIMENSIONS.width,
      height: options.height ?? DEFAULT_CONTAINER_DIMENSIONS.height
    };
    BARS = {
      width:
        calculateBarWidth(SVGScrollableDimensionLength) ?? DEFAULT_BARS.width,
      spacingFactor: options.bars?.spacingFactor ?? DEFAULT_BARS.spacingFactor
    };
    groups = [...new Set(data.map((d) => d.group))];
  }

  function sanitizeLinearScaleValue(
    value: number,
    scale: (value: number) => any
  ) {
    if (isNaN(scale(Math.abs(value)))) return 0;
    return scale(Math.abs(value));
  }

  function getRandomHue() {
    const hues = [30, 90, 150, 210, 270, 330];
    return hues[Math.floor(Math.random() * hues.length)];
  }

  function calculateBarWidth(SVGWidth: number) {
    if (options && options.bars && options.bars.width) {
      return options.bars.width;
    }
    if (!SVGWidth) return DEFAULT_BARS.width;
    return (
      (SVGWidth - (filteredData.length - 1) * BARS.spacingFactor) /
      filteredData.length
    );
  }
  function updateGraph2(id: string) {
    if (!document) return;
    console.log("inside updateGraph2 id ", id);
    let currentlyCheckedItem: any = document?.getElementById(id);
    console.log("currentlyCheckedItem ", currentlyCheckedItem);
    if (currentlyCheckedItem && id === previouslyCheckedItem?.id) {
      console.log("its previously checked item, so returning");
      currentlyCheckedItem.checked = true;
      return;
    }
    previouslyCheckedItem.checked = false;
    console.log("previouslyCheckedItem ", previouslyCheckedItem);
    console.log("data inside updateGraph2 ", data);
    filteredData = data.filter((d) => d.group === currentlyCheckedItem.value);
    console.log(
      "filteredData for id ",
      id + " is " + filteredData.map((d) => d.key)
    );
    repaintGraph();
    previouslyCheckedItem = currentlyCheckedItem;
  }

  function updateGraph() {
    if (!wrapperRef) return;
    wrapperRef
      .querySelectorAll('input[type="checkbox"]')
      .forEach((checkbox: any) => {
        if (checkbox.checked) {
          selectedGroups.push(checkbox.value);
        } else {
          selectedGroups = selectedGroups.filter((group) => {
            return group !== checkbox.value;
          });
        }
      });
    filteredData =
      selectedGroups.length === 0
        ? data
        : data.filter((d) => {
            return selectedGroups.includes(d.group);
          });
    // filteredData =
    //   selectedGroups.length === 0
    //     ? sanitizedData
    //     : sanitizedData.filter((d) => {
    //         return selectedGroups.includes(d.group);
    //       });//*this is done so that the chart is rendered with the data that is present at the time of mounting

    repaintGraph();
  }

  function repaintGraph() {
    if (!isMounted) return;
    BARS_AND_AXIS_SVG?.remove();
    FIXED_AXIS_GROUP?.remove();
    BARS_AND_AXIS_SVG = null;
    FIXED_AXIS_GROUP = null;
    paintGraph();
    handleEventListeningForBars();
  }

  function paintGraph() {
    if (
      !wrapperRef ||
      !containerRef ||
      !scrollableElementContainerRef ||
      !fixedXAxisRef ||
      !fixedYAxisRef
    )
      return;
    const WRAPPER = select(wrapperRef);
    const CC_CONTAINER = select(containerRef);
    const SCROLLABLE_ELEMENT_CONTAINER = select(scrollableElementContainerRef);
    const FIXED_X_AXIS = select(fixedXAxisRef);
    const FIXED_Y_AXIS = select(fixedYAxisRef);
    const LEGEND_CONTAINER = select(legendContainerRef);

    //setting the dimensions of the wrapper
    WRAPPER.style("width", CONTAINER_DIMENSIONS.width)
      .style("height", CONTAINER_DIMENSIONS.height)
      .style("box-sizing", `border-box`);
    // .style("background", "pink");

    // setting the dimensions of the container and since the WRAPPER container the chart along with the legend and we want the chart to take up the rest of the space so we are subtracting the height of the legend from the height of the wrapper
    CC_CONTAINER.style("width", `100%`).style(
      "height",
      `${
        wrapperRef.offsetHeight -
        legendContainerRef.offsetHeight -
        (DEFAULT_MARGIN.top + DEFAULT_MARGIN.bottom)
      }px`
    );

    LEGEND_CONTAINER.style("width", `${containerRef.offsetWidth}px`).style(
      "height",
      "40px"
    );

    // since the width of the scrollable container depends on the orientation of the chart, if the orientation is vertical then the scrollable container will have the width of the container minus the width of the fixed y-axis, and the x-axis will be the part of the SCROLLABLE_CONTAINER's SVG and if the orientation is horizontal then the scrollable container will have the width of the container, since in that case the y-axis will be the part of the scrollable container's SVG and the x-axis will be the part of the fixed x-axis, and the height of the scrollable container will be the height of the container minus the height of the fixed x-axis
    SCROLLABLE_ELEMENT_CONTAINER.style(
      "width",
      `${
        orientation === Orientation.Vertical
          ? containerRef.offsetWidth - FIXED_AXES_DIMENSION.y
          : containerRef.offsetWidth
      }px`
    ).style(
      "height",
      `${
        orientation === Orientation.Vertical
          ? containerRef.offsetHeight
          : containerRef.offsetHeight - FIXED_AXES_DIMENSION.x
      }px`
    );

    SVGScrollableDimensionLength =
      (BARS.width * (filteredData.length + BARS.spacingFactor)) /
        (1 - BARS.spacingFactor) +
      (orientation === Orientation.Vertical
        ? CHART_PADDING.right
        : CHART_PADDING.top); // if orientation is vertical (bars are vertical) then this will be width else height, also here we are adding the right margin only because the left margin will be added in the FIXED_Y_AXIS

    const SVGWidthAdjustment =
      orientation === Orientation.Vertical
        ? SVGScrollableDimensionLength <
          containerRef.offsetWidth - FIXED_AXES_DIMENSION.y
          ? containerRef.offsetWidth -
            FIXED_AXES_DIMENSION.y -
            SVGScrollableDimensionLength
          : 0
        : SVGScrollableDimensionLength <
            containerRef.offsetHeight - FIXED_AXES_DIMENSION.x
          ? containerRef.offsetHeight -
            FIXED_AXES_DIMENSION.x -
            SVGScrollableDimensionLength
          : 0;
    // this adjustment is to adjust the width of the scrollable container if the width of the scrollable container is less than the width of the container, then we will adjust the width of the scrollable container to be equal to the width of the container, so that the scrollable container and its SVG can take up the whole width of the container

    SVGScrollableDimensionLength =
      SVGScrollableDimensionLength + SVGWidthAdjustment;

    // since for the vertical orientation the x-axis will be the part of the scrollable container's SVG and y-axis will be the part of the fixed y-axis, and for the horizontal orientation the x-axis will be the part of the fixed x-axis and the y-axis will be the part of the scrollable container's SVG
    BARS_AND_AXIS_SVG = SCROLLABLE_ELEMENT_CONTAINER.append("svg")
      .style("direction", "ltr")
      // .style("padding", BARS_AND_AXIS_SVG_PADDING)
      .attr(
        "height",
        orientation === Orientation.Vertical
          ? "100%"
          : `${SVGScrollableDimensionLength}px`
      )
      .attr(
        "width",
        orientation === Orientation.Vertical
          ? `${SVGScrollableDimensionLength}px`
          : "100%"
      )
      .attr(
        "transform",
        orientation === Orientation.Vertical
          ? SVGScrollableDimensionLength <
            containerRef.offsetWidth - FIXED_AXES_DIMENSION.y
            ? `translate(${
                SVGScrollableDimensionLength -
                (containerRef.offsetWidth - FIXED_AXES_DIMENSION.y)
              },0)`
            : `translate(0,0)`
          : SVGScrollableDimensionLength <
              containerRef.offsetHeight - FIXED_AXES_DIMENSION.x
            ? `translate(0,${
                containerRef.offsetHeight -
                FIXED_AXES_DIMENSION.x -
                SVGScrollableDimensionLength
              })`
            : `translate(0,0)`
      );

    // defining the dimensions for the fixed axes
    FIXED_X_AXIS.style(
      "width",
      `${orientation === Orientation.Vertical ? "0" : "100"}%`
    ).style(
      "height",
      `${orientation === Orientation.Vertical ? 0 : FIXED_AXES_DIMENSION.x}px`
    );
    FIXED_Y_AXIS.style(
      "width",
      `${orientation === Orientation.Vertical ? FIXED_AXES_DIMENSION.y : 0}`
    ).style(
      "height",
      `${
        orientation === Orientation.Vertical ? containerRef.offsetHeight : 0
      }px`
    );

    const maxValue = max(filteredData, (d) => Math.abs(d.value));
    // this is the max value of the data, we will use this to define the domain of the scales and other stuff as well

    // defining the scales

    const xScale =
      orientation === Orientation.Vertical
        ? scaleBand()
            .domain(filteredData.map((d, i) => d.key))
            .range([
              0,
              SVGScrollableDimensionLength -
                SVGWidthAdjustment -
                CHART_PADDING.right
            ])
            .padding(BARS.spacingFactor)
        : maxValue
          ? scaleLinear()
              .domain([0, maxValue ?? 0])
              .range([
                0,
                containerRef.offsetWidth -
                  MOBILE_AXES_DIMENSION.y -
                  (CHART_PADDING.right + VALUE_RECTANGLE_DIMENSION.width) -
                  CHART_PADDING.left
              ])
          : scaleLinear()
              .domain([])
              .range([
                0,
                containerRef.offsetWidth -
                  MOBILE_AXES_DIMENSION.y -
                  (CHART_PADDING.right + VALUE_RECTANGLE_DIMENSION.width) -
                  CHART_PADDING.left
              ]);
    // logically for horizontal condition, the range should be the width of the SCROLLABLE_ELEMENT_CONTAINER minus the width of the y axis(since it is included in the SVG) but the width of the SCROLLABLE_ELEMENT_CONTAINER when the orientation is horizontal is containerRef.offsetWidth

    const yScale =
      orientation === Orientation.Vertical
        ? maxValue
          ? scaleLinear()
              .domain([0, maxValue ?? 0])
              .range([
                containerRef.offsetHeight -
                  MOBILE_AXES_DIMENSION.x -
                  (CHART_PADDING.top + VALUE_RECTANGLE_DIMENSION.height) -
                  CHART_PADDING.bottom,
                0
              ])
          : scaleLinear()
              .domain([])
              .range([
                containerRef.offsetHeight -
                  MOBILE_AXES_DIMENSION.x -
                  (CHART_PADDING.top + VALUE_RECTANGLE_DIMENSION.height) -
                  CHART_PADDING.bottom,
                0
              ])
        : scaleBand()
            .domain(filteredData.map((d, i) => d.key))
            .range([
              0,
              SVGScrollableDimensionLength -
                SVGWidthAdjustment -
                CHART_PADDING.top
            ])
            .padding(BARS.spacingFactor);

    const yScaleWithFixedLengthCalculationDeformity =
      orientation === Orientation.Vertical
        ? maxValue
          ? scaleLinear()
              .domain([0, maxValue ?? 0])
              .range([
                0,
                containerRef.offsetHeight -
                  MOBILE_AXES_DIMENSION.x -
                  (CHART_PADDING.top + VALUE_RECTANGLE_DIMENSION.height) -
                  CHART_PADDING.bottom
              ])
          : scaleLinear()
              .domain([])
              .range([
                0,
                containerRef.offsetHeight -
                  MOBILE_AXES_DIMENSION.x -
                  (CHART_PADDING.top + VALUE_RECTANGLE_DIMENSION.height) -
                  CHART_PADDING.bottom
              ])
        : scaleBand()
            .domain(filteredData.map((d, i) => d.key))
            .range([
              0,
              SVGScrollableDimensionLength -
                SVGWidthAdjustment -
                CHART_PADDING.top
            ])
            .padding(BARS.spacingFactor);
    // logically for vertical condition the range should be the height of the SCROLLABLE_ELEMENT_CONTAINER minus the height of the x axis(since it is included in the SVG) but the height of the SCROLLABLE_ELEMENT_CONTAINER when the orientation is vertical is containerRef.offsetHeight

    // drawing the axes

    const xAxis =
      orientation === Orientation.Vertical
        ? //@ts-ignore, ignoring because we are sure that the xScale is of type scaleBand, since we used the same condition above to define the xScale
          axisBottom(xScale)
        : //@ts-ignore, ignoring because we are sure that the xScale is of type scaleLinear, since we used the same condition above to define the xScale
          axisBottom(xScale).tickFormat((d) => `${d}`);

    const yAxis =
      orientation === Orientation.Vertical
        ? //@ts-ignore, ignoring because we are sure that the yScale is of type scaleLinear, since we used the same condition above to define the yScale
          axisLeft(yScale).tickFormat((d) => `${d}`)
        : //@ts-ignore, ignoring because we are sure that the yScale is of type scaleBand, since we used the same condition above to define the yScale
          axisLeft(yScale);

    // below is the mobile axis
    BARS_AND_AXIS_SVG.append("g")
      .attr(
        "transform",
        orientation === Orientation.Vertical
          ? `translate(${0},${
              containerRef.offsetHeight -
              MOBILE_AXES_DIMENSION.x -
              CHART_PADDING.bottom
            })`
          : `translate(${MOBILE_AXES_DIMENSION.y + CHART_PADDING.left},${
              CHART_PADDING.top + SVGWidthAdjustment
            })`
      )
      .call(orientation === Orientation.Vertical ? xAxis : yAxis);

    //appending one more line in the mobile axis which will be the part of this mobile axis if the SVG length is not enough to at least cover the width of the container(for vertical orientation) and height(for horizontal orientation) then we will append one more line to the mobile axis, so that the user can see the axis even if the SVG is not enough to cover the height of the container
    BARS_AND_AXIS_SVG.append("line")
      .attr(
        "x1",
        orientation === Orientation.Vertical
          ? 0
          : MOBILE_AXES_DIMENSION.y + CHART_PADDING.left
      )
      .attr(
        "y1",
        orientation === Orientation.Vertical
          ? containerRef.offsetHeight -
              MOBILE_AXES_DIMENSION.x -
              CHART_PADDING.bottom
          : 0
      )
      .attr(
        "x2",
        orientation === Orientation.Vertical
          ? SVGScrollableDimensionLength
          : MOBILE_AXES_DIMENSION.y + CHART_PADDING.left
      )
      .attr(
        "y2",
        orientation === Orientation.Vertical
          ? containerRef.offsetHeight -
              MOBILE_AXES_DIMENSION.x -
              CHART_PADDING.bottom
          : SVGScrollableDimensionLength
      )
      .attr("stroke", themeColors.fgs1)
      .attr("stroke-width", 1)
      // .attr("stroke-dasharray", "5,5")
      .attr("stroke-opacity", 1);

    // below is the fixed axis
    if (orientation === Orientation.Vertical) {
      FIXED_AXIS_GROUP = FIXED_Y_AXIS.append("g")
        .attr(
          "transform",
          `translate(${
            FIXED_AXES_DIMENSION.y - CHART_PADDING.left - 1 + CHART_PADDING.left
          },${CHART_PADDING.top + VALUE_RECTANGLE_DIMENSION.height})`
        )
        .call(yAxis);
      // the -1 is to prevent the axis from overflowing
    } else {
      FIXED_AXIS_GROUP = FIXED_X_AXIS.append("g")
        .attr(
          "transform",
          `translate(${MOBILE_AXES_DIMENSION.y + CHART_PADDING.left},1)`
        )
        .call(xAxis);
      // the 1 is to prevent the axis from overflowing
    }

    // drawing bars
    const RECTANGLES = BARS_AND_AXIS_SVG.selectAll("rect")
      .data(filteredData)
      .enter()
      .append("rect");

    RECTANGLES.classed("cc-bar", true);

    RECTANGLES.attr("width", function (d: any) {
      return orientation === Orientation.Vertical
        ? //@ts-ignore, ignoring because we are sure that the xScale is of type scaleBand, since we used the same condition above to define the xScale
          xScale.bandwidth()
        : //@ts-ignore, ignoring because we are sure that the xScale is of type scaleLinear, since we used the same condition above to define the xScale
          sanitizeLinearScaleValue(d.value, xScale);
    })
      .attr("height", function (d: any) {
        return orientation === Orientation.Vertical
          ? //@ts-ignore, ignoring because we are sure that the xScale is of type scaleBand, since we used the same condition above to define the xScale
            sanitizeLinearScaleValue(
              d.value,
              //@ts-ignore, ignoring because we are sure that the xScale is of type scaleBand, since we used the same condition above to define the xScale
              yScaleWithFixedLengthCalculationDeformity
            )
          : //@ts-ignore, ignoring because we are sure that the xScale is of type scaleLinear, since we used the same condition above to define the xScale
            yScale.bandwidth();
      })
      .attr(
        "fill",
        (d: { key: string; value: string; group: string }, i: number) =>
          colors[d.group]
      )
      .attr("x", function (d: any, i: any) {
        return orientation === Orientation.Vertical
          ? (xScale(d.key) ?? 0)
          : MOBILE_AXES_DIMENSION.y + CHART_PADDING.left;
      })
      .attr("y", function (d: any) {
        return orientation === Orientation.Vertical
          ? (containerRef.offsetHeight -
              MOBILE_AXES_DIMENSION.x -
              CHART_PADDING.bottom -
              //@ts-ignore, ignoring because we are sure that the xScale is of type scaleLinear, since we used the same condition above to define the xScale
              sanitizeLinearScaleValue(
                d.value,
                //@ts-ignore, ignoring because we are sure that the xScale is of type scaleLinear, since we used the same condition above to define the xScale
                yScaleWithFixedLengthCalculationDeformity
              ) ?? 0)
          : yScale(d.key)
            ? //@ts-ignore, handled the case of undefined
              yScale(d.key) + CHART_PADDING.top + SVGWidthAdjustment
            : CHART_PADDING.top;
      });

    // plotting the value labels
    for (let i = 0; i < filteredData.length; i++) {
      const value = Math.abs(filteredData[i].value);

      BARS_AND_AXIS_SVG.append("text")
        .text(roundOffToNdigitsAfterDecimal(Math.abs(filteredData[i].value), 2))
        .attr("x", () => {
          return (
            (orientation === Orientation.Vertical
              ? //@ts-ignore, ignoring because we are sure that the xScale is of type scaleBand, since we used the same condition above to define the xScale
                xScale(filteredData[i].key) +
                //@ts-ignore, ignoring because we are sure that the xScale is of type scaleBand, since we used the same condition above to define the xScale
                xScale.bandwidth() / 2 -
                VALUE_RECTANGLE_DIMENSION.width
              : //@ts-ignore, ignoring because we are sure that the xScale is of type scaleLinear, since we used the same condition above to define the xScale
                sanitizeLinearScaleValue(value, xScale) +
                MOBILE_AXES_DIMENSION.y +
                CHART_PADDING.left) + 5 ?? 0 // the +5 is to add some padding between the value label and the bar
          );
        })
        .attr("y", () => {
          return (
            (orientation === Orientation.Vertical
              ? containerRef.offsetHeight -
                MOBILE_AXES_DIMENSION.x -
                CHART_PADDING.bottom -
                //@ts-ignore, ignoring because we are sure that the yScale is of type scaleLinear, since we used the same condition above to define the xScale
                sanitizeLinearScaleValue(
                  Math.abs(filteredData[i].value),
                  //@ts-ignore, ignoring because we are sure that the yScale is of type scaleLinear, since we used the same condition above to define the xScale
                  yScaleWithFixedLengthCalculationDeformity
                ) -
                VALUE_RECTANGLE_DIMENSION.height
              : //@ts-ignore, ignoring because we are sure that the xScale is of type scaleBand, since we used the same condition above to define the xScale
                yScale(filteredData[i].key) +
                CHART_PADDING.top +
                VALUE_RECTANGLE_DIMENSION.height +
                //@ts-ignore, ignoring because we are sure that the xScale is of type scaleBand, since we used the same condition above to define the xScale
                yScale.bandwidth() / 2 -
                VALUE_RECTANGLE_DIMENSION.height +
                SVGWidthAdjustment) ?? 0
          );
        })
        .classed("cc-value-label text-b5 text-fgs1 fill-fgs1 font-bold", true);
    }

    // dotted line for the max value
    const MAX_VALUE_LINE = BARS_AND_AXIS_SVG.append("line")
      .attr(
        "x1",
        orientation === Orientation.Vertical
          ? 0
          : //@ts-ignore, ignoring because we are sure that the xScale is of type scaleLinear, since we used the same condition above to define the xScale
            (sanitizeLinearScaleValue(maxValue, xScale) ?? 0)
      )
      .attr(
        "y1",
        orientation === Orientation.Vertical
          ? //@ts-ignore, ignoring because we are sure that the xScale is of type scaleLinear, since we used the same condition above to define the xScale
            (0 ?? 0)
          : SVGScrollableDimensionLength
      )
      .attr(
        "x2",
        orientation === Orientation.Vertical
          ? SVGScrollableDimensionLength
          : //@ts-ignore, ignoring because we are sure that the xScale is of type scaleLinear, since we used the same condition above to define the xScale
            (sanitizeLinearScaleValue(maxValue, xScale) ?? 0)
      )
      .attr(
        "y2",
        orientation === Orientation.Vertical //@ts-ignore, ignoring because we are sure that the xScale is of type scaleLinear, since we used the same condition above to define the xScale
          ? (0 ?? 0)
          : 0
      )
      .attr("stroke", "rgba(var(--colors-fgs1),1)")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "5,5")
      .attr("stroke-opacity", 0.5)
      .attr(
        "transform",
        orientation === Orientation.Vertical
          ? `translate(0,${
              CHART_PADDING.top + VALUE_RECTANGLE_DIMENSION.height
            })`
          : `translate(${MOBILE_AXES_DIMENSION.y + CHART_PADDING.left},0)`
      );
  }

  let barMouseOverHandler: ((e: any) => void) | null = null;
  let barMouseOutHandler: ((e: any) => void) | null = null;
  let docMouseMoveHandler: ((event: MouseEvent) => void) | null = null;
  function handleEventListeningForBars() {
    if (informationModal && document) {
      const allBars = document.querySelectorAll(".cc-bar");
      barMouseOverHandler = (e: any) => {
        mouseHoverData = {
          key: e.target.__data__.key,
          value: e.target.__data__.value,
          group: e.target.__data__.group
        };
      };
      barMouseOutHandler = (_e: any) => {
        mouseHoverData = {
          key: "",
          value: 0,
          group: ""
        };
      };
      allBars.forEach((bar) => {
        bar.addEventListener("mouseover", barMouseOverHandler!);
        bar.addEventListener("mouseout", barMouseOutHandler!);
      });
      docMouseMoveHandler = (event: MouseEvent) => {
        if (informationModal) {
          informationModal.setAttribute(
            "style",
            `top:${event.clientY - 90}px;left:${event.clientX - 130}px;`
          );
        }
      };
      document.addEventListener("mousemove", docMouseMoveHandler);
    }
  }

  function detectScrollEnd() {
    if (scrollableElementContainerRef) {
      const {
        scrollLeft,
        scrollTop,
        scrollWidth,
        offsetWidth,
        scrollHeight,
        offsetHeight
      } = scrollableElementContainerRef;

      const relaxationFactor = 0;

      if (orientation === Orientation.Vertical) {
        if (scrollLeft === -(scrollWidth - offsetWidth - relaxationFactor)) {
          return;
        }
      } else {
        if (scrollTop === scrollHeight - offsetHeight) {
          return;
        }
      }
    }
  }

  onMount(() => {
    refreshDerivedState();
    console.log("data received in Simple.svelte ", data);
    console.log("options received in Simple.svelte ", options);
    filteredData = data.filter((d) => d.group === previouslyCheckedItem?.value);
    console.log(
      "filteredData for id ",
      previouslyCheckedItem?.id + " is " + filteredData.map((d) => d.key)
    );
    console.log("data after filter in Simple.svelte ", data);
    if (options && options.color && options.color.scale) {
      groups.forEach((group: string, groupIndex) => {
        //@ts-ignore, we are aware about the type problem here, but we cannot do much about it since the type of scale is provided in the library itself
        if (options.color.scale[group]) {
          //@ts-ignore, we are aware about the type problem here, but we cannot do much about it since the type of scale is provided in the library itself
          colors[group] = options.color.scale[group];
        } else {
          colors[group] = customColor($appearance, getRandomHue());
        }
      });
    } else {
      groups.forEach((group, groupIndex) => {
        colors[group] = customColor($appearance, getRandomHue());
      });
    }

    paintGraph();
    isMounted = true;

    if (scrollableElementContainerRef) {
      scrollableElementContainerRef.addEventListener("scroll", detectScrollEnd);
    }
    handleEventListeningForBars();
  });

  $effect.pre(() => {
    refreshDerivedState();
    if (isMounted) {
      filteredData = previouslyCheckedItem
        ? data.filter((d) => d.group === previouslyCheckedItem.value)
        : data;
      repaintGraph();
    }
  });

  onDestroy(() => {
    if (scrollableElementContainerRef) {
      scrollableElementContainerRef.removeEventListener("scroll", detectScrollEnd);
    }
    const allBars = document?.querySelectorAll?.(".cc-bar");
    if (allBars && barMouseOverHandler && barMouseOutHandler) {
      allBars.forEach((bar) => {
        bar.removeEventListener("mouseover", barMouseOverHandler!);
        bar.removeEventListener("mouseout", barMouseOutHandler!);
      });
    }
    if (docMouseMoveHandler) {
      document.removeEventListener("mousemove", docMouseMoveHandler);
    }
  });
</script>

<div
  style={`padding:${DEFAULT_MARGIN.top}px ${DEFAULT_MARGIN.right}px ${DEFAULT_MARGIN.bottom}px ${DEFAULT_MARGIN.left}px`}
  class={`cc-wrapper overflow-hidden`}
  bind:this={wrapperRef}
>
  <div
    class="cc-container overflow-auto flex-col justify-start"
    bind:this={containerRef}
  >
    <div class="cc-y-scrollable-wrapper flex">
      <!-- the reason why we have assigned a height value to the SVG is because at the time of mounting of the component if a custom height is not set, then the SVG will acquire a specified height by the browser, which was affecting our container height which ultimately was causing it to overflow -->
      <svg height="10px" bind:this={fixedYAxisRef} class="y-axis fixed-axes"
      ></svg>
      <!-- The below div will also contain an axis along with the bars, which axis is going to be that depends on the orientation, since the axis inside the div will be scrollable so if the orientation is vertical then, the axis inside is going to be x-axis, and vice versa for it to be y-axis -->
      <div
        class="cc-scrollable-container overflow-auto"
        bind:this={scrollableElementContainerRef}
      ></div>
    </div>
    <svg height="10px" bind:this={fixedXAxisRef} class="x-axis fixed-axes"
    ></svg>
  </div>
  <div
    bind:this={legendContainerRef}
    style={`padding-left:${
      (orientation === Orientation.Vertical
        ? FIXED_AXES_DIMENSION.y
        : MOBILE_AXES_DIMENSION.y) + CHART_PADDING.left
    }px; `}
    class={`legend-container flex flex-wrap h-[40px] max-h-[40px] gap-x-4 overflow-auto`}
  >
    {#each groups as group, index}
      <!-- <LegendItem label={dataItem} checked={true} /> -->
      <label
        for={group + chartID}
        class="flex gap-2 items-center justify-center text-b5 cursor-pointer"
      >
        <div class="checkbox-container">
          {#if index === 0}
            <input
              onchange={() => updateGraph2(group + chartID)}
              class="w-[10px] h-[10px] cursor-pointer p-1"
              id={group + chartID}
              type="checkbox"
              value={group}
              checked={true}
              bind:this={previouslyCheckedItem}
            />{/if}
          <input
            onchange={() => updateGraph2(group + chartID)}
            class="w-[10px] h-[10px] cursor-pointer p-1"
            id={group + chartID}
            type="checkbox"
            value={group}
            checked={false}
          />
          <span
            style={`${
              options &&
              options.color &&
              options.color.scale &&
              //@ts-ignore, we are aware about the type problem here
              options.color.scale[group]
                ? //@ts-ignore, we are aware about the type problem here
                  `background-color:${options.color.scale[group]}`
                : `background-color:${colors[group]}`
            }`}
            class={`checkmark`}
          ></span>
        </div>
        <!-- If faced checking issue here, where user clicks on one and the other one gets checked, that is because of the id, so temporarily we are removing for attribute from the label field -->

        <!-- svelte-ignore svelte(a11y-label-has-associated-control) -->
        {group}
      </label>
    {/each}
  </div>
</div>

<div
  bind:this={informationModal}
  class={`mouse-move-modal min-w-[120px]  px-2 py-1 bg-fgs1 absolute ${
    mouseHoverData.key || mouseHoverData.value || mouseHoverData.group
      ? "opacity-100"
      : "opacity-0"
  }`}
>
  <div class="flex flex-col">
    <div class="text-bgs1 text-b4 gap-2 flex w-full justify-between py-1">
      <span class="font-bold">x-value</span>
      <div class="">
        {mouseHoverData.key}
      </div>
    </div>
    <div class="text-bgs1 text-b4 gap-2 flex w-full justify-between py-1">
      <span class="font-bold">y-value</span>
      <div class="">
        {roundOffToNdigitsAfterDecimal(Math.abs(mouseHoverData.value), 2)}
      </div>
    </div>
    <div class="text-bgs1 text-b4 gap-2 flex w-full justify-between py-1">
      <span class="font-bold">Group</span>
      <div class="">
        {mouseHoverData.group}
      </div>
    </div>
  </div>
</div>

<!-- 
  Note:
  cc stands for custom-chart

  - Explain the structure of why we created two SVGs over here and why are we creating using a container and creating svg in that, and the reason of creating the other axis inside the scrollable container, explain how margin and padding are getting used and where they are inserted 
    ...reason
  - Reason for fixed axes
    ...write the reason here
 -->

<style>
  /* .cc-bars-container::-webkit-scrollbar {
    display: block !important;
  } */
  .cc-scrollable-container {
    direction: rtl;
  }
  ::-webkit-scrollbar {
    width: unset !important;
  }

  /* for some reason style global is not working, so we had to write this way */
  :global(.cc-bar) {
    cursor: pointer;
  }
  :global(.cc-bar:hover) {
    opacity: 0.7;
    cursor: pointer;
  }

  .checkbox-container {
    display: block;
    position: relative;
    padding-left: 8px;
    margin-bottom: 12px;
    cursor: pointer;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  /* Hide the browser's default checkbox */
  .checkbox-container input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  /* Create a custom checkbox */
  .checkmark {
    position: absolute;
    top: 0;
    left: 0;
    height: 10px;
    width: 10px;
    /* background-color: #eee; */
  }

  /* On mouse-over, add a grey background color */
  .checkbox-container:hover input ~ .checkmark {
    /* background-color: #ccc; */
  }

  /* When the checkbox is checked, add a blue background */
  .checkbox-container input:checked ~ .checkmark {
    /* background-color: #2196f3; */
  }

  /* Create the checkmark/indicator (hidden when not checked) */
  .checkmark:after {
    content: "";
    position: absolute;
    display: none;
  }

  /* Show the checkmark when checked */
  .checkbox-container input:checked ~ .checkmark:after {
    display: block;
  }

  /* Style the checkmark/indicator */
  .checkbox-container .checkmark:after {
    left: 4px;
    top: 1px;
    width: 3px;
    height: 6px;
    border: solid white;
    border-width: 0 1.5px 1.5px 0;
    -webkit-transform: rotate(45deg);
    -ms-transform: rotate(45deg);
    transform: rotate(45deg);
  }
</style>
