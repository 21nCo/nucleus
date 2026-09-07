import type { IRecordId } from "@21n/types/data.type";
import {
  ResourceAccessPoint,
  type IMultiSelectContext
} from "@nucleum/datafn/resource.type";
import {
  isSameResource,
  resourceInList
} from "@nucleum/datafn/resource.utils";
import { stringify } from "@21n/shared-utils/json.utils";
import { writable, derived, get } from "svelte/store";

type ActionHandler = (
  ids: IRecordId[],
  action: string,
  data?: unknown
) => void | Promise<void>;

type SelectAllHandler = () => IRecordId[];

interface IBulkEditState {
  selectedIds: IRecordId[];
  context: IMultiSelectContext | null;
  actionHandler: ActionHandler | null;
  selectAllHandler: SelectAllHandler | null;
  subContext: string | undefined;
}

const initialState: IBulkEditState = {
  selectedIds: [],
  context: null,
  actionHandler: null,
  selectAllHandler: null,
  subContext: undefined
};

const state = writable<IBulkEditState>(initialState);

const selectableAccessPoints = new Set<ResourceAccessPoint>([
  ResourceAccessPoint.BROWSER,
  ResourceAccessPoint.LIBRARY,
  ResourceAccessPoint.COLLECTION,
  ResourceAccessPoint.OBJECTIVE,
  ResourceAccessPoint.CALENDAR,
  ResourceAccessPoint.NODE_LINKS,
  ResourceAccessPoint.NODE_TRACES
]);

function isSameContext(
  currentContext: IMultiSelectContext | null,
  newContext: IMultiSelectContext
) {
  if (!currentContext) return false;
  return (
    stringify(currentContext, { isPreventReplacer: true }) ===
    stringify(newContext, { isPreventReplacer: true })
  );
}

function resolveVisibleSelectionIds(
  context: IMultiSelectContext | null
): IRecordId[] {
  if (!context || !selectableAccessPoints.has(context.accessPoint)) return [];
  if (typeof document === "undefined") return [];
  const ids = Array.from(
    document.querySelectorAll<HTMLElement>(
      `div[id^='thumbnail-${context.resource}:'][data-id]`
    )
  )
    .filter((element) => element.getClientRects().length > 0)
    .map((element) => element.dataset.id)
    .filter((id): id is IRecordId => !!id);
  return Array.from(new Set(ids));
}

export const bulkEditStore = {
  subscribe: derived(state, ($state) => $state.selectedIds).subscribe,

  count: derived(state, ($state) => $state.selectedIds.length),

  context: derived(state, ($state) => $state.context),

  subContext: derived(state, ($state) => $state.subContext),

  getState: () => get(state),

  activate(
    context: IMultiSelectContext,
    handlers?: {
      onAction?: ActionHandler;
      onSelectAll?: SelectAllHandler;
      subContext?: string;
    }
  ) {
    const currentState = get(state);
    const nextActionHandler = handlers?.onAction ?? null;
    const nextSelectAllHandler = handlers?.onSelectAll ?? null;
    const nextSubContext = handlers?.subContext;
    if (!isSameContext(currentState.context, context)) {
      state.set({
        selectedIds: [],
        context,
        actionHandler: nextActionHandler,
        selectAllHandler: nextSelectAllHandler,
        subContext: nextSubContext
      });
    } else {
      if (
        currentState.actionHandler === nextActionHandler &&
        currentState.selectAllHandler === nextSelectAllHandler &&
        currentState.subContext === nextSubContext
      ) {
        return;
      }
      state.update(($state) => ({
        ...$state,
        actionHandler: nextActionHandler,
        selectAllHandler: nextSelectAllHandler,
        subContext: nextSubContext
      }));
    }
  },

  reset() {
    state.update(($state) => ({ ...$state, selectedIds: [] }));
  },

  clear() {
    state.set(initialState);
  },

  select(ids: IRecordId[]) {
    state.update(($state) => ({
      ...$state,
      selectedIds: Array.isArray(ids) ? [...ids] : []
    }));
  },

  toggle(id: IRecordId) {
    state.update(($state) => {
      const isSelected = $state.selectedIds.some(resourceInList(id));
      return {
        ...$state,
        selectedIds: isSelected
          ? $state.selectedIds.filter((x) => !isSameResource(x, id))
          : [...$state.selectedIds, id]
      };
    });
  },

  async onAction(action: string, data?: unknown) {
    const currentState = get(state);
    if (currentState.actionHandler) {
      await currentState.actionHandler(currentState.selectedIds, action, data);
    }
  },

  onSelectAll() {
    const currentState = get(state);
    const visibleSelectionIds = resolveVisibleSelectionIds(
      currentState.context
    );
    if (currentState.selectAllHandler) {
      const ids = currentState.selectAllHandler();
      if (Array.isArray(ids)) {
        this.select(Array.from(new Set(ids)));
        return;
      }
    }
    if (visibleSelectionIds.length > 0) {
      this.select(visibleSelectionIds);
    }
  },

  clickHandler(id: IRecordId): boolean {
    const currentState = get(state);
    if (currentState.selectedIds.length > 0) {
      this.toggle(id);
      return true;
    }
    return false;
  },

  isActive(context: IMultiSelectContext): boolean {
    const currentState = get(state);
    return isSameContext(currentState.context, context);
  },

  matchesContext(context: IMultiSelectContext): boolean {
    return this.isActive(context);
  }
};

export type BulkEditStore = typeof bulkEditStore;
