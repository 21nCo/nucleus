import { get, writable } from "svelte/store";
import {
  AnalyticsCardGrouping,
  type IAnalyticsConfigStore,
  type AnalyticsPageStore,
  type AnalyticsPage,
  type IAnalyticsCard,
  AnalyticsCardType
} from "@nucleum/features/focus/analytics/analytics.types";
import { TimePeriodType, TimeScale } from "@21n/utils/time.type";
import { Resource } from "@nucleum/datafn/resource.enum";
import {
  generateAnalyticsSeedPage,
  generateAnalyticsSeedPages,
  generateParamsForCards
} from "@nucleum/features/focus/analytics/analytics.utils";
import { normalizeAnalyticsConfig } from "@nucleum/features/focus/analytics/analytics.normalize";
import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";
import { datafn } from "@nucleum/datafn/datafn.store";
import type { IRecordId } from "@nucleum/schema/legacy/data.type";
import { isSameResource } from "@nucleum/datafn/resource.utils";
import { toasts } from "@nucleum/stores/notification.store";
import { time } from "@datafn/client";

type IFocusLogAggregate = {
  objectiveId?: IRecordId;
  focus: number;
};

const analyticsConfigStoreId = Resource.pointAnalyticsConfig;

const seedAnalyticsConfig: IAnalyticsConfigStore = {
  pages: generateAnalyticsSeedPages()
};

export const selectedPageId = writable<string | undefined>(
  seedAnalyticsConfig.pages[0]?.id
);

const analyticsConfigSignal = datafn.kv.signal<IAnalyticsConfigStore>(
  Resource.pointAnalyticsConfig,
  { defaultValue: { ...seedAnalyticsConfig } }
);
const analyticsConfigLocal = writable<IAnalyticsConfigStore>(
  resolveAnalyticsConfig(seedAnalyticsConfig)
);

function resolveAnalyticsConfig(data?: IAnalyticsConfigStore) {
  const normalized = normalizeAnalyticsConfig(
    data ?? seedAnalyticsConfig,
    generateAnalyticsSeedPages()
  );
  return normalized.pages.length === 0
    ? { ...seedAnalyticsConfig }
    : { ...normalized, id: analyticsConfigStoreId };
}

analyticsConfigSignal.subscribe((value) => {
  analyticsConfigLocal.set(resolveAnalyticsConfig(value));
});

export const analyticsConfigStore = {
  subscribe: analyticsConfigLocal.subscribe,
  get() {
    return get(analyticsConfigLocal);
  },
  reset() {
    const val = {
      ...seedAnalyticsConfig,
      pages: [generateAnalyticsSeedPage()]
    };
    analyticsConfigLocal.set(resolveAnalyticsConfig(val));
    return datafn.kv.set(Resource.pointAnalyticsConfig, val);
  },

  loader(data: IAnalyticsConfigStore) {
    analyticsConfigLocal.set(resolveAnalyticsConfig(data));
    return datafn.kv.set(
      Resource.pointAnalyticsConfig,
      resolveAnalyticsConfig(data)
    );
  },

  updateCardConfig(pageId: string, config: IAnalyticsCard) {
    let state = this.get();
    const page = (state.pages ?? []).find((p) => p.id === pageId);
    if (!page) return;
    const chart = (page.cards ?? []).find((c) => c.id === config.id);
    if (!chart) return;
    Object.assign(chart, config);
    this.modify(state);
  },

  removeCard(pageId: string, chartId: string) {
    let state = this.get();
    const page = (state.pages ?? []).find((p) => p.id === pageId);
    if (!page) return;
    const index = (page.cards ?? []).findIndex((c) => c.id === chartId);
    if (index > -1) {
      page.cards.splice(index, 1);
    }
    this.modify(state);
  },

  addCard(pageId: string) {
    let state = this.get();
    const page = (state.pages ?? []).find((p) => p.id === pageId);
    if (!page) return;
    page.cards = page.cards ?? [];
    if (page.cards.length >= 10) {
      toasts.error("You can only have up to 10 cards on a page");
      return;
    }
    page.cards.push({
      id: generateSimpleRandomId(),
      type: AnalyticsCardType.PIE,
      period: {
        scale: TimeScale.DAYS,
        value: {
          type: TimePeriodType.RELATIVE,
          param: 0
        }
      }
    });
    this.modify(state);
  },

  addPage() {
    let state = this.get();
    const newPage = generateAnalyticsSeedPage();
    state.pages = state.pages ?? [];
    state.pages.push({ ...newPage, id: generateSimpleRandomId() });
    this.modify(state);
  },

  editPageLabel(id: string, label: string) {
    const state = this.get();
    const pages = (state.pages ?? []).map((page) =>
      page.id === id ? { ...page, label } : page
    );
    this.modify({
      ...state,
      pages
    });
  },

  removePage(id: string) {
    let state = this.get();
    const index = (state.pages ?? []).findIndex((p) => p.id === id);
    if (index > -1) {
      state.pages.splice(index, 1);
    }
    this.modify(state);
  },

  rearrangePages(ids: string[]) {
    let state = this.get();
    state.pages = state.pages ?? [];
    state.pages = ids
      .map((id) => state.pages.find((p) => p.id === id))
      .filter((page): page is AnalyticsPage => Boolean(page));
    this.modify(state);
  },

  modify(n: Partial<IAnalyticsConfigStore>) {
    analyticsConfigLocal.update((current) =>
      resolveAnalyticsConfig({ ...current, ...n })
    );
    return datafn.kv.merge(Resource.pointAnalyticsConfig, n);
  },

  destroy() {
    analyticsConfigSignal.dispose();
  }
};

class FocusAggregates {
  /**
   *
   * @param params
   * @returns
   */
  async aggregateFocusForCurrentDay(params: {
    objectiveIds?: IRecordId[];
    objectiveId?: IRecordId;
  }) {
    const logsResult = await datafn.sessionLog.query({
      filters: {
        objectiveId: params.objectiveIds
          ? { $in: params.objectiveIds }
          : params.objectiveId?.toString()
      },
      temporal: time.day("startUnix", new Date())
    });
    const logs = logsResult.data ?? [];
    if (!logs) return 0;
    const focusLogs = logs as IFocusLogAggregate[];
    if (params.objectiveIds) {
      let data: {
        id: IRecordId;
        focus: number;
      }[] = [];
      params.objectiveIds.forEach((objectiveId) => {
        const objectiveLogs = focusLogs.filter((log: IFocusLogAggregate) =>
          log.objectiveId ? isSameResource(log.objectiveId, objectiveId) : false
        );
        const focus = objectiveLogs.reduce(
          (acc: number, log: IFocusLogAggregate) => acc + log.focus,
          0
        );
        data.push({
          id: objectiveId,
          focus
        });
      });
      return data;
    } else {
      return focusLogs.reduce(
        (acc: number, log: IFocusLogAggregate) => acc + log.focus,
        0
      );
    }
  }
}

export const focusAggregates = new FocusAggregates();
