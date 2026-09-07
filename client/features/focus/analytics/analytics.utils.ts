import {
  TimePeriodType,
  TimeScale,
  type TimePeriod
} from "@21n/types/time.type";
import { deepCopy } from "@21n/shared-utils/obj.utils";
import {
  determinePreviousTimePeriod,
  determineTimePeriod,
  determineTimePeriodv2
} from "@21n/utils/time.utils";
import { get } from "svelte/store";
import {
  analyticsConfigStore,
  selectedPageId
} from "@nucleum/features/focus/analytics/analytics.store";
import {
  AnalyticsCardGrouping,
  AnalyticsCardType,
  type AnalyticsPage,
  type IAnalyticsCard
} from "@nucleum/features/focus/analytics/analytics.types";
import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";

export function onAddPageClicked() {
  analyticsConfigStore.addPage();
}
export function onRemovePageClicked(e: CustomEvent<string>) {
  const id = e.detail;
  if (id == get(selectedPageId)) {
    const pages = get(analyticsConfigStore).pages;
    const index = pages.findIndex((page) => page.id !== id);
    if (index !== -1) {
      selectedPageId.set(
        get(analyticsConfigStore).pages.find(
          (page) => page.id === pages[index]?.id
        )?.id as string
      );
    } else selectedPageId.set(undefined);
  }
  analyticsConfigStore.removePage(e.detail);
}

export function onPagelabelChange(
  e: CustomEvent<{ value: string; label: string }>
) {
  if (!e.detail.label || !e.detail.value) return;
  analyticsConfigStore.editPageLabel(e.detail.value, e.detail.label);
}

/**
 * @deprecated - Use generateParamsForCards instead
 * @param timePeriods
 * @returns
 */
export function generateParamsForCharts(timePeriods: TimePeriod[]) {
  let params: any[] = [];
  timePeriods.forEach((period) => {
    let dates = determineTimePeriod(period);
    params.push({
      begin: dates.begin.toISOString(),
      end: dates.end.toISOString(),
      scale: period.scale
    });
  });
  return params;
}

export function generateParamsForCards(cards: IAnalyticsCard[]) {
  let params: any[] = [];
  cards.forEach((card) => {
    let dates = determineTimePeriodv2(card.period);
    let previous =
      card.type === AnalyticsCardType.TOP_N ||
      card.type === AnalyticsCardType.METRICS
        ? determinePreviousTimePeriod(card.period)
        : undefined;
    params.push({
      begin: dates.begin.toISOString(),
      end: dates.end.toISOString(),
      scale: card.period.scale,
      previous
    });
  });
  return params;
}

export function onPageRearrange(e: CustomEvent) {
  const ids = e.detail;
  if (!Array.isArray(ids)) return;
  analyticsConfigStore.rearrangePages(ids);
}

