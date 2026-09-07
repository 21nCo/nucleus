<script lang="ts">
  import {
    ActiveObjectiveStore,
    resolvePanelOptions,
    type IActiveObjectiveStore
  } from "@nucleum/features/focus/goals/goal.store";
  import PageLoadingPulse from "@21n/elements/feedback/animations/PageLoadingPulse.svelte";
  import {
    AccessMode,
    ResourceAccessPoint
  } from "@nucleum/datafn/resource.type";
  import ObjectiveTitleRow from "@nucleum/features/focus/goals/info/GoalTitleRow.svelte";
  import CustomColorPropagator from "@21n/elements/style/CustomColorPropagator.svelte";
  import { onDestroy, untrack } from "svelte";
  import { page } from "$app/stores";
  import { cn } from "@21n/utils/ui.utils";
  import appearance from "@nucleum/stores/appearance.store";
  import { AppSearchParam } from "@21n/types/appStore.type";
  import { type IInlineStatus } from "@21n/types/notification.type";
  import { Size } from "@21n/types/size.enum";
  import ResourceInlineCloseButton from "@21n/elements/button/ResourceInlineCloseButton.svelte";
  import ObjectivePanelSwitcher from "./GoalPanelSwitcher.svelte";
  import { resolvePanelParam } from "@nucleum/components/resource/panelParam.mixin";
  import { PanelSwitcherStyle } from "@21n/types/switcher.enum";
  import PanelSwitcher from "@21n/elements/switcher/PanelSwitcher.svelte";
  import ObjectivePanelContentResolver from "./GoalPanelContentResolver.svelte";
  import ObjectiveLeftPanel from "./GoalLeftPanel.svelte";
  import ScrollViewBottomSpacer from "@21n/layout/scrollView/ScrollViewBottomSpacer.svelte";
  import { ResourcePanelType } from "@nucleum/components/resource/resourcePanel.type";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import { ErrorMessage } from "@nucleum/components/error/error.type";
  import { getContext } from "svelte";
  import { readable, type Writable } from "svelte/store";
  import { Context } from "@21n/types/appStore.type";
  import type { IContainer } from "@21n/layout/layout.type";
  import { resolveMinWidth } from "@21n/layout/layout.utils";
  import { uiState } from "@nucleum/stores/uiState/uiState.store";
  import { UIState, UIStateScope } from "@nucleum/stores/uiState/uiState.type";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { toSvelteStore } from "@datafn/svelte";
  import { Resource } from "@nucleum/datafn/resource.enum";

  let {
    id,
    accessPoint = ResourceAccessPoint.SELF,
    accessMode = AccessMode.POP,
    status = $bindable()
  }: {
    id: string;
    accessPoint?: ResourceAccessPoint;
    accessMode?: AccessMode;
    status?: IInlineStatus | undefined;
  } = $props();

  const dev_isPanelSwitcherOnTop = false;

  const container =
    getContext<Writable<IContainer | undefined>>(Context.CONTAINER) ||
    readable(undefined);
  const objective: IActiveObjectiveStore = $derived(ActiveObjectiveStore.resolve(id));
  let isReady = $state(false);

  const isConstrainedWidth = $derived(
    ($container && $container.width < resolveMinWidth(2)) ?? false
  );
  const isThreeColumned = $derived(
    ($container && $container.width >= resolveMinWidth(3)) ?? false
  );

  const tabs = $derived(
    resolvePanelOptions($objective, { isConstrainedWidth, isThreeColumned })
  );

  $effect(() => {
    if (
      tabs &&
      $objective &&
      $objective.panel &&
      !tabs.find((tab) => tab.value === $objective.panel)
    ) {
      objective.switchPanel(tabs[0].value);
    }
  });

  onDestroy(() => {
    const latestAccessMode = $objective?.accessMode ?? accessMode;
    ActiveObjectiveStore.destroy(id, latestAccessMode);
  });

  function resolvePreviouslySelectedView() {
    const panelState = uiState.getState(UIState.objectivePanelSelection, {
      scope: UIStateScope.DEVICE,
      subVariables: [
        isConstrainedWidth?.toString(),
        isThreeColumned?.toString()
      ]
    });
    return panelState;
  }

  async function initialize() {
    const editSearchParam = $page.url.searchParams.get(AppSearchParam.EDIT);
    const linkSearchParam = $page.url.searchParams.get(AppSearchParam.LINK);
    const panel = resolvePanelParam(id, "Goal.svelte");
    await objective.init(accessMode, {
      isInEditMode: editSearchParam === "true",
      linkSearchParam: linkSearchParam ?? undefined,
      panel:
        panel ??
        resolvePreviouslySelectedView() ??
        (isThreeColumned
          ? ResourcePanelType.OVERVIEW
          : ResourcePanelType.DEFAULT)
    });
    isReady = true;
    return objective.afterInit();
  }

  let initPromise = $state<Promise<void>>(initialize());
  let previousParentValue: string | undefined = undefined;

  const parentStore = toSvelteStore<Array<{ parent?: unknown }>>(
    datafn.objective.signal({
      filters: { id },
      select: ["id", "parent"],
      limit: 1,
      metadata: {
        includeTrashed: true,
        includeArchived: true
      }
    }),
    { initialData: [] }
  );

  $effect(() => {
    const record = $parentStore.data[0];
    const parentValue = JSON.stringify(record?.parent ?? null);
    untrack(() => {
      if (previousParentValue === undefined) {
        previousParentValue = parentValue;
        return;
      }
      if (parentValue !== previousParentValue) {
        previousParentValue = parentValue;
        isReady = false;
        initPromise = initialize();
      }
    });
  });

  async function rearrangePanels(e: CustomEvent) {
    if (!Array.isArray(e.detail)) {
      return;
    }
    const items = e.detail;
    await objective.modify({
      uiState: {
        ...($objective.uiState ?? {}),
        tabsOrder: items
      }
    });
  }
