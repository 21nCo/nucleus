import { appStore } from "@nucleum/stores/app.store";
import {
  copyActiveResourceContents,
  updateActiveResource
} from "@nucleum/components/record/active-resource.store";
import { bulkEditStore } from "@nucleum/components/record/bulkedit.store";
import { copyResourceLinkToClipboard } from "@nucleum/components/record/resource-link.utils";
import { LinkType } from "@nucleum/features/memory/linking/link.type";
import {
  ResourceAccessPoint,
  AccessMode,
  ResourceActionType,
  type IActiveResource,
  type IResource,
  type IResourceArchivable,
  type IResourceLockable,
  type IResourceStarrable
} from "@nucleum/datafn/resource.type";
import { uiState } from "@nucleum/stores/uiState/uiState.store";
import {
  determineResourceAccessMode,
  determineResourceType,
  isSameResource,
  isTrashedResource,
  resolveBulkSelectionAccessPointId,
  resolveResourceActionIcon,
  resourceInList
} from "@nucleum/datafn/resource.utils";
import { ContextMenuType, type IContextMenuItem } from "@21n/types/select.type";
import type { IRecordId } from "@21n/types/data.type";
import { tabs } from "@21n/layout/topNav/tabs/tabs.store";
import { Resource } from "@nucleum/datafn/resource.enum";
import { toasts } from "@nucleum/stores/notification.store";
import { Action } from "@21n/types/action.enum";
import { AppSearchParam } from "@21n/types/appStore.type";
import { UIStateScope } from "@nucleum/stores/uiState/uiState.type";
import { BulkEditor } from "@nucleum/components/record/record.store";
import { GlobalEvent } from "@21n/types/event.enum";
import { datafn } from "@nucleum/datafn/datafn.store";

type IActionableResource = IResource &
  Partial<
    Pick<IActiveResource, "isInEditMode" | "isInReadOnlyMode" | "isInFocusMode">
  > &
  Partial<IResourceArchivable & IResourceLockable & IResourceStarrable> & {
    collections?: IRecordId[];
    url?: string;
  };

type ResourceLifecycleHooks = {
  onArchive?: (ids: IRecordId[]) => Promise<unknown> | unknown;
  onUnarchive?: (ids: IRecordId[]) => Promise<unknown> | unknown;
  onTrash?: (ids: IRecordId[]) => Promise<unknown> | unknown;
  onRestore?: (ids: IRecordId[]) => Promise<unknown> | unknown;
};

export class ResourceActions<T extends IActionableResource> {
  accessPoint?: ResourceAccessPoint;
  accessMode?: AccessMode;
  private lifecycle?: ResourceLifecycleHooks;
  constructor(
    private resource: T,
    params?: {
      accessPoint?: ResourceAccessPoint;
      accessMode?: AccessMode;
      lifecycle?: ResourceLifecycleHooks;
    }
  ) {
    this.resource = resource;
    this.accessPoint = params?.accessPoint;
    this.accessMode = params?.accessMode;
    this.lifecycle = params?.lifecycle;
  }

  private resourceType() {
    return determineResourceType(this.resource.id);
  }

  private mutate(
    mutation: Parameters<ReturnType<typeof datafn.table>["mutate"]>[0]
  ) {
    return datafn.table(this.resourceType()).mutate(mutation);
  }

