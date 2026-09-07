<script lang="ts">
  import { ResourceAccessPoint, type IMultiSelectContext } from "@nucleum/datafn/resource.type";
import { ResourceActionType } from "@nucleum/schema/legacy/resource-action.enum";
  import Button from "@21n/elements/button/Button.svelte";
  import { ButtonStyle, ButtonVariant } from "@21n/elements/button/button.type";
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import { LinkType } from "@nucleum/features/memory/linking/link.type";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import appearance from "@nucleum/stores/appearance.store";
  import { Theme } from "@21n/theme/appearance.type";
  import { resolveResourceActionIcon } from "@nucleum/datafn/resource.utils";
  import { enumToString } from "@21n/shared-utils/text.utils";
  import { isSameDay } from "@21n/utils/time.utils";
  import DatePicker from "@21n/elements/datetime/DatePicker.svelte";
  import { tooltip } from "@nucleum/actions/popover.action";
  let {
    count = 0,
    context,
    subContext = "",
    isExpandedMode = true,
    onAction = undefined,
    onSelectAll = undefined,
    onClear = undefined
  }: {
    count?: number;
    context: IMultiSelectContext;
    subContext?: string;
    isExpandedMode?: boolean;
    onAction?: ((detail: { action: string; data?: any }) => void) | undefined;
    onSelectAll?: (() => void) | undefined;
    onClear?: (() => void) | undefined;
  } = $props();
  type Action = {
    action: string;
    label: string;
    icon: string;
  };
  let isHideStar = $derived(
    [Resource.task, Resource.session].includes(context.resource)
  );
  let isHideArchive = $derived(
    [Resource.task, Resource.session].includes(context.resource)
  );
  const buttonProps = {
    size: Size.sm,
    style: ButtonStyle.OUTLINED,
    isPreventMinWidth: true
  } as const;
  let parentBgIndex = $derived($appearance.theme === Theme.LIGHT ? 1 : 3);

  const selectAllAction = {
    action: "selectAll",
    label: "Select all",
    icon: "check-circle"
  };
  const clearSelectionAction = {
    action: "clearSelection",
    label: "Clear selection",
    icon: "x-circle"
  };
  const linkAction = {
    action: ResourceActionType.LINK,
    label: "Link to node",
    get icon() {
      return resolveResourceActionIcon(this.action);
    }
  };
  const linkBoxAction = {
    action: "linkbox",
    label: "Link to node or Add to collection",
    icon: resolveResourceActionIcon(ResourceActionType.LINK)
  };
  const collectAction = {
    action: "collect",
    label: "Add to collection",
    icon: resolveResourceActionIcon(ResourceActionType.ADD_TO)
  };
  const uncollectAction = {
    action: ResourceActionType.UNLINK,
    label: "Remove from collection",
    icon: resolveResourceActionIcon(ResourceActionType.REMOVE_FROM)
  };
  const completeAction = {
    action: "complete",
    label: "Mark as completed",
    icon: "check-square"
  };
  const moveToToday = {
    action: "moveToToday",
    label: "Move to today",
    icon: "move"
  };
  const setDate = {
    action: "setDate",
    label: "Set date",
    icon: "calendar-blank"
  };
  const convertAction = {
    action: ResourceActionType.CONVERT,
    label: "Turn into",
    icon: resolveResourceActionIcon(ResourceActionType.CONVERT)
  };

  function resolveAction(action: ResourceActionType) {
    return {
      action,
      label: enumToString(action),
      icon: resolveResourceActionIcon(action)
    };
  }

  function resolveItems() {
    const actions: Action[] = [];
    const rightActions: Action[] = [];
    if (
      context.accessPoint === ResourceAccessPoint.NODE_LINKS &&
      subContext === LinkType.DIRECT
    ) {
      actions.push(resolveAction(ResourceActionType.UNLINK));
    } else if (context.accessPoint === ResourceAccessPoint.COLLECTION) {
      actions.push(uncollectAction);
    } else if (
      context.accessPoint === ResourceAccessPoint.BROWSER ||
      context.accessPoint === ResourceAccessPoint.LIBRARY
    ) {
      if (context.resource === Resource.node) {
        if (isExpandedMode) actions.push(linkAction, collectAction);
        else actions.push(linkBoxAction);
      } else if (context.resource === Resource.task) {
        actions.push(completeAction);
      }
      if (subContext.includes("starred")) {
        actions.push(resolveAction(ResourceActionType.UNSTAR));
      } else if (!isHideStar) {
        actions.push(resolveAction(ResourceActionType.STAR));
      }
      if (subContext.includes("archived")) {
        actions.push(resolveAction(ResourceActionType.UNARCHIVE));
      } else if (!isHideArchive) {
        actions.push(resolveAction(ResourceActionType.ARCHIVE));
      }
      actions.push(resolveAction(ResourceActionType.DELETE));
    } else if (context.accessPoint === ResourceAccessPoint.MARKDOWN) {
      actions.push(
        // convertAction,
        resolveAction(ResourceActionType.COPY_CONTENTS),
        resolveAction(ResourceActionType.DUPLICATE),
        resolveAction(ResourceActionType.DELETE)
      );
    } else if (
      context.resource === Resource.task &&
      (context.accessPoint === ResourceAccessPoint.CALENDAR ||
        context.accessPoint === ResourceAccessPoint.OBJECTIVE)
    ) {
      actions.push(completeAction);
      actions.push(setDate);
      if (context.accessPoint === ResourceAccessPoint.CALENDAR) {
        const date = new Date(subContext);
        const isToday = isSameDay(date, new Date());
        if (!isToday) actions.push(moveToToday);
      }
      actions.push(resolveAction(ResourceActionType.DELETE));
    }

    rightActions.push(selectAllAction, clearSelectionAction);
    return { actions, rightActions };
  }

  let resolvedItems = $derived.by(resolveItems);
  let actions = $derived(resolvedItems.actions);
  let rightActions = $derived(resolvedItems.rightActions);

  function resolveCountLabel(count: number) {
    if (count === 0) return 0;
    const itemLabel =
      context.resource === Resource.node &&
      context.accessPoint === ResourceAccessPoint.MARKDOWN
        ? "block"
        : context.resource;
    if (count === 1) return `1 ${itemLabel}`;
    return `${count} ${itemLabel}s`;
  }

  function emitAction(detail: { action: string; data?: any }) {
    onAction?.(detail);
  }

  function emitSelectAll() {
    onSelectAll?.();
  }

  function emitClear() {
    onClear?.();
  }