export function generateAnalyticsSeedPages() {
  const page1 = {
    id: generateSimpleRandomId(),
    label: "All",
    cards: [
      {
        id: generateSimpleRandomId(),
        grouping: AnalyticsCardGrouping.DEFAULT,
        filter: [],
        type: AnalyticsCardType.DONUT,
        period: {
          scale: TimeScale.DAYS,
          value: {
            type: TimePeriodType.RELATIVE,
            param: 0
          }
        }
      },
      {
        id: generateSimpleRandomId(),
        grouping: AnalyticsCardGrouping.TOP_LEVEL_OBJECTIVES,
        isGroupByTopLevelObjectives: true,
        filter: [],
        type: AnalyticsCardType.TOP_N,
        period: {
          scale: TimeScale.DAYS,
          value: {
            type: TimePeriodType.RELATIVE,
            param: -7
          }
        }
      },
      // {
      //   id: generateSimpleRandomId(),
      //   grouping: AnalyticsCardGrouping.TOP_LEVEL_OBJECTIVES,
      //   filter: [],
      //   type: AnalyticsCardType.TARGETS,
      //   period: {
      //     scale: TimeScale.DAYS,
      //     value: {
      //       type: TimePeriodType.RELATIVE,
      //       param: -7
      //     }
      //   }
      // },
      {
        id: generateSimpleRandomId(),
        grouping: AnalyticsCardGrouping.DEFAULT,
        filter: [],
        type: AnalyticsCardType.BAR,
        period: {
          scale: TimeScale.DAYS,
          value: {
            type: TimePeriodType.RELATIVE,
            param: -14
          }
        }
      },
      {
        id: generateSimpleRandomId(),
        grouping: AnalyticsCardGrouping.DEFAULT,
        filter: [],
        type: AnalyticsCardType.CALENDAR,
        period: {
          scale: TimeScale.YEARS,
          value: {
            type: TimePeriodType.RELATIVE,
            param: 0
          }
        }
      }
    ]
  };
  const page2 = {
    id: generateSimpleRandomId(),
    label: "Days",
    cards: [
      {
        id: generateSimpleRandomId(),
        grouping: AnalyticsCardGrouping.DEFAULT,
        filter: [],
        type: AnalyticsCardType.METRICS,
        period: {
          scale: TimeScale.DAYS,
          value: {
            type: TimePeriodType.RELATIVE,
            param: 0
          }
        }
      },
      {
        id: generateSimpleRandomId(),
        grouping: AnalyticsCardGrouping.DEFAULT,
        filter: [],
        type: AnalyticsCardType.DONUT,
        period: {
          scale: TimeScale.DAYS,
          value: {
            type: TimePeriodType.RELATIVE,
            param: 0
          }
        }
      },
      {
        id: generateSimpleRandomId(),
        grouping: AnalyticsCardGrouping.DEFAULT,
        filter: [],
        type: AnalyticsCardType.DONUT,
        period: {
          scale: TimeScale.DAYS,
          value: {
            type: TimePeriodType.RELATIVE,
            param: -1
          }
        }
      },
      {
        id: generateSimpleRandomId(),
        grouping: AnalyticsCardGrouping.DEFAULT,
        filter: [],
        type: AnalyticsCardType.DONUT,
        period: {
          scale: TimeScale.DAYS,
          value: {
            type: TimePeriodType.RELATIVE,
            param: -30
          }
        }
      },
      {
        id: generateSimpleRandomId(),
        grouping: AnalyticsCardGrouping.DEFAULT,
        filter: [],
        type: AnalyticsCardType.BAR,
        period: {
          scale: TimeScale.DAYS,
          value: {
            type: TimePeriodType.RELATIVE,
            param: -14
          }
        }
      },
      {
        id: generateSimpleRandomId(),
        grouping: AnalyticsCardGrouping.DEFAULT,
        filter: [],
        type: AnalyticsCardType.HOURLY,
        period: {
          scale: TimeScale.DAYS,
          value: {
            type: TimePeriodType.RELATIVE,
            param: -7
          }
        }
      }
    ]
  };
  const page3 = {
    id: generateSimpleRandomId(),
    label: "Months",
    cards: [
      {
        id: generateSimpleRandomId(),
        grouping: AnalyticsCardGrouping.DEFAULT,
        filter: [],
        type: AnalyticsCardType.METRICS,
        period: {
          scale: TimeScale.MONTHS,
          value: {
            type: TimePeriodType.RELATIVE,
            param: 0
          }
        }
      },
      {
        id: generateSimpleRandomId(),
        grouping: AnalyticsCardGrouping.DEFAULT,
        filter: [],
        type: AnalyticsCardType.DONUT,
        period: {
          scale: TimeScale.MONTHS,
          value: {
            type: TimePeriodType.RELATIVE,
            param: 0
          }
        }
      },
      {
        id: generateSimpleRandomId(),
        grouping: AnalyticsCardGrouping.DEFAULT,
        filter: [],
        type: AnalyticsCardType.DONUT,
        period: {
          scale: TimeScale.MONTHS,
          value: {
            type: TimePeriodType.RELATIVE,
            param: -1
          }
        }
      },
      {
        id: generateSimpleRandomId(),
        grouping: AnalyticsCardGrouping.DEFAULT,
        filter: [],
        type: AnalyticsCardType.DONUT,
        period: {
          scale: TimeScale.MONTHS,
          value: {
            type: TimePeriodType.RELATIVE,
            param: -3
          }
        }
      },
      {
        id: generateSimpleRandomId(),
        grouping: AnalyticsCardGrouping.DEFAULT,
        filter: [],
        type: AnalyticsCardType.BAR,
        period: {
          scale: TimeScale.MONTHS,
          value: {
            type: TimePeriodType.RELATIVE,
            param: -12
          }
        }
      }
    ]
  };
  const page4 = {
    id: generateSimpleRandomId(),
    label: "Years",
    cards: [
      {
        id: generateSimpleRandomId(),
        grouping: AnalyticsCardGrouping.DEFAULT,
        filter: [],
        type: AnalyticsCardType.METRICS,
        period: {
          scale: TimeScale.YEARS,
          value: {
            type: TimePeriodType.RELATIVE,
            param: 0
          }
        }
      },
      {
        id: generateSimpleRandomId(),
        grouping: AnalyticsCardGrouping.DEFAULT,
        filter: [],
        type: AnalyticsCardType.DONUT,
        period: {
          scale: TimeScale.YEARS,
          value: {
            type: TimePeriodType.RELATIVE,
            param: 0
          }
        }
      },
      {
        id: generateSimpleRandomId(),
        grouping: AnalyticsCardGrouping.DEFAULT,
        filter: [],
        type: AnalyticsCardType.DONUT,
        period: {
          scale: TimeScale.YEARS,
          value: {
            type: TimePeriodType.RELATIVE,
            param: -1
          }
        }
      },
      {
        id: generateSimpleRandomId(),
        grouping: AnalyticsCardGrouping.DEFAULT,
        filter: [],
        type: AnalyticsCardType.BAR,
        period: {
          scale: TimeScale.YEARS,
          value: {
            type: TimePeriodType.RELATIVE,
            param: -3
          }
        }
      }
    ]
  };
  return deepCopy([page1, page2, page3, page4]);
}

export function generateAnalyticsSeedPage(): AnalyticsPage {
  return {
    id: generateSimpleRandomId(),
    label: "New view",
    cards: [
      {
        id: generateSimpleRandomId(),
        type: AnalyticsCardType.DONUT,
        period: {
          scale: TimeScale.DAYS,
          value: {
            type: TimePeriodType.RELATIVE,
            param: 0
          }
        }
      },
      {
        id: generateSimpleRandomId(),
        type: AnalyticsCardType.TOP_N,
        period: {
          scale: TimeScale.DAYS,
          value: {
            type: TimePeriodType.RELATIVE,
            param: -7
          }
        }
      },
      {
        id: generateSimpleRandomId(),
        type: AnalyticsCardType.BAR,
        period: {
          scale: TimeScale.DAYS,
          value: {
            type: TimePeriodType.RELATIVE,
            param: -14
          }
        }
      },
      {
        id: generateSimpleRandomId(),
        type: AnalyticsCardType.CALENDAR,
        period: {
          scale: TimeScale.YEARS,
          value: {
            type: TimePeriodType.RELATIVE,
            param: 0
          }
        }
      }
    ]
  };
}
