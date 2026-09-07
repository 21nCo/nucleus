<script lang="ts">
  import { onMount } from "svelte";
  import { searchStore } from "@nucleum/application/search/search.store";
  import { InputStyle } from "@21n/types/input.type";
  import { cn } from "@21n/utils/ui.utils";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import {
    resolveProductResources,
    resolveResourceIcon
  } from "@nucleum/datafn/resource.utils";
  import { appStore } from "@nucleum/stores/app.store";
  import { properCase } from "@21n/shared-utils/text.utils";
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/types/size.enum";
  let {
    style = InputStyle.PLAIN,
    isAutoFocus = false,
    onBlur = undefined,
    onChange = undefined,
    onFocus = undefined
  }: {
    style?: InputStyle;
    isAutoFocus?: boolean;
    onBlur?: ((event: CustomEvent<void>) => void) | undefined;
    onChange?: ((event: CustomEvent<string>) => void) | undefined;
    onFocus?: ((event: CustomEvent<void>) => void) | undefined;
  } = $props();
  const placeholder = $derived(
    $searchStore.resourceType === Resource.everything
      ? "Start typing to search or press : to filter"
      : `Type here to search ${$searchStore.resourceType + "s"}`
  );
  let inputRef = $state<HTMLInputElement | undefined>();
  let searchQuery = $state("");
  let isShowingResourcePicker = $state(false);
  let resourcePickerQuery = $state("");
  let availableResources = $state<Resource[]>([]);
  let selectedResourceIndex = $state(0);

  $effect(() => {
    if (inputRef && !isShowingResourcePicker) {
      searchQuery = $searchStore.query;
    }
  });

  $effect(() => {
    if (isShowingResourcePicker) {
      selectedResourceIndex = 0;
    }
  });

  onMount(() => {
    const resources = resolveProductResources($appStore.product, "search");
    availableResources = resources ?? [];

    if (isAutoFocus) {
      setTimeout(() => {
        inputRef?.focus();
      }, 100);
    }
  });

  export function focus() {
    inputRef?.focus();
  }

  export function blur() {
    inputRef?.blur();
  }

  function emitChange(value: string) {
    const changeEvent = new CustomEvent<string>("change", { detail: value });
    if (typeof onChange === "function") onChange(changeEvent);
  }

  function emitBlur() {
    const blurEvent = new CustomEvent<void>("blur");
    if (typeof onBlur === "function") onBlur(blurEvent);
  }

  function emitFocus() {
    const focusEvent = new CustomEvent<void>("focus");
    if (typeof onFocus === "function") onFocus(focusEvent);
  }

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const value = target.value;

    if (
      value.endsWith(":") &&
      $searchStore.resourceType === Resource.everything
    ) {
      isShowingResourcePicker = true;
      resourcePickerQuery = "";
      searchQuery = value.slice(0, -1);
      searchStore.setQuery(searchQuery);
      return;
    }

    if (isShowingResourcePicker) {
      const parts = value.split(":");
      if (parts.length > 1) {
        resourcePickerQuery = parts[parts.length - 1];
      }
    } else {
      searchQuery = value;
      searchStore.setQuery(value);
      emitChange(value);
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      if (isShowingResourcePicker) {
        isShowingResourcePicker = false;
        resourcePickerQuery = "";
        e.stopPropagation();
        return;
      }
      if ($searchStore.resourceType) {
        removeResourceType();
        e.stopPropagation();
        return;
      }
    }

    if (
      e.key === "Backspace" &&
      searchQuery === "" &&
      $searchStore.resourceType !== Resource.everything
    ) {
      removeResourceType();
      e.preventDefault();
      return;
    }
    if (
      e.key === "Backspace" &&
      searchQuery === "" &&
      $searchStore.resourceType === Resource.everything
    ) {
      searchStore.reset();
      e.preventDefault();
      return;
    }

    if (isShowingResourcePicker) {
      if (e.key === "Enter" && filteredResources.length > 0) {
        selectResourceType(filteredResources[selectedResourceIndex]);
        e.preventDefault();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        selectedResourceIndex = Math.min(
          selectedResourceIndex + 1,
          filteredResources.length - 1
        );
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        selectedResourceIndex = Math.max(selectedResourceIndex - 1, 0);
        return;
      }
    }
    searchStore.keydown(e);
  }

  function handleKeyUp(e: KeyboardEvent) {
    searchStore.keyup(e);
  }

  function selectResourceType(resource: Resource) {
    searchStore.setResourceType(resource);
    isShowingResourcePicker = false;
    resourcePickerQuery = "";

    setTimeout(() => {
      inputRef?.focus();
    }, 50);
  }

  function removeResourceType() {
    searchStore.setResourceType(Resource.everything);
    inputRef?.focus();
  }

  const filteredResources = $derived(
    availableResources.filter((r) =>
      r.toLowerCase().includes(resourcePickerQuery.toLowerCase())
    )
  );

  const displayValue = $derived(
    isShowingResourcePicker
      ? `${searchQuery}:${resourcePickerQuery}`
      : searchQuery
  );
</script>

<div class="relative w-full flex items-center gap-2">
  {#if $searchStore.resourceType && $searchStore.resourceType !== Resource.everything}
    <div
      class="flex items-center gap-1 px-2 py-1 rounded bg-bgs3 text-fgs2 text-b3 whitespace-nowrap"
    >
      <Icon
        icon={resolveResourceIcon($searchStore.resourceType)}
        size={Size.xs}
      />
      <span>{properCase($searchStore.resourceType)}s</span>
      <button
        class="ml-1 hover:text-fgs1 flex items-center"
        onclick={removeResourceType}
        tabindex="-1"
      >
        <Icon icon="cross" size={Size.sm} />
      </button>
    </div>
  {/if}

  <div class="relative flex-1">
    <input
      bind:this={inputRef}
      value={displayValue}
      oninput={handleInput}
      onkeydown={handleKeyDown}
      onkeyup={handleKeyUp}
      onblur={() => emitBlur()}
      onfocus={() => emitFocus()}
      type="text"
      {placeholder}
      class={cn("w-full bg-transparent focus:outline-none focus:border-none", {
        "text-fgs2": style !== InputStyle.PLAIN
      })}
      autocomplete="off"
    />

    {#if isShowingResourcePicker && filteredResources.length > 0}
      <div
        class="absolute top-full left-0 mt-1 w-64 bg-bgs2 border border-brs3 rounded shadow-lg z-50 max-h-64 overflow-y-auto"
      >
        {#each filteredResources as resource, index}
          <button
            class={cn(
              "w-full px-3 py-2 text-left flex items-center gap-2 text-fgs2 text-b2",
              {
                "bg-bgs3": index === selectedResourceIndex,
                "hover:bg-bgs3": index !== selectedResourceIndex
              }
            )}
            onclick={() => selectResourceType(resource)}
            onmousedown={(e) => e.preventDefault()}
            onmouseenter={() => (selectedResourceIndex = index)}
          >
            <Icon icon={resolveResourceIcon(resource)} size={Size.sm} />
            <span>{properCase(resource)}s</span>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>