</script>

<!-- TODO - invert color layer with corresponding opposite light/dark color scheme -->
<div
  data-testid="bulk-edit-bar"
  class="grid grid-cols-[auto_1fr_auto] gap-3 items-center text-fgs1 overflow-auto w-full px-3"
>
  <span class="flex whitespace-nowrap">
    Selected: {resolveCountLabel(count)}
  </span>
  <span class="flex gap-2 overflow-x-auto">
    {#each actions as action}
      {#if action.action === "setDate"}
        <div
          class="border border-brs3 rounded-full hover:bg-bgs2-striped"
          use:tooltip={{
            text: "Set date"
          }}
        >
          <DatePicker
            variant="inline-with-icon"
            onChange={(e) => {
              emitAction({
                action: action.action,
                data: e.detail
              });
            }}
          />
        </div>
      {:else}
        <Button
          label={isExpandedMode ? action.label : undefined}
          ariaLabel={isExpandedMode ? undefined : action.label}
          tooltip={isExpandedMode ? undefined : action.label}
          icon={action.icon}
          type={action.label === "Delete"
            ? ButtonVariant.DANGER
            : ButtonVariant.SECONDARY}
          {parentBgIndex}
          {...buttonProps}
          onclick={() => {
            emitAction({
              action: action.action
            });
          }}
        />
      {/if}
    {/each}
  </span>
  <span class="flex gap-2 items-center justify-end">
    {#each rightActions as action}
      <Button
        label={isExpandedMode ? action.label : undefined}
        ariaLabel={isExpandedMode ? undefined : action.label}
        tooltip={isExpandedMode ? undefined : action.label}
        icon={action.icon}
        {parentBgIndex}
        {...buttonProps}
        onclick={() => {
          if (action.action === "selectAll") {
            emitSelectAll();
          } else if (action.action === "clearSelection") {
            emitClear();
          } else {
            emitAction({
              action: action.action
            });
          }
        }}
      />
    {/each}
  </span>
</div>
