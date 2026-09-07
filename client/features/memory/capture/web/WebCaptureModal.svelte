<script lang="ts">
  import { onDestroy } from "svelte";
  import { fade } from "svelte/transition";
  import Icon from "$lib/client/elements/Icon.svelte";
  import { Size } from "$lib/client/types/size.enum";
  import { cn } from "$lib/client/utils/ui.utils";
  import { browser } from "$app/environment";
  import {
    searchWebArtifacts,
    WebCaptureServiceError
  } from "./webCapture.service";
  import type {
    WebArtifact,
    WebArtifactCategory
  } from "./webCapture.types";

  const tabs: { id: WebArtifactCategory; label: string; icon: string }[] = [
    { id: "MOVIES", label: "Movies", icon: "video-camera" },
    { id: "BOOKS", label: "Books", icon: "book-open" },
    { id: "PODCASTS", label: "Podcasts", icon: "microphone" },
    { id: "RECIPES", label: "Recipes", icon: "sparkles" },
    { id: "VIDEOS", label: "Videos", icon: "play" },
    { id: "ARTICLES", label: "Articles", icon: "document-text" }
  ];
  type TabId = WebArtifactCategory;

  const tabLookup = new Map(tabs.map((tab) => [tab.id, tab.label]));

  const CATEGORY_LIMITS: Record<TabId, number> = {
    MOVIES: 12,
    BOOKS: 20,
    PODCASTS: 12,
    RECIPES: 16,
    VIDEOS: 12,
    ARTICLES: 20
  };

  const MIN_QUERY_LENGTH = 2;
  const SEARCH_DEBOUNCE = 350;

  let {
    open = false,
    onClose = undefined,
    onAdd = undefined,
    onPreview = undefined
  }: {
    open?: boolean;
    onClose?: (() => void) | undefined;
    onAdd?: ((detail: { item: WebArtifact; tab: TabId }) => void) | undefined;
    onPreview?:
      | ((detail: { item: WebArtifact; tab: TabId }) => void)
      | undefined;
  } = $props();

  type SearchStatus = "idle" | "loading" | "success" | "error";
  type SearchState = {
    status: SearchStatus;
    query: string;
    items: WebArtifact[];
    page: number;
    limit: number;
    total: number;
    error?: string;
  };

  function createInitialState(): Record<TabId, SearchState> {
    return tabs.reduce((acc, tab) => {
      acc[tab.id] = {
        status: "idle",
        query: "",
        items: [],
        page: 1,
        limit: CATEGORY_LIMITS[tab.id],
        total: 0,
        error: undefined
      };
      return acc;
    }, {} as Record<TabId, SearchState>);
  }

  let searchStates = $state<Record<TabId, SearchState>>(createInitialState());
  let activeTab = $state<TabId>(tabs[0].id);
  let searchTerm = $state("");
  let wasOpen = $state(false);
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let activeController: AbortController | null = null;
  let activeRequestKey: string | null = null;
  let requestCounter = 0;
  const trimmedQuery = $derived(searchTerm.trim());

  const updateState = (category: TabId, partial: Partial<SearchState>) => {
    searchStates = {
      ...searchStates,
      [category]: {
        ...searchStates[category],
        ...partial
      }
    };
  };

  const resetAllStates = () => {
    searchStates = createInitialState();
  };

  function cancelInFlight() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (activeController) {
      activeController.abort();
      activeController = null;
      activeRequestKey = null;
    }
  }

  async function fetchCategory(category: TabId, query: string) {
    const state = searchStates[category];
    const limit = state.limit ?? CATEGORY_LIMITS[category];

    const controller = new AbortController();
    const requestKey = `${category}|${query}|${++requestCounter}`;
    cancelInFlight();
    activeController = controller;
    activeRequestKey = requestKey;

    updateState(category, {
      status: "loading",
      query,
      error: undefined
    });

    try {
      const result = await searchWebArtifacts({
        category,
        query,
        page: 1,
        limit,
        signal: controller.signal
      });

      if (activeRequestKey !== requestKey) return;

      updateState(category, {
        status: "success",
        items: result.items,
        total: result.total,
        page: result.page,
        limit: result.limit,
        query
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        updateState(category, {
          status: "idle",
          query
        });
        return;
      }

      if (activeRequestKey !== requestKey) return;

      let message = "Something went wrong while searching.";
      if (error instanceof WebCaptureServiceError) {
        if (error.status === 401) {
          message = "Session expired. Please sign in again.";
        } else {
          message = error.message;
        }
      }

      updateState(category, {
        status: "error",
        error: message,
        items: [],
        total: 0,
        query
      });
    } finally {
      if (activeRequestKey === requestKey) {
        activeController = null;
        activeRequestKey = null;
      }
    }
  }

  function triggerSearch(category: TabId, query: string) {
    if (!open) return;

    const normalized = query.trim();
    const state = searchStates[category];

    if (normalized.length < MIN_QUERY_LENGTH) {
      cancelInFlight();
      if (state.status !== "idle" || state.items.length > 0 || state.query !== normalized) {
        updateState(category, {
          status: "idle",
          query: normalized,
          items: [],
          total: 0,
          page: 1,
          error: undefined
        });
      }
      return;
    }

    if (state.status === "loading" && state.query === normalized) {
      return;
    }
    if (state.status === "success" && state.query === normalized) {
      return;
    }

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => fetchCategory(category, normalized), SEARCH_DEBOUNCE);
  }

  $effect(() => {
    if (!open && wasOpen) {
      cancelInFlight();
      resetAllStates();
      searchTerm = "";
      activeTab = tabs[0].id;
    }
    wasOpen = open;
  });

  $effect(() => {
    if (open) {
      triggerSearch(activeTab, trimmedQuery);
    }
  });

  $effect(() => {
    if (!browser || !open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  });

  onDestroy(() => {
    cancelInFlight();
  });

  function close() {
    onClose?.();
  }

  function selectTab(id: TabId) {
    if (activeTab === id) return;
    activeTab = id;
    triggerSearch(id, trimmedQuery);
  }

  function addItem(item: WebArtifact) {
    onAdd?.({ item, tab: activeTab });
  }

  function initials(title: string) {
    if (!title) return "";
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return "";
    const parts = trimmedTitle.split(/\s+/).slice(0, 2);
    const value = parts.map((part) => part.charAt(0)).join("");
    return value ? value.toUpperCase() : trimmedTitle.charAt(0).toUpperCase();
  }

  function resolveMeta(item: WebArtifact): string | undefined {
    if (item.rating !== undefined) {
      const rounded = item.ratingScale && item.ratingScale <= 10 ? Number(item.rating.toFixed(1)) : item.rating;
      return `⭐ ${rounded}${item.ratingScale ? `/${item.ratingScale}` : ""}`;
    }
    if (item.durationMinutes) {
      return `${item.durationMinutes} min`;
    }
    if (item.releaseDate) {
      return item.releaseDate.split("T")[0];
    }
    if (item.providers?.length) {
      return item.providers[0]?.name;
    }
    return undefined;
  }

  function handleRetry() {
    triggerSearch(activeTab, trimmedQuery);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  }

  const searchPlaceholder = $derived.by(() => {
    const label = tabLookup.get(activeTab);
    return label ? `Search ${label.toLowerCase()}` : "Search";
  });

  const currentState = $derived(searchStates[activeTab]);
  const items = $derived(currentState.items ?? []);
  const isLoading = $derived(currentState.status === "loading");
  const isError = $derived(currentState.status === "error");
  const hasQuery = $derived(trimmedQuery.length >= MIN_QUERY_LENGTH);
  const showSkeleton = $derived(isLoading && items.length === 0);
  const showLoadingOverlay = $derived(isLoading && items.length > 0);
  const showPrompt = $derived(!hasQuery);
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
  <div class="fixed inset-0 z-[120] flex items-center justify-center" transition:fade>
    <button
      type="button"
      aria-label="Close dialog"
      class="absolute inset-0 bg-bgs1/80 backdrop-blur-xl"
      onclick={close}
    />
    <div
      class="relative z-[121] flex h-full w-full max-w-6xl items-stretch justify-center p-6 mo:p-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="web-capture-title"
    >
      <div class="flex h-full max-h-[90vh] w-full flex-col overflow-hidden rounded-[2rem] bg-bgs1 shadow-xl mo:h-full mo:max-h-full mo:rounded-none">
        <header class="grid grid-cols-[auto,1fr,auto] items-center gap-4 border-b border-brs3 px-6 py-4 mo:px-4">
          <button
            class="flex items-center gap-2 rounded-full border border-transparent px-3 py-1 text-b3 text-fgs3 transition hover:border-brs3 hover:text-fgs1"
            onclick={close}
          >
            <Icon icon="arrow-left" size={Size.sm} />
            <span>Back</span>
          </button>
          <h2 id="web-capture-title" class="text-center text-b1 font-semibold text-fgs1 dp:text-h5">Add from Web</h2>
          <div class="flex justify-end">
            <button
              class="flex h-10 w-10 items-center justify-center rounded-full border border-brs3 text-fgs3 transition hover:border-aps1 hover:text-aps1"
              onclick={close}
            >
              <Icon icon="cross" size={Size.sm} />
            </button>
          </div>
        </header>
        <section class="border-b border-brs3 px-6 py-5 mo:px-4">
          <div class="flex flex-col gap-4">
            <div
              class={cn(
                "flex items-center gap-3 rounded-full border bg-bgs2 px-4 py-2 text-b2 transition",
                {
                  "border-aps1": trimmedQuery.length > 0,
                  "border-brs3": trimmedQuery.length === 0
                }
              )}
            >
              <Icon icon="search" size={Size.sm} class="text-fgs3" />
              <input
                class="flex-1 bg-transparent text-b2 text-fgs1 placeholder:text-fgs4 focus:outline-none"
                type="search"
                placeholder={searchPlaceholder}
                bind:value={searchTerm}
                aria-label="Search web artifacts"
                autocapitalize="none"
                autocomplete="off"
                spellcheck={false}
              />
              {#if trimmedQuery.length > 0}
                <button
                  class="rounded-full p-1 text-fgs3 transition hover:text-aps1"
                  onclick={() => {
                    searchTerm = "";
                  }}
                >
                  <Icon icon="cross" size={Size.sm} />
                </button>
              {/if}
            </div>
            <div class="flex items-center gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Artifact categories">
              {#each tabs as tab}
                <button
                  class={cn(
                    "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-b3 transition",
                    {
                      "bg-aps1 text-bgs1 shadow-md": tab.id === activeTab,
                      "bg-bgs2 text-fgs3 hover:bg-bgs3": tab.id !== activeTab
                    }
                  )}
                  role="tab"
                  aria-selected={tab.id === activeTab}
                  tabindex={tab.id === activeTab ? 0 : -1}
                  onclick={() => selectTab(tab.id)}
                >
                  <Icon icon={tab.icon} size={Size.sm} isAccentBgContext={tab.id === activeTab} />
                  <span>{tab.label}</span>
                </button>
              {/each}
            </div>
          </div>
        </section>
        <section class="relative flex-1 overflow-y-auto px-6 py-6 mo:px-4">
          {#if showLoadingOverlay}
            <div class="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
              <div class="mt-2 flex items-center gap-2 rounded-full bg-bgs2 px-4 py-1 text-caption text-fgs3 shadow">
                <Icon icon="svg-spinners:3-dots-fade" size={Size.sm} />
                <span>Updating results...</span>
              </div>
            </div>
          {/if}

          {#if showPrompt}
            <div class="flex h-full flex-col items-center justify-center gap-4 text-center text-fgs3">
              <Icon icon="search" size={Size.lg} class="text-fgs3" />
              <div class="max-w-md text-b2 text-fgs1">
                Start typing to search. Enter at least {MIN_QUERY_LENGTH} characters to discover movies, books, podcasts, recipes, videos, or articles.
              </div>
            </div>
          {:else if showSkeleton}
            <div class="flex flex-col gap-4">
              {#each Array(6) as _, index}
                <div
                  class="flex animate-pulse flex-col gap-4 rounded-2xl border border-brs3 bg-bgs2/60 p-4 dp:flex-row dp:items-center dp:gap-6"
                  aria-hidden="true"
                >
                  <div class="h-40 w-full rounded-2xl bg-bgs3 dp:h-20 dp:w-20 dp:rounded-xl" />
                  <div class="flex flex-1 flex-col gap-3">
                    <div class="h-4 w-3/4 rounded-full bg-bgs3" />
                    <div class="h-3 w-1/2 rounded-full bg-bgs3" />
                    <div class="h-3 w-2/3 rounded-full bg-bgs3" />
                  </div>
                  <div class="flex w-full flex-col gap-2 dp:w-auto">
                    <div class="h-10 rounded-full bg-bgs3" />
                    <div class="h-10 rounded-full bg-bgs3 dp:w-10" />
                  </div>
                </div>
              {/each}
            </div>
          {:else if isError}
            <div class="flex h-full flex-col items-center justify-center gap-4 text-center text-fgs3">
              <Icon icon="warning" size={Size.lg} class="text-warning" />
              <div class="max-w-md text-b2 text-fgs1">{currentState.error ?? "We ran into a problem while searching."}</div>
              <button
                class="rounded-full border border-brs3 px-4 py-2 text-b3 text-fgs1 transition hover:border-aps1 hover:text-aps1"
                onclick={handleRetry}
              >
                Try again
              </button>
            </div>
          {:else if items.length === 0}
            <div class="flex h-full flex-col items-center justify-center gap-4 text-center text-fgs3">
              <Icon icon="search" size={Size.lg} class="text-fgs3" />
              <div class="text-b2 text-fgs1">
                No results for “{trimmedQuery}”. Try refining your keywords or switching categories.
              </div>
            </div>
          {:else}
            <div class="mb-4 flex flex-wrap items-center gap-2 text-b3 text-fgs3">
              <Icon icon="sparkles" size={Size.sm} class="text-aps1" />
              <span>
                {#if currentState.query}
                  Results for “{currentState.query}”{#if currentState.total > 0} · {currentState.total} found{/if}
                {:else}
                  Results
                {/if}
              </span>
            </div>
            <div class="flex flex-col gap-4 pb-4">
              {#each items as item (item.id)}
                {#if item}
                  <div class="flex flex-col gap-4 rounded-2xl border border-brs3 bg-bgs2/60 p-4 transition hover:border-aps1 dp:flex-row dp:items-center dp:gap-6">
                    <div class="h-40 w-full overflow-hidden rounded-2xl bg-bgs3 dp:h-20 dp:w-20 dp:rounded-xl">
                      {#if item.thumbnailUrl && item.thumbnailUrl.startsWith("https://")}
                        <img src={item.thumbnailUrl} alt={item.title} class="h-full w-full object-cover" loading="lazy" referrerpolicy="no-referrer" />
                      {:else}
                        <div class="flex h-full w-full items-center justify-center text-b3 text-fgs3 uppercase">
                          {initials(item.title)}
                        </div>
                      {/if}
                    </div>
                    <div class="flex flex-1 flex-col gap-3">
                      <div class="flex flex-wrap items-center gap-2">
                        <div class="text-b1 font-semibold text-fgs1">{item.title}</div>
                        {#if resolveMeta(item)}
                          <span class="rounded-full bg-bgs3 px-2 py-0.5 text-caption text-fgs3">{resolveMeta(item)}</span>
                        {/if}
                      </div>
                      {#if item.subtitle}
                        <div class="text-b3 text-fgs3">{item.subtitle}</div>
                      {/if}
                      {#if item.description}
                        <div class="line-clamp-2 text-caption text-fgs4">{item.description}</div>
                      {/if}
                      {#if item.tags?.length}
                        <div class="flex flex-wrap gap-2">
                          {#each item.tags.slice(0, 6) as tag}
                            <span class="rounded-full bg-bgs3 px-2 py-0.5 text-caption text-fgs3">{tag}</span>
                          {/each}
                        </div>
                      {/if}
                    </div>
                    <div class="flex w-full flex-col items-stretch gap-2 dp:w-auto dp:flex-row dp:items-center">
                      <button
                        class="w-full rounded-full bg-aps1 px-5 py-2 text-sm font-medium text-bgs1 transition hover:bg-aps2 dp:w-auto"
                        onclick={() => addItem(item)}
                      >
                        Add
                      </button>
                      <button
                        class="flex h-10 w-full items-center justify-center rounded-full border border-brs3 text-fgs3 transition hover:border-aps1 hover:text-aps1 dp:h-10 dp:w-10"
                        onclick={() => onPreview?.({ item, tab: activeTab })}
                      >
                        <Icon icon="link" size={Size.sm} />
                      </button>
                    </div>
                  </div>
                {/if}
              {/each}
            </div>
          {/if}
        </section>
      </div>
    </div>
  </div>
{/if}
