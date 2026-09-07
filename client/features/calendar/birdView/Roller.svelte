<script lang="ts">
  import { tooltip } from "@nucleum/actions/popover.action";
  import {
    Itemtype,
    type ProgrammedVerticalWheelEvent,
    type YearPhase
  } from "@nucleum/features/calendar/birdView/Birdview.type";
  import RollerButton from "@nucleum/features/calendar/birdView/RollerButton.svelte";
  import {
    getFirstAlphabetPosition,
    getLastAlphabetPosition,
    waitForTimeout
  } from "@nucleum/features/calendar/birdView/Birdview.utils";
  import { debouncer } from "@21n/utils/utils";
  import { onMount as onLifecycleMount } from "svelte";

  type BirthdateParts = {
    year: number;
    monthIndex: number;
    day: number;
  };

  type RollerConfig = {
    itemHeight: number;
    containerHeight: number;
    itemType: Itemtype;
    birthdate?: Date | string;
    groupByBirthdate?: boolean;
    yearPhases?: YearPhase[];
  };

  type NormalizedYearPhase = YearPhase & {
    lane: number;
  };

  type YearPhaseMarker = YearPhase & {
    startYear: number;
    endYear: number;
    visibleStartYear: number;
    visibleEndYear: number;
    lane: number;
    top: number;
    height: number;
    tooltipText: string;
    accessibleText: string;
  };

  const monthNames: string[] = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  const yearPhaseLaneWidth = 20;
  const yearPhaseMarkerWidth = 14;
  const yearPhaseMarkerInset = 4;
  const yearPhaseMarkerMinHeight = 22;
  const yearPhaseMarkerPadding = 12;

  let {
    config,
    items,
    selectedItem = $bindable(),
    handleWheelEvent,
    container = $bindable(),
    onMount = undefined
  }: {
    config: RollerConfig;
    items: any[];
    selectedItem?: string | number;
    handleWheelEvent: (e: WheelEvent | ProgrammedVerticalWheelEvent) => void;
    container?: HTMLDivElement;
    onMount?: ((scrollToSelectedItem: () => void) => void) | undefined;
  } = $props();

  let containerHeight;

  function getBirthdateParts(): BirthdateParts | undefined {
    const value = config.birthdate;
    if (!value) return undefined;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return {
        year: value.getFullYear(),
        monthIndex: value.getMonth(),
        day: value.getDate()
      };
    }
    if (typeof value == "string") {
      const datePart = value.split("T")[0];
      const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) {
        return {
          year: Number(match[1]),
          monthIndex: Number(match[2]) - 1,
          day: Number(match[3])
        };
      }
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return {
          year: parsed.getFullYear(),
          monthIndex: parsed.getMonth(),
          day: parsed.getDate()
        };
      }
    }
    return undefined;
  }

  function isGroupedByBirthdate() {
    return config.groupByBirthdate === true && birthdateParts !== undefined;
  }

  function isAgeSuffixEnabled() {
    return isGroupedByBirthdate();
  }

  function normalizeModulo(value: number, mod: number) {
    return ((value % mod) + mod) % mod;
  }

  function getAge(year: number) {
    if (!birthdateParts) return undefined;
    return year - birthdateParts.year;
  }

  function getAgeSuffix(year: number) {
    const age = getAge(year);
    if (age === undefined || age < 0) return "";
    return `${age}`;
  }

  function shouldRenderYearDivider(year: number) {
    if (!isGroupedByBirthdate()) return year % 10 == 0;
    return normalizeModulo(year - birthdateParts.year, 10) == 0;
  }

  function shouldRenderMonthDivider(index: number) {
    if (!isGroupedByBirthdate()) return index == 0;
    return index == birthdateParts.monthIndex;
  }

  function resolveYearLabel(year: number) {
    return year;
  }

  function resolveYearDecadeAgePrefix(year: number) {
    if (!isGroupedByBirthdate() || !shouldRenderYearDivider(year))
      return undefined;
    const ageText = getAgeSuffix(year);
    return ageText ? `${ageText}s` : undefined;
  }

  function resolveYearPrefix(year: number) {
    const decadePrefix = resolveYearDecadeAgePrefix(year);
    if (decadePrefix) return decadePrefix;
    if (!isGroupedByBirthdate()) return undefined;
    const y = Number(year);
    const selectedYear = Number(selectedItem);
    const matchesHighlight =
      Number.isFinite(selectedYear) && y === selectedYear;
    if (!matchesHighlight) return undefined;
    const ageText = getAgeSuffix(year);
    return ageText || undefined;
  }

  function resolveMonthLabel(year: number, month: string, index: number) {
    let label = month;
    if (index == 0) label += ` ${String(year).slice(-2)}`;
    return label;
  }

  function isBirthday(prefix: string, item: string) {
    if (!birthdateParts) return false;
    return (
      prefix.slice(-3) == monthNames[birthdateParts.monthIndex] &&
      Number(item) == birthdateParts.day
    );
  }

  function getMonthDiff(
    currSellectedYear: number,
    currSellectedMonth: string,
    prevSellectedYear: number = Number(
      String(selectedItem).slice(
        0,
        getFirstAlphabetPosition(String(selectedItem))
      )
    ),
    prevSellectedMonth: string = String(selectedItem).slice(-3)
  ) {
    let monthDifference: number;
    const currSellectedMonthIndex = monthNames.indexOf(currSellectedMonth);
    const prevSellectedMonthIndex = monthNames.indexOf(prevSellectedMonth);
    monthDifference = (currSellectedYear - prevSellectedYear) * 12;
    monthDifference -= prevSellectedMonthIndex;
    monthDifference += currSellectedMonthIndex;
    return monthDifference;
  }

  function getDayDiff(
    currSelectedItem: string,
    prevSelectedItem: string = String(selectedItem)
  ) {
    const currSelectedItemIndex = items.indexOf(currSelectedItem);
    const prevSelectedItemIndex = items.indexOf(prevSelectedItem);
    return currSelectedItemIndex - prevSelectedItemIndex;
  }

  function getDayLabel(prefix: string, item: string) {
    const n = Number(item);
    if (n == 1) {
      return `${prefix.slice(getFirstAlphabetPosition(prefix))} ${item}`;
    }
    if (Number.isFinite(n) && n >= 2 && n <= 9 && String(item).length == 1) {
      return `0${item}`;
    }
    return item;
  }

  function getDayAdornment(prefix: string, item: string) {
    return isBirthday(prefix, item) ? "🎉" : undefined;
  }

  function resolveBaseWidth() {
    if (!isAgeSuffixEnabled() && config.itemType != Itemtype.MONTH) return 80;
    if (
      (!isAgeSuffixEnabled() && config.itemType == Itemtype.MONTH) ||
      (isAgeSuffixEnabled() && config.itemType == Itemtype.DAY)
    )
      return 96;
    return 112;
  }

  function normalizeYearPhase(phase: YearPhase): YearPhase | undefined {
    if (
      !phase ||
      !Number.isFinite(phase.startYear) ||
      !Number.isFinite(phase.endYear) ||
      !phase.label?.trim()
    ) {
      return undefined;
    }
    return {
      startYear: Math.min(Number(phase.startYear), Number(phase.endYear)),
      endYear: Math.max(Number(phase.startYear), Number(phase.endYear)),
      label: phase.label.trim(),
      description: phase.description?.trim() ?? "",
      emoji: phase.emoji?.trim() || undefined
    };
  }

  function isOverlappingYearPhase(
    phase: Pick<YearPhase, "startYear" | "endYear">,
    activePhases: Pick<YearPhase, "startYear" | "endYear">[]
  ) {
    return activePhases.some(
      (activePhase) =>
        phase.startYear <= activePhase.endYear &&
        activePhase.startYear <= phase.endYear
    );
  }

  function getYearPhaseTooltipText(phase: YearPhase) {
    return phase.description
      ? `**${phase.label}**\n\n${phase.description}`
      : phase.label;
  }

  function getYearPhaseAccessibleText(phase: YearPhase) {
    return phase.description
      ? `${phase.label}: ${phase.description}`
      : phase.label;
  }

  function getNormalizedYearPhases() {
    const validYearPhases = (config.yearPhases ?? [])
      .map((phase) => normalizeYearPhase(phase))
      .filter(Boolean) as YearPhase[];
    if (validYearPhases.length == 0) {
      return [];
    }
    const lanes: NormalizedYearPhase[][] = [];
    const sortedYearPhases = validYearPhases
      .map((phase) => ({
        ...phase,
        lane: 0
      }))
      .sort((phaseA, phaseB) => {
        const phaseASpan = phaseA.endYear - phaseA.startYear;
        const phaseBSpan = phaseB.endYear - phaseB.startYear;
        if (phaseASpan != phaseBSpan) {
          return phaseASpan - phaseBSpan;
        }
        if (phaseA.startYear != phaseB.startYear) {
          return phaseA.startYear - phaseB.startYear;
        }
        return phaseA.endYear - phaseB.endYear;
      });
    for (const phase of sortedYearPhases) {
      let laneIndex = lanes.findIndex(
        (lane) => !isOverlappingYearPhase(phase, lane)
      );
      if (laneIndex == -1) {
        laneIndex = lanes.length;
        lanes.push([]);
      }
      phase.lane = laneIndex;
      lanes[laneIndex].push(phase);
    }
    return sortedYearPhases;
  }

  function getYearPhaseMarkers() {
    if (config.itemType != Itemtype.YEAR || items.length == 0) {
      return [];
    }
    if (normalizedYearPhases.length == 0) {
      return [];
    }
    const numericYears = items
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item));
    if (numericYears.length == 0) {
      return [];
    }
    const firstVisibleYear = Math.min(...numericYears);
    const lastVisibleYear = Math.max(...numericYears);
    return normalizedYearPhases
      .map((phase) => {
        if (
          phase.endYear < firstVisibleYear ||
          phase.startYear > lastVisibleYear
        ) {
          return undefined;
        }
        const visibleStartYear = Math.max(phase.startYear, firstVisibleYear);
        const visibleEndYear = Math.min(phase.endYear, lastVisibleYear);
        const startIndex = items.findIndex(
          (item) => Number(item) == visibleStartYear
        );
        const endIndex = items.findIndex(
          (item) => Number(item) == visibleEndYear
        );
        if (startIndex == -1 || endIndex == -1) {
          return undefined;
        }
        return {
          ...phase,
          visibleStartYear,
          visibleEndYear,
          top: startIndex * config.itemHeight + yearPhaseMarkerInset,
          height: Math.max(
            (endIndex - startIndex + 1) * config.itemHeight -
              yearPhaseMarkerInset * 2,
            yearPhaseMarkerMinHeight
          ),
          tooltipText: getYearPhaseTooltipText(phase),
          accessibleText: getYearPhaseAccessibleText(phase)
        };
      })
      .filter(Boolean) as YearPhaseMarker[];
  }

  async function handlWheelCall(isPositive: boolean, diff: number) {
    for (let i = 0; i < diff; i++)
      await waitForTimeout(() =>
        handleWheelEvent({
          deltaY: isPositive ? 1 : -1,
          isWheelEvent: true
        })
      );
  }

  async function handleClick(
    currSelectedItem: string | number,
    prevSelectedItem: string | number = selectedItem
  ) {
    let isPositive: boolean;
    let diff: number;
    switch (config.itemType) {
      case Itemtype.YEAR:
        isPositive = Number(currSelectedItem) > Number(prevSelectedItem);
        diff = Math.abs(Number(currSelectedItem) - Number(prevSelectedItem));
        await handlWheelCall(isPositive, diff);
        break;
      case Itemtype.MONTH:
        diff = getMonthDiff(
          Number(
            String(currSelectedItem).slice(
              0,
              getFirstAlphabetPosition(String(selectedItem))
            )
          ),
          String(currSelectedItem).slice(-3)
        );
        isPositive = diff > 0;
        diff = Math.abs(diff);
        await handlWheelCall(isPositive, diff);
        break;
      case Itemtype.DAY:
        diff = getDayDiff(String(currSelectedItem));
        isPositive = diff > 0;
        diff = Math.abs(diff);
        await handlWheelCall(isPositive, diff);
        break;
    }
  }

  function scrollToselectedItem() {
    if (container && selectedItem) {
      config.containerHeight = container.offsetHeight;
      const selectedItemElement: HTMLElement | null = container.querySelector(
        `[data-${config.itemType}="${selectedItem}"]`
      );
      if (selectedItemElement) {
        const selectedItemElementHeight = selectedItemElement.offsetHeight;
        const selectedItemElementOffsetTop = selectedItemElement.offsetTop;
        const scrollTop =
          selectedItemElementOffsetTop -
          config.containerHeight / 2 +
          selectedItemElementHeight / 2;
        container.scrollTo({ top: scrollTop, behavior: "smooth" });
      }
    }
  }

  const birthdateParts = $derived(getBirthdateParts());
  const normalizedYearPhases = $derived(getNormalizedYearPhases());
  const yearPhaseMarkers = $derived(getYearPhaseMarkers());
  const yearPhaseLaneCount = $derived(
    normalizedYearPhases.reduce(
      (maxLaneCount, phase) => Math.max(maxLaneCount, phase.lane + 1),
      0
    )
  );
  const yearPhaseMarkerGutterWidth = $derived(
    config.itemType == Itemtype.YEAR && yearPhaseLaneCount > 0
      ? yearPhaseLaneCount * yearPhaseLaneWidth + yearPhaseMarkerPadding
      : 0
  );
  const rollerWidth = $derived(resolveBaseWidth() + yearPhaseMarkerGutterWidth);

  onLifecycleMount(() => {
    onMount?.(scrollToselectedItem);
    const debouncedHandleWheelEvent = debouncer(handleWheelEvent, 200);
    container.addEventListener("wheel", debouncedHandleWheelEvent);
    scrollToselectedItem();
    return () => {
      container?.removeEventListener("wheel", debouncedHandleWheelEvent);
    };
  });
