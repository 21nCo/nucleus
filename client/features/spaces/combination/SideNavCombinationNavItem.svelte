<script lang="ts">
  import { hoverable } from "@nucleum/client/actions/hover.action";
  import Icon from "@nucleum/client/elements/Icon.svelte";
  import TextInput from "@nucleum/client/elements/input/TextInput.svelte";
  import AvatarRenderer from "@nucleum/client/elements/avatarPicker/AvatarRenderer.svelte";
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@nucleum/client/utils/ui.utils";
  import { resolveResourceIcon } from "@nucleum/datafn/resource.utils";
  import type { IAvatar } from "@21n/elements/avatarPicker/avatar.type";
  import SideNavCombinationNavItem from "@nucleum/features/spaces/combination/SideNavCombinationNavItem.svelte";
  import {
    CombinationNavItemType,
    type ICombinationNavItem
  } from "@nucleum/features/spaces/combination/combination.type";

  let {
    item,
    depth = 0,
    activeItemId = null,
    isEditMode = false,
    collapsedItems = new Set(),
    editingItemId = null,
    draggedItemId = null,
    onSelect = undefined,
    onToggle = undefined,
    onEdit = undefined,
    onStartEdit = undefined,
    onDelete = undefined,
    onDragStart = undefined,
    onDragEnd = undefined,
    onDrop = undefined
  }: {
    item: ICombinationNavItem;
    depth?: number;
    activeItemId?: string | null;
    isEditMode?: boolean;
    collapsedItems?: Set<string>;
    editingItemId?: string | null;
    draggedItemId?: string | null;
    onSelect?: ((item: ICombinationNavItem) => void) | undefined;
    onToggle?: ((id: string) => void) | undefined;
    onEdit?: ((detail: { id: string; label: string }) => void) | undefined;
    onStartEdit?: ((id: string) => void) | undefined;
    onDelete?: ((id: string) => void) | undefined;
    onDragStart?: ((id: string) => void) | undefined;
    onDragEnd?: ((id: string) => void) | undefined;
    onDrop?:
      | ((detail: {
          itemId: string;
          targetId: string;
          position: "before" | "after" | "inside";
        }) => void)
      | undefined;
  } = $props();

  let editLabel = $state(item.label);
  let isHoveringItem = $state(false);
  let dropPosition = $state<"before" | "after" | "inside" | null>(null);

  let isCollapsed = $derived(collapsedItems.has(item.id));
  let isEditing = $derived(isEditMode && editingItemId === item.id);
  let isActive = $derived(activeItemId === item.id);
  let avatar = $derived(resolveAvatar());
  let resourceIcon = $derived(
    item.type === CombinationNavItemType.RESOURCE
      ? resolveResourceIcon(item.resourceType)
      : "folder"
  );
  $effect(() => {
    if (!isEditing) {
      editLabel = item.label;
    }
  });

  function resolveAvatar(): IAvatar | undefined {
    if (item.avatar) return item.avatar;
    if (item.type === CombinationNavItemType.RESOURCE && item.resourceAvatar)
      return item.resourceAvatar;
    return undefined;
  }

  function handleSelectClick(event: MouseEvent) {
    event.stopPropagation();
    activateItem();
  }

  function activateItem() {
    if (item.type === CombinationNavItemType.RESOURCE) {
      onSelect?.(item);
    } else if (item.children && item.children.length > 0) {
      onToggle?.(item.id);
    }
  }

  function handleItemKeydown(event: KeyboardEvent) {
    if (event.target !== event.currentTarget) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    event.stopPropagation();
    activateItem();
  }

  function onChevronClick(event: MouseEvent) {
    event.stopPropagation();
    onToggle?.(item.id);
  }

  function onSaveLabel(value: string) {
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    onEdit?.({ id: item.id, label: trimmed });
  }

  function handleDragStart(event: DragEvent) {
    if (!isEditMode || isEditing) return;
    event.stopPropagation();
    event.dataTransfer?.setData("text/plain", item.id);
    onDragStart?.(item.id);
  }

  function handleDragEnd(event: DragEvent) {
    event.stopPropagation();
    dropPosition = null;
    onDragEnd?.(item.id);
  }

  function resolveDropPosition(event: DragEvent) {
    const element = event.currentTarget as HTMLElement;
    const { top, height } = element.getBoundingClientRect();
    const offsetY = event.clientY - top;
    const threshold = height / 4;
    if (offsetY < threshold) return "before" as const;
    if (offsetY > height - threshold) return "after" as const;
    return "inside" as const;
  }

  function handleDragOver(event: DragEvent) {
    if (!isEditMode || !draggedItemId || draggedItemId === item.id) return;
    event.preventDefault();
    event.stopPropagation();
    const position = resolveDropPosition(event);
    dropPosition =
      position === "inside" && item.type !== CombinationNavItemType.SECTION
        ? "after"
        : position;
  }

  function handleDragLeave(event: DragEvent) {
    if (!isEditMode) return;
    if (
      !(event.currentTarget instanceof HTMLElement) ||
      !event.currentTarget.contains(event.relatedTarget as Node)
    ) {
      dropPosition = null;
    }
  }

  function handleDrop(event: DragEvent) {
    if (!isEditMode || !draggedItemId || draggedItemId === item.id) return;
    event.preventDefault();
    event.stopPropagation();
    const position =
      dropPosition ??
      (item.type === CombinationNavItemType.SECTION ? "inside" : "after");
    onDrop?.({
      itemId: draggedItemId,
      targetId: item.id,
      position
    });
    dropPosition = null;
  }
