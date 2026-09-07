import { get, writable } from "svelte/store";
import { Resource } from "@nucleum/datafn/resource.enum";
import {
  AccessMode,
  ResourceAccessPoint
} from "@nucleum/datafn/resource.type";
import type { IRecordId } from "@21n/types/data.type";
import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";
import { appStore } from "@nucleum/stores/app.store";
import { logger } from "@nucleum/components/debug/logger.client";
import {
  CombinationNavItemType,
  type IActiveCombination,
  type ICombinationNavItem,
  type ISideNavCombination
} from "@nucleum/components/combination/combination.type";
import {
  cloneNavItems,
  indentItem,
  insertItem,
  moveItem,
  moveItemToParent,
  moveItemToPosition,
  outdentItem,
  removeItemById,
  updateItemLabel
} from "./combination.utils";
import { determineResourceType } from "@nucleum/datafn/resource.utils";
import { datafn } from "@nucleum/datafn/datafn.store";

const activeCombinationStores = new Map<string, ActiveCombinationStore>();

export class ActiveCombinationStore {
  id: IRecordId;
  protected subject = writable<IActiveCombination>();
  subscribe = this.subject.subscribe;
  set = this.subject.set;
  update = this.subject.update;

  constructor(combinationId: IRecordId) {
    this.id = combinationId;
  }

  static resolve(id: IRecordId) {
    const idString = id.toString();
    if (!activeCombinationStores.has(idString)) {
      activeCombinationStores.set(idString, new ActiveCombinationStore(id));
    }
    return activeCombinationStores.get(idString)!;
  }

  toggleEditMode(val: boolean) {
    return this.update((prev) => ({ ...prev, isInEditMode: val }));
  }

  private readItems() {
    const combination = get(this) as IActiveCombination | undefined;
    return combination?.items ?? [];
  }

  private async persistItems(items: ICombinationNavItem[]) {
    this.update((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items
      };
    });
    await datafn.space.mutate({
      operation: "merge",
      id: this.id.toString(),
      record: { items },
      context: ResourceAccessPoint.COMBINATION
    });
  }

  private async resolveResourceSnapshot(resourceId: IRecordId) {
    try {
      const resourceType = determineResourceType(resourceId);
      const result = await datafn.table(resourceType).query({
        filters: { id: resourceId.toString() },
        select: ["id", "label", "name", "avatar"],
        metadata: {
          includeTrashed: true,
          includeArchived: true
        }
      } as any);
      const record = result.data?.[0] as Record<string, any> | undefined;
      if (!record) return undefined;
      return {
        label: record.label ?? record.name ?? "Untitled",
        avatar: record.avatar
      };
    } catch (error) {
      logger.error({
        at: "ActiveCombinationStore.resolveResourceSnapshot",
        error,
        resourceId
      });
    }
  }

  async init(accessMode: AccessMode) {
    this.update((prev) => ({
      ...(prev ?? {}),
      isPageLoading: true,
      accessMode
    }));
    const result = (await datafn.space.select(this.id.toString(), {
      metadata: {
        includeTrashed: true,
        includeArchived: true
      }
    })) as ISideNavCombination | undefined;
    if (!result) return;
    const record: IActiveCombination = {
      ...result,
      accessMode,
      isPageLoading: false,
      items: cloneNavItems(result.items ?? [])
    };
    this.set(record);
    appStore.addToRecents({
      record: result,
      type: Resource.space,
      timestamp: new Date()
    });
  }

  async updateLabel(label: string) {
    this.update((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        label
      };
    });
    await datafn.space.mutate({
      operation: "merge",
      id: this.id.toString(),
      record: { label },
      context: ResourceAccessPoint.COMBINATION
    });
  }

  async addSection(params: {
    label: string;
    parentId?: string;
    index?: number;
  }) {
    const section: ICombinationNavItem = {
      id: generateSimpleRandomId(),
      type: CombinationNavItemType.SECTION,
      label: params.label,
      children: []
    };
    const updated = insertItem(this.readItems(), section, {
      parentId: params.parentId,
      index: params.index
    });
    await this.persistItems(updated);
    return section.id;
  }

  async addResource(params: {
    resourceId: IRecordId;
    parentId?: string;
    index?: number;
    label?: string;
  }) {
    const snapshot = await this.resolveResourceSnapshot(params.resourceId);
    const label = params.label ?? snapshot?.label ?? "Untitled";
    const resourceItem: ICombinationNavItem = {
      id: generateSimpleRandomId(),
      type: CombinationNavItemType.RESOURCE,
      label,
      resourceId: params.resourceId,
      resourceType: determineResourceType(params.resourceId),
      resourceLabel: snapshot?.label ?? label,
      resourceAvatar: snapshot?.avatar,
      avatar: snapshot?.avatar,
      children: []
    };
    const updated = insertItem(this.readItems(), resourceItem, {
      parentId: params.parentId,
      index: params.index
    });
    await this.persistItems(updated);
    return resourceItem.id;
  }

  async updateNavItemLabel(itemId: string, label: string) {
    const updated = updateItemLabel(this.readItems(), itemId, label);
    await this.persistItems(updated);
  }

  async deleteNavItem(itemId: string) {
    const updated = removeItemById(this.readItems(), itemId);
    await this.persistItems(updated);
  }

  async moveNavItem(itemId: string, direction: "up" | "down") {
    const offset = direction === "up" ? -1 : 1;
    const updated = moveItem(this.readItems(), itemId, offset);
    await this.persistItems(updated);
  }

  async indentNavItem(itemId: string) {
    const updated = indentItem(this.readItems(), itemId);
    await this.persistItems(updated);
  }

  async outdentNavItem(itemId: string) {
    const updated = outdentItem(this.readItems(), itemId);
    await this.persistItems(updated);
  }

  async moveNavItemRelative(params: {
    itemId: string;
    targetId: string;
    position: "before" | "after" | "inside";
  }) {
    const updated = moveItemToPosition(
      this.readItems(),
      params.itemId,
      params.targetId,
      params.position
    );
    await this.persistItems(updated);
  }

  async moveNavItemToParent(params: {
    itemId: string;
    parentId?: string;
    index?: number;
  }) {
    const updated = moveItemToParent(
      this.readItems(),
      params.itemId,
      params.parentId,
      params.index
    );
    await this.persistItems(updated);
  }
}
