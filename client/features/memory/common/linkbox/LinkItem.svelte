<script lang="ts">
  import type { IRecordId } from "@21n/types/data.type";
  import Tag from "@21n/elements/text/Tag.svelte";
  import { popover } from "@nucleum/actions/popover.action";
  import context from "@nucleum/stores/context.store";
  import { PopoverTriggerMethod } from "@21n/types/popover.type";
  import ContextMenu from "@21n/elements/contextMenu/ContextMenu.svelte";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import type { IAvatar } from "@21n/types/avatar.type";

  let {
    id,
    parentBgIndex = 1,
    isActive = false,
    isRemovable = true,
    isAlwaysShowRemove = false,
    accessPoint = ResourceAccessPoint.CLIPPER,
    onclick = undefined,
    onGoToResource = undefined,
    onRemove = undefined,
    record = undefined
  }: {
    id: IRecordId;
    parentBgIndex?: number;
    isActive?: boolean;
    isRemovable?: boolean;
    isAlwaysShowRemove?: boolean;
    accessPoint?: ResourceAccessPoint;
    onclick?: ((event: MouseEvent) => void) | undefined;
    onGoToResource?: ((event: CustomEvent<IRecordId>) => void) | undefined;
    onRemove?: ((event: CustomEvent<IRecordId>) => void) | undefined;
    record?: LinkItemRecord | undefined;
  } = $props();
  type LinkItemRecord = {
    avatar?: string | IAvatar;
    typeToExtend?: { avatar?: string | IAvatar } | string;
    label?: string;
    text?: string;
  };
  const item = $derived(record);

  function resovleIcon() {
    if (item?.avatar) {
      return item.avatar;
    } else if (
      item?.typeToExtend &&
      typeof item.typeToExtend === "object" &&
      item.typeToExtend.avatar
    ) {
      return item.typeToExtend.avatar;
    }
    return undefined;
  }

  function resolveContextMenu() {
    const removeItem = {
      label: "Remove",
      value: "delete",
      icon: "trash",
      callback: async () => {
        const removeEvent = new CustomEvent<IRecordId>("remove", {
          detail: id
        });
        onRemove?.(removeEvent);
      }
    };
    if (
      accessPoint === ResourceAccessPoint.CAPTURE ||
      accessPoint === ResourceAccessPoint.CLIPPER
    ) {
      return [
        {
          group: "all",
          items: [removeItem]
        }
      ];
    }
    return [
      {
        group: "all",
        items: [
          {
            label: `Go to ${item?.label}`,
            value: "goToResource",
            icon: "proceed",
            callback: async () => {
              const goToResourceEvent = new CustomEvent<IRecordId>(
                "goToResource",
                {
                  detail: id
                }
              );
              onGoToResource?.(goToResourceEvent);
            }
          },
          removeItem
        ]
      }
    ];
  }
</script>

{#if item}
  <div
    data-testid={`link-item:${id}`}
    use:popover={{
      content: ContextMenu,
      triggerMethod:
        $context.isTouchDevice && accessPoint === ResourceAccessPoint.SELF
          ? [PopoverTriggerMethod.CLICK]
          : [PopoverTriggerMethod.RIGHT_CLICK],
      componentProps: { menuResolver: resolveContextMenu },
      id: "linkItemContextMenu",
      groupId: "linkItemContextMenuGroup"
    }}
  >
    <Tag
      {id}
      label={item?.label || item?.text || "Untitled"}
      {parentBgIndex}
      {isActive}
      isShowExpandFeedbackOnActive={true}
      icon={resovleIcon()}
      {isRemovable}
      removeStyle={isAlwaysShowRemove ? "always-show" : "inline"}
      onclick={(event) => {
        onclick?.(event);
      }}
      onRemove={() => {
        const removeEvent = new CustomEvent<IRecordId>("remove", {
          detail: id
        });
        onRemove?.(removeEvent);
      }}
    />
  </div>
{:else}
  <span></span>
{/if}