</script>

<div
  class="z-10 overflow-hidden border-r border-brs2"
  style={`width:${rollerWidth}px;min-width:${rollerWidth}px;`}
  bind:this={container}
  bind:clientHeight={containerHeight}
>
  <div class="relative">
    {#if yearPhaseMarkers.length > 0}
      <div
        class="pointer-events-none absolute inset-y-0 left-0 z-20"
        style={`width:${yearPhaseMarkerGutterWidth}px;`}
      >
        {#each yearPhaseMarkers as yearPhase (yearPhase.label + yearPhase.startYear + yearPhase.endYear)}
          <button
            type="button"
            class="pointer-events-auto absolute block rounded-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-aps1"
            style={`top:${yearPhase.top}px;height:${yearPhase.height}px;width:${yearPhaseMarkerWidth}px;right:${yearPhase.lane * yearPhaseLaneWidth + 4}px;`}
            aria-label={yearPhase.accessibleText}
            use:tooltip={{
              text: yearPhase.tooltipText,
              delay: 150,
              isLarger: true,
              isAllowTextWrap: true
            }}
          >
            <span
              class="absolute inset-y-0 left-0 right-0 rounded-l-md border-b border-l border-t border-fgs2/40"
            ></span>
            {#if yearPhase.emoji}
              <span
                class="absolute left-1/2 top-1/2 z-10 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-bgs2 text-[13px] leading-none"
              >
                {yearPhase.emoji}
              </span>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
    <div style={`padding-left:${yearPhaseMarkerGutterWidth}px;`}>
      {#each items as item}
        {#if (config.itemType == Itemtype.YEAR && shouldRenderYearDivider(item)) || (config.itemType == Itemtype.DAY && item.slice(getLastAlphabetPosition(item) + 1) == 1)}
          <div class="h-0 border-t border-brs2 bg-bgs2"></div>
        {/if}
        {#if config.itemType == Itemtype.MONTH}
          {#each monthNames as month, index}
            {#if shouldRenderMonthDivider(index)}
              <div class="h-0 border-t border-brs2 bg-bgs2"></div>
            {/if}
            <RollerButton
              {config}
              item={month}
              label={resolveMonthLabel(item, month, index)}
              context={item}
              bind:selectedItem
              {handleClick}
            />
          {/each}
        {:else}
          <RollerButton
            {config}
            context={config.itemType == Itemtype.YEAR
              ? ""
              : item.slice(0, getLastAlphabetPosition(item) + 1)}
            label={config.itemType == Itemtype.DAY
              ? getDayLabel(
                  item.slice(0, getLastAlphabetPosition(item) + 1),
                  item.slice(getLastAlphabetPosition(item) + 1)
                )
              : config.itemType == Itemtype.YEAR
                ? resolveYearLabel(item)
                : undefined}
            prefix={config.itemType == Itemtype.YEAR
              ? resolveYearPrefix(item)
              : undefined}
            adornment={config.itemType == Itemtype.DAY
              ? getDayAdornment(
                  item.slice(0, getLastAlphabetPosition(item) + 1),
                  item.slice(getLastAlphabetPosition(item) + 1)
                )
              : undefined}
            item={config.itemType == Itemtype.YEAR
              ? item
              : item.slice(getLastAlphabetPosition(item) + 1)}
            bind:selectedItem
            {handleClick}
          />
        {/if}
      {/each}
    </div>
  </div>
</div>