</script>

<div class="flex flex-col w-full" data-id={item.id}>
  <div
    role="button"
    tabindex="0"
    class={cn(
      "group flex items-center gap-2 px-2 py-2 transition-colors border-y",
      {
        "bg-bgs2 border-brs2": isActive,
        "hover:bg-bgs2-striped border-transparent": !isActive,
        "opacity-70 cursor-default":
          item.type === CombinationNavItemType.SECTION && !item.children?.length
      }
    )}
    draggable={isEditMode && !isEditing}
    use:hoverable={{
      onHover: (val) => (isHoveringItem = val)
    }}
    ondragstart={handleDragStart}
    ondragend={handleDragEnd}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    style={`padding-left: ${Math.min(depth * 1.25 + 0.75, 4)}rem;` +
      dropPosition ===
    "before"
      ? "box-shadow: inset 0 2px 0 0 var(--aps1);"
      : dropPosition === "after"
        ? "box-shadow: inset 0 -2px 0 0 var(--aps1);"
        : dropPosition === "inside"
          ? "box-shadow: inset 0 0 0 2px var(--aps1);"
          : undefined}
    onclick={handleSelectClick}
    onkeydown={handleItemKeydown}
  >
    {#if item.children && item.children.length > 0}
      <button
        type="button"
        aria-label={isCollapsed ? "Expand section" : "Collapse section"}
        class="flex items-center justify-center w-6 h-6 rounded-md hover:bg-bgs3"
        onclick={onChevronClick}
      >
        <Icon
          icon={isCollapsed ? "chevron-right" : "chevron-down"}
          class="stroke-fgs2"
          size={Size.sm}
        />
      </button>
    {:else}
      <span class="w-6" />
    {/if}
    {#if isEditMode && !isEditing}
      <Icon icon="rearrange" size={Size.sm} class="stroke-fgs3" />
    {/if}
    <div class="flex-1 min-w-0 text-left truncate">
      {#if isEditing}
        <TextInput
          bind:value={editLabel}
          size={Size.sm}
          onSave={(e) => onSaveLabel(e.detail.value)}
          onEnter={(e) => onSaveLabel(e.detail.value)}
          onBlur={() => onSaveLabel(editLabel)}
          isShowSaveControl={false}
        />
      {:else}
        <span class="truncate text-left text-b2">{item.label}</span>
      {/if}
    </div>
    {#if item.children && item.children.length > 0}
      <span class="text-b3 text-fgs3">{item.children.length}</span>
    {/if}
    {#if isEditMode}
      <div class="flex items-center gap-1">
        <button
          class="p-1 rounded-md hover:bg-bgs3"
          title="Rename"
          onclick={(e) => {
            e.stopPropagation();
            onStartEdit?.(item.id);
          }}
        >
          <Icon icon="edit" size={Size.sm} class="stroke-fgs2" />
        </button>
        <button
          class={cn(
            "p-1 rounded-md hover:bg-bgs3 text-err transition-opacity",
            {
              "opacity-0 pointer-events-none": !isHoveringItem,
              "opacity-100": isHoveringItem
            }
          )}
          title="Remove"
          onclick={(e) => {
            e.stopPropagation();
            onDelete?.(item.id);
          }}
        >
          <Icon icon="trash" size={Size.sm} class="stroke-err" />
        </button>
      </div>
    {/if}
  </div>

  {#if item.children && item.children.length > 0 && !isCollapsed}
    <div class="flex flex-col">
      {#each item.children as child}
        <SideNavCombinationNavItem
          item={child}
          depth={depth + 1}
          {activeItemId}
          {isEditMode}
          {collapsedItems}
          {editingItemId}
          {draggedItemId}
          {onSelect}
          {onToggle}
          {onEdit}
          {onStartEdit}
          {onDelete}
          {onDragStart}
          {onDragEnd}
          {onDrop}
        />
      {/each}
    </div>
  {/if}
</div>
