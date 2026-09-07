<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import type { IRecordId } from "@nucleum/client/types/data.type";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { AccessMode } from "@nucleum/datafn/resource.type";
  import { Size } from "@nucleum/client/types/size.enum";
  import { cn } from "@nucleum/client/utils/ui.utils";
  import Button from "@nucleum/client/elements/button/Button.svelte";
  import TextInput from "@nucleum/client/elements/input/TextInput.svelte";
  import EmptyStatusView from "@nucleum/client/elements/feedback/EmptyStatusView.svelte";
  import { ButtonStyle, ButtonVariant } from "@nucleum/client/types/button.type";
  import {
    CombinationNavItemType,
    type ICombinationNavItem
  } from "./combination.type";
  import { ActiveCombinationStore } from "./combination.store";
  import SideNavCombinationNavItem from "./SideNavCombinationNavItem.svelte";
  import SideNavCombinationResourcePicker from "./SideNavCombinationResourcePicker.svelte";
  import CombinationResourceRenderer from "./CombinationResourceRenderer.svelte";
  import CombinationTOC from "./CombinationTOC.svelte";
  import { findItemPath, getItemByPath } from "./combination.utils";
  import { isValidArrayWithData } from "@21n/shared-utils/obj.utils";
  import { acquireDnDPage, appStore } from "@nucleum/client/stores/app.store";
  let {
    id,
    accessMode = AccessMode.INLINE,
    isEmbedded = false,
    visitedCombinationIds = new Set()
  }: {
    id: IRecordId;
    accessMode?: AccessMode;
    isEmbedded?: boolean;
    visitedCombinationIds?: Set<string>;
  } = $props();

  const combinationStore = ActiveCombinationStore.resolve(id);
  let selectedItemId = $state<string | null>(null);
  let editingItemId = $state<string | null>(null);
  let collapsedItemIds = $state(new Set<string>());
  let newSectionLabel = $state("");
  let isInitializing = $state(true);
  let draggedItemId = $state<string | null>(null);
  let isRootDragOver = $state(false);
  let releaseDnDPage: (() => void) | undefined;

  let combination = $derived($combinationStore);
  let isEditMode = $derived(combination?.isInEditMode ?? false);
  let items = $derived(combination?.items ?? []);
  let selectedItem = $derived(resolveNavItem(selectedItemId));
  let selectedResourceId = $derived(
    selectedItem?.type === CombinationNavItemType.RESOURCE
      ? selectedItem.resourceId
      : undefined
  );
  let selectedResourceType = $derived(
    selectedItem?.type === CombinationNavItemType.RESOURCE
      ? selectedItem.resourceType
      : undefined
  );

  onMount(async () => {
    releaseDnDPage = acquireDnDPage();
    await combinationStore.init(accessMode);
    isInitializing = false;
  });

  onDestroy(() => {
    releaseDnDPage?.();
    if (isEditMode) {
      combinationStore.toggleEditMode(false);
    }
  });

  $effect(() => {
    if (
      !isInitializing &&
      (!selectedItemId || !resolveNavItem(selectedItemId))
    ) {
      selectedItemId = findFirstResource(items)?.id ?? null;
    }
  });

  function resolveNavItem(itemId: string | null | undefined) {
    if (!itemId || !isValidArrayWithData(items)) return undefined;
    const path = findItemPath(items, itemId);
    if (!path) return undefined;
    return getItemByPath(items, path);
  }

  function findFirstResource(
    list: ICombinationNavItem[]
  ): ICombinationNavItem | undefined {
    for (const entry of list ?? []) {
      if (entry.type === CombinationNavItemType.RESOURCE) return entry;
      if (entry.children && entry.children.length > 0) {
        const nested = findFirstResource(entry.children);
        if (nested) return nested;
      }
    }
    return undefined;
  }

  function toggleEditMode() {
    combinationStore.toggleEditMode(!isEditMode);
    if (isEditMode) {
      editingItemId = null;
    }
    draggedItemId = null;
    isRootDragOver = false;
  }

  function onSelectNavItem(item: ICombinationNavItem) {
    selectedItemId = item.id;
  }

  function onToggleCollapse(id: string) {
    const next = new Set(collapsedItemIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    collapsedItemIds = next;
  }

  function onStartEdit(id: string) {
    editingItemId = id;
  }

  async function onEditLabel(event: { id: string; label: string }) {
    await combinationStore.updateNavItemLabel(event.id, event.label);
    editingItemId = null;
  }

  async function onDelete(id: string) {
    await combinationStore.deleteNavItem(id);
    editingItemId = null;
  }

  function onNavDragStart(id: string) {
    draggedItemId = id;
    isRootDragOver = false;
  }

  function onNavDragEnd() {
    draggedItemId = null;
    isRootDragOver = false;
  }

  async function onNavDrop(event: {
    itemId: string;
    targetId: string;
    position: "before" | "after" | "inside";
  }) {
    await combinationStore.moveNavItemRelative(event);
    draggedItemId = null;
    isRootDragOver = false;
  }

  function onLabelDebouncedChange(e: CustomEvent<string>) {
    combinationStore.updateLabel(e.detail);
  }

  async function addSection() {
    const trimmed = newSectionLabel.trim();
    if (!trimmed) return;
    const newId = await combinationStore.addSection({ label: trimmed });
    newSectionLabel = "";
    if (newId) {
      selectedItemId = newId;
    }
  }

  async function addResource(e: CustomEvent<{ item: any }>) {
    const detail = e.detail;
    if (!detail?.item?.id) return;
    const parentId = resolveTargetParentId();
    const newId = await combinationStore.addResource({
      resourceId: detail.item.id,
      parentId,
      label: detail.item.label ?? detail.item.name
    });
    if (parentId) {
      const next = new Set(collapsedItemIds);
      next.delete(parentId);
      collapsedItemIds = next;
    }
    if (newId) {
      selectedItemId = newId;
    }
  }

  function resolveTargetParentId() {
    if (!selectedItem) return undefined;
    if (selectedItem.type === CombinationNavItemType.SECTION) {
      return selectedItem.id;
    }
    const path = findItemPath(items, selectedItem.id);
    if (!path || path.length === 0) return undefined;
    const parentPath = path.slice(0, -1);
    if (parentPath.length === 0) return undefined;
    const parent = getItemByPath(items, parentPath);
    return parent?.id;
  }

  let visitedForRenderer = $derived.by(() => {
    const next = new Set(visitedCombinationIds);
    next.add(id.toString());
    return next;
  });

  function onRootDragOver(event: DragEvent) {
    if (!isEditMode || !draggedItemId) return;
    event.preventDefault();
    isRootDragOver = true;
  }

  function onRootDragLeave() {
    if (!isEditMode) return;
    isRootDragOver = false;
  }

  async function onRootDrop(event: DragEvent) {
    if (!isEditMode || !draggedItemId) return;
    event.preventDefault();
    await combinationStore.moveNavItemToParent({
      itemId: draggedItemId,
      parentId: undefined,
      index: items.length
    });
    draggedItemId = null;
    isRootDragOver = false;
  }
</script>

<div class="flex h-full w-full overflow-hidden">
  <aside
    class={cn(
      "flex flex-col w-80 min-w-[18rem] max-w-[20rem] h-full border-r border-brs3 bg-bgs1 gap-4",
      {
        "w-72 min-w-[16rem]": isEmbedded
      }
    )}
  >
    <header class="flex flex-col gap-2 px-3 pt-3 w-full">
      {#if isEditMode}
        <TextInput
          value={combination?.label ?? "Untitled space"}
          size={Size.md}
          onDebouncedChange={onLabelDebouncedChange}
        />
      {:else}
        <h1 class="text-h4 font-semibold truncate">
          {combination?.label ?? "Untitled space"}
        </h1>
      {/if}
      <div class="flex items-center gap-2">
        <Button
          size={Size.sm}
          icon={isEditMode ? "check" : "edit"}
          tooltip={isEditMode ? "Done" : "Edit"}
          type={isEditMode ? ButtonVariant.PRIMARY : ButtonVariant.SECONDARY}
          onclick={toggleEditMode}
        />
        <Button
          size={Size.sm}
          icon="refresh"
          tooltip="Refresh"
          onclick={() => combinationStore.init(accessMode)}
        />
      </div>
    </header>
    <section class="flex-1 overflow-auto w-full">
      {#if !isValidArrayWithData(items)}
        <div class="flex h-full items-center justify-center">
          <EmptyStatusView
            mainText="No items yet"
            subText={isEditMode
              ? "Add resources or sections to build the navigation"
              : "Switch to edit mode to start building this space"}
            isSearchContext={false}
          />
        </div>
      {:else}
        <div class="flex flex-col py-2 w-full truncate">
          {#each items as navItem}
            <SideNavCombinationNavItem
              item={navItem}
              depth={0}
              activeItemId={selectedItemId}
              {isEditMode}
              collapsedItems={collapsedItemIds}
              {editingItemId}
              {draggedItemId}
              onSelect={onSelectNavItem}
              onToggle={onToggleCollapse}
              {onStartEdit}
              onEdit={onEditLabel}
              {onDelete}
              onDragStart={onNavDragStart}
              onDragEnd={onNavDragEnd}
              onDrop={onNavDrop}
            />
          {/each}
        </div>
        {#if isEditMode && (draggedItemId || !isValidArrayWithData(items))}
          <div
            role="region"
            aria-label="Drop here to add to top level"
            class={cn(
              "mx-2 my-2 py-2 rounded-md border border-dashed text-center text-b3 transition-colors",
              {
                "border-aps1 text-aps1 bg-aps3/30": isRootDragOver,
                "border-brs3 text-fgs3": !isRootDragOver
              }
            )}
            ondragover={onRootDragOver}
            ondragleave={onRootDragLeave}
            ondrop={onRootDrop}
          >
            Drop here to add to top level
          </div>
        {/if}
      {/if}
    </section>
    {#if isEditMode}
      <section class="flex flex-col gap-4 px-3 pb-3">
        <SideNavCombinationResourcePicker onSelect={addResource} />
        <TextInput
          bind:value={newSectionLabel}
          placeholder="Add new section"
          size={Size.sm}
          isShowSaveControl={Boolean(newSectionLabel)}
          onSave={addSection}
          onEnter={addSection}
          onCancel={() => (newSectionLabel = "")}
        />
      </section>
    {/if}
  </aside>
  <main class="flex-1 h-full overflow-hidden">
    <CombinationResourceRenderer
      resourceId={selectedResourceId}
      resourceType={selectedResourceType}
      accessMode={AccessMode.INLINE}
      parentCombinationId={id}
      visitedCombinationIds={visitedForRenderer}
    />
  </main>
  <aside
    class="hidden lg:flex flex-col w-64 min-w-[14rem] h-full border-l border-brs3 bg-bgs2 p-4"
  >
    <CombinationTOC
      resourceId={selectedResourceId}
      resourceType={selectedResourceType}
    />
  </aside>
</div>