  private merge(record: Partial<T>) {
    return this.mutate({
      operation: "merge",
      id: this.resource.id.toString(),
      record: {
        id: this.resource.id.toString(),
        ...record
      },
      context: this.accessPoint
    });
  }
  copyLink(): IContextMenuItem {
    return {
      label: "Copy link",
      value: ResourceActionType.COPY_LINK,
      icon: resolveResourceActionIcon(ResourceActionType.COPY_LINK),
      callback: async () => {
        copyResourceLinkToClipboard(this.resource.id);
        toasts.success("Link copied to clipboard");
      }
    };
  }
  copyExternalLink(): IContextMenuItem {
    return {
      label: "Copy source link",
      value: "copyExternalLink",
      icon: "copy",
      callback: async () => {
        const url = (this.resource as any)?.url;
        if (url) {
          await navigator.clipboard.writeText(url);
          toasts.success("External link copied to clipboard");
        }
      }
    };
  }
  copyContents(): IContextMenuItem {
    return {
      label: "Copy contents",
      value: ResourceActionType.COPY_CONTENTS,
      icon: resolveResourceActionIcon(ResourceActionType.COPY_CONTENTS),
      callback: async () => {
        copyActiveResourceContents(this.resource.id);
        toasts.success("Contents copied to clipboard");
      }
    };
  }
  star(): IContextMenuItem {
    return {
      label: this.resource.isStarred ? "Unstar" : "Star this resource",
      value: "star",
      icon: resolveResourceActionIcon(ResourceActionType.STAR),
      callback: async () => {
        const isStarred = !this.resource.isStarred;
        await this.merge({
          isStarred
        } as Partial<T>);
        updateActiveResource(this.resource.id, { isStarred });
      }
    };
  }
  starAsToggle(): IContextMenuItem {
    return {
      value: "star",
      label: "Star",
      activeLabel: "Starred",
      icon: resolveResourceActionIcon(ResourceActionType.STAR),
      type: ContextMenuType.SWITCH,
      initialValue: this.resource.isStarred,
      callback: async (checked: boolean) => {
        await this.merge({ isStarred: checked } as Partial<T>);
        updateActiveResource(this.resource.id, { isStarred: checked });
      }
    };
  }
  archive(): IContextMenuItem {
    return {
      value: this.resource.isArchived ? "unarchive" : "archive",
      icon: resolveResourceActionIcon(
        this.resource.isArchived
          ? ResourceActionType.UNARCHIVE
          : ResourceActionType.ARCHIVE
      ),
      callback: async () => {
        if (this.resource.isArchived) {
          await this.mutate({
            operation: "unarchive",
            id: this.resource.id.toString(),
            context: this.accessPoint
          });
          await this.lifecycle?.onUnarchive?.([this.resource.id]);
        } else {
          await this.mutate({
            operation: "archive",
            id: this.resource.id.toString(),
            context: this.accessPoint
          });
          await this.lifecycle?.onArchive?.([this.resource.id]);
        }
      }
    };
  }
  trash(): IContextMenuItem {
    const isTrashed = isTrashedResource(this.resource);
    return {
      value: isTrashed ? "restore" : "delete",
      icon: resolveResourceActionIcon(
        isTrashed ? ResourceActionType.RESTORE : ResourceActionType.DELETE
      ),
      callback: async () => {
        if (isTrashed) {
          await this.mutate({
            operation: "restore",
            id: this.resource.id.toString(),
            context: this.accessPoint
          });
          await this.lifecycle?.onRestore?.([this.resource.id]);
        } else {
          await this.mutate({
            operation: "trash",
            id: this.resource.id.toString(),
            context: this.accessPoint
          });
          await this.lifecycle?.onTrash?.([this.resource.id]);
        }
      }
    };
  }
  /**
   * Action triggered from either resource browser or library page.
   * @returns
   */
  select(
    accessPoint: ResourceAccessPoint,
    accessPointId?: IRecordId
  ): IContextMenuItem {
    const resolvedAccessPointId = resolveBulkSelectionAccessPointId(
      accessPoint,
      accessPointId
    );
    const multiSelectContext = {
      resource: determineResourceType(this.resource.id),
      accessPoint,
      accessPointId: resolvedAccessPointId
    };

    const resolveEditor = () => {
      if (!bulkEditStore.matchesContext(multiSelectContext)) {
        bulkEditStore.activate(multiSelectContext, {
          onAction: (ids, action, data) => {
            const bulkEditor = new BulkEditor(
              multiSelectContext.resource,
              bulkEditStore
            );
            bulkEditor.run(action, data);
          },
          subContext: resolvedAccessPointId?.toString()
        });
      }
    };

    const state = bulkEditStore.getState();
    const selectedItems = state.selectedIds;
    const isSameSelectionContext =
      bulkEditStore.matchesContext(multiSelectContext);
    return {
      label:
        isSameSelectionContext &&
        selectedItems.some(resourceInList(this.resource.id))
          ? "Unselect"
          : "Select",
      value: ResourceActionType.SELECT,
      icon: "check-circle",
      callback: async () => {
        resolveEditor();
        const currentState = bulkEditStore.getState();
        const currentSelection = currentState.selectedIds;
        if (currentSelection.some(resourceInList(this.resource.id))) {
          bulkEditStore.select(
            currentSelection.filter((y) => !isSameResource(y, this.resource.id))
          );
        } else {
          bulkEditStore.select([...currentSelection, this.resource.id]);
        }
      }
    };
  }
  edit(context: ResourceAccessPoint): IContextMenuItem {
    return {
      label: this.resource.isInEditMode ? "Exit edit mode" : "Edit",
      value: ResourceActionType.EDIT,
      icon: this.resource.isInEditMode ? "exit-edit" : "edit",
      callback: async () => {
        if (context != ResourceAccessPoint.SELF) {
          appStore.openResource(
            this.resource.id,
            context === ResourceAccessPoint.BROWSER
              ? AccessMode.INLINE
              : AccessMode.POP,
            {
              searchParams: {
                [AppSearchParam.EDIT]: true
              }
            }
          );
        } else {
          updateActiveResource(this.resource.id, {
            isInEditMode: !this.resource.isInEditMode
          });
        }
      }
    };
  }
  toggleReadMode(): IContextMenuItem {
    return {
      value: ResourceActionType.TOGGLE_READ_MODE,
      label: "Read mode",
      icon: resolveResourceActionIcon(ResourceActionType.TOGGLE_READ_MODE),
      type: ContextMenuType.SWITCH,
      initialValue: this.resource.isInReadOnlyMode,
      callback: async (checked: boolean) => {
        updateActiveResource(this.resource.id, {
          isInReadOnlyMode: checked
        });
      }
    };
  }
  toggleFocusMode(): IContextMenuItem {
    return {
      value: GlobalEvent.FOCUS_MODE,
      label: "Focus",
      activeLabel: "Focused",
      icon: "circle",
      type: ContextMenuType.SWITCH,
      initialValue: this.resource.isInFocusMode,
      callback: async (checked: boolean) => {
        updateActiveResource(this.resource.id, {
          isInFocusMode: checked
        });
      }
    };
  }
  toggleLock(): IContextMenuItem {
    return {
      value: ResourceActionType.LOCK,
      label: "Lock",
      activeLabel: "Locked",
      icon: "lock-open",
      activeIcon: "lock",
      type: ContextMenuType.SWITCH,
      initialValue: this.resource.isLocked,
      callback: async (checked: boolean) => {
        await this.merge({
          isLocked: checked
        } as Partial<T>);
      }
    };
  }
  openAsTab(): IContextMenuItem {
    const tabData = uiState.getState(ResourceAccessPoint.TABS, {
      scope: UIStateScope.PRODUCT
    });
    const isAlreadyPinned = tabData?.some(resourceInList(this.resource.id));
    return {
      value: isAlreadyPinned ? "Remove from tabs" : "Open as tab",
      icon: isAlreadyPinned ? "minus-circle" : "tabs",
      callback: async () => {
        if (isAlreadyPinned) {
          tabs.remove(this.resource.id);
        } else {
          tabs.open(this.resource.id);
        }
      }
    };
  }
  /**
   * @deprecated - use openAsSplit instead
   */
  openAsSplitv1(): IContextMenuItem {
    return {
      value: "open-as-split",
      icon: "split-screen",
      callback: async () => {
        appStore.openResource(this.resource.id, AccessMode.SPLIT);
      }
    };
  }
  openAsSplit(): IContextMenuItem {
    const currentMode = determineResourceAccessMode(this.resource.id);
    return {
      value: "open-as-split",
      label:
        currentMode === AccessMode.SPLIT
          ? "Close split screen"
          : "Open in split screen",
      icon: currentMode === AccessMode.SPLIT ? "minus-circle" : "split-screen",
      callback: async () => {
        if (currentMode === AccessMode.SPLIT) {
          appStore.closeResource({
            id: this.resource.id,
            accessMode: AccessMode.SPLIT
          });
        } else {
          appStore.openResource(this.resource.id, AccessMode.SPLIT);
        }
      }
    };
  }
  maximize(): IContextMenuItem {
    const maxSearchParam = new URLSearchParams(window.location.search).get(
      AppSearchParam.MAX
    );
    const currentMode = determineResourceAccessMode(this.resource.id);
    return {
      value: "open-in-full-screen",
      label: maxSearchParam ? "Minimize" : "Maximize",
      icon: maxSearchParam ? "exitfullscreen" : "fullscreen",
      callback: async () => {
        appStore.toggleFullScreen(currentMode, this.resource.id);
      }
    };
  }
  unlink(contextId: IRecordId): IContextMenuItem {
    const isCollection =
      determineResourceType(contextId) === Resource.collection;
    return {
      label: isCollection ? "Remove from collection" : "Unlink",
      value: ResourceActionType.UNLINK,
      icon: resolveResourceActionIcon(ResourceActionType.UNLINK),
      callback: async () => {
        if (isCollection) {
          const resource = determineResourceType(this.resource.id);
          await datafn.table(resource).mutate({
            operation: "unrelate",
            id: this.resource.id.toString(),
            relations: {
              collections: [contextId.toString()]
            },
            context: contextId.toString()
          } as any);
          return;
        }
        const resource = determineResourceType(this.resource.id);
        await datafn.table(resource).mutate({
          operation: "unrelate",
          id: this.resource.id.toString(),
          relations: {
            links: [
              {
                $ref: contextId.toString(),
                linkType: LinkType.DIRECT
              }
            ]
          },
          context: contextId.toString()
        } as any);
        const contextResource = determineResourceType(contextId);
        if (contextResource !== Resource.unknown) {
          await datafn.table(contextResource).mutate({
            operation: "unrelate",
            id: contextId.toString(),
            relations: {
              links: [
                {
                  $ref: this.resource.id.toString(),
                  linkType: LinkType.DIRECT
                }
              ]
            },
            context: contextId.toString()
          } as any);
        }
      }
    };
  }
  link(): IContextMenuItem {
    return {
      label: "Add a link",
      value: ResourceActionType.LINK,
      icon: resolveResourceActionIcon(ResourceActionType.LINK),
      callback: async () => {
        appStore.runAction(Action.BULK_LINK, {
          componentParams: {
            items: [this.resource.id]
          }
        });
      }
    };
  }
  addToCollection(): IContextMenuItem {
    return {
      label: "Add to collection",
      value: "addToCollection",
      icon: resolveResourceActionIcon(ResourceActionType.ADD_TO),
      callback: async () => {
        appStore.runAction(Action.BULK_LINK, {
          componentParams: {
            label: "Add to collection",
            resource: Resource.collection,
            items: [this.resource.id]
          }
        });
      }
    };
  }
}