</script>

<div class="flex w-full h-full overflow-auto">
  {#await initPromise}
    <EmptyStatusView isLoadingState={true} />
  {:then}
    <CustomColorPropagator
      class={cn("h-full w-full bg-gradient-to-br from-bgs1 via-bgs1", {
        "to-ccs5/50": $appearance?.colorScheme?.isDark,
        "to-ccs5": !$appearance?.colorScheme?.isDark
      })}
      color={$objective?.color ??
        ($objective?.parent ? $objective.parent?.[0]?.color : undefined)}
    >
      {#if !$objective || !isReady}
        <div class="w-full h-full p-4">
          <PageLoadingPulse />
        </div>
      {:else if $objective}
        <div class="flex w-full h-full overflow-auto">
          {#if !isConstrainedWidth}
            <aside
              class="flex flex-col gap-4 border-r border-brs2 w-96 2k:w-[35rem]"
            >
              <ObjectiveLeftPanel {objective} {isConstrainedWidth} bind:status />
            </aside>
          {/if}
          <ObjectivePanelSwitcher
            panels={tabs}
            {objective}
            {isConstrainedWidth}
            {isThreeColumned}
          />
          <main class="flex flex-col flex-1 overflow-auto">
            {#if isConstrainedWidth}
              <div
                class={cn(
                  "relative flex flex-col w-full overflow-auto gap-3 cw:bg-bgs2 otop:pt-12 shrink-0 border-b border-brs3",
                  {
                    "bg-bgs2 py-2": isConstrainedWidth
                  }
                )}
              >
                <ObjectiveTitleRow {objective} isConstrainedWidth={true} bind:status />
                {#if dev_isPanelSwitcherOnTop}
                  <div class="relative">
                    <PanelSwitcher
                      items={tabs}
                      style={PanelSwitcherStyle.BAR}
                      value={$objective.panel}
                      isExpandToFullWidth={true}
                      parentBgIndex={2}
                      isBgBar={true}
                      size={Size.sm}
                      isRearrangeableByDefault={true}
                      onRearrange={rearrangePanels}
                      onSwitch={(e) => {
                        objective.switchPanel(e.detail);
                      }}
                    >
                      {#snippet right()}
                        <div>
                          {#if $objective.accessMode === AccessMode.FULL && !isConstrainedWidth}
                            <ResourceInlineCloseButton
                              accessMode={$objective.accessMode}
                              parentBgIndex={2}
                              id={$objective.id}
                            />
                          {/if}
                        </div>
                      {/snippet}
                    </PanelSwitcher>
                    {#if isConstrainedWidth}
                      <div
                        class="w-10 bg-gradient-to-r from-bgs2/20 to-bgs2 absolute right-0 top-0 h-full"
                      ></div>
                    {/if}
                  </div>
                {/if}
              </div>
            {/if}
            <div
              class={cn("flex-1 overflow-auto", {
                "pt-4 w-full": isConstrainedWidth
              })}
            >
              <ObjectivePanelContentResolver
                {objective}
                {isConstrainedWidth}
                {isThreeColumned}
                bind:status
              />
              {#if isConstrainedWidth}
                <ScrollViewBottomSpacer />
              {/if}
            </div>
          </main>
        </div>
      {/if}
    </CustomColorPropagator>
  {:catch}
    <EmptyStatusView mainText={ErrorMessage.DEFAULT} />
  {/await}
</div>
