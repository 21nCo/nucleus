<script lang="ts">
  import { onDestroy, onMount, type Snippet } from "svelte";
  import Panel from "@21n/layout/paint/Panel.svelte";
  import { ButtonStyle } from "@21n/types/button.type";
  import { Arrangement } from "@21n/types/direction.enum";
  import { Size } from "@21n/types/size.enum";
  import { appStore } from "@nucleum/stores/app.store";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { page } from "$app/stores";
  import ResourceResolver from "@21n/layout/paint/ResourceResolver.svelte";
  import { resourceAction } from "@nucleum/datafn/resource.utils";
  import {
    ResourceAccessPoint,
    ResourceActionType,
    AccessMode,
    ResourceAccessPointState
  } from "@nucleum/datafn/resource.type";
  import { uiState } from "@nucleum/stores/uiState/uiState.store";
  import { isValidString } from "@21n/shared-utils/text.utils";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import { UIState } from "@nucleum/stores/uiState/uiState.type";
  import LibraryRecordsPane from "@nucleum/components/library/LibraryRecordsPane.svelte";
  import {
    isHideCreateAction,
    resolveResourceTooltip
  } from "@nucleum/components/library/library.utils";
  import ComponentShortcutListener from "@nucleum/components/shortcuts/ComponentShortcutListener.svelte";
  import ComponentEmbedLayer from "@21n/layout/layers/ComponentEmbedLayer.svelte";
  import { AppSearchParam } from "@21n/types/appStore.type";
  import view from "@nucleum/stores/view.store";
  import { Display } from "@21n/types/view.type";
  import { bulkEditStore } from "@nucleum/components/record/bulkedit.store";
  import { PointronAction } from "@21n/types/pointron/pointronAction.enum";
  import { Action } from "@21n/types/action.enum";
  let {
    resource,
    onBack = undefined,
    isPreventCwPadding = false,
    right: rightSnippet = undefined
  }: {
    resource: Resource;
    onBack?: (() => void) | undefined;
    isPreventCwPadding?: boolean;
    right?: Snippet | undefined;
  } = $props();
  let backPath = $derived($page.url.searchParams.get(AppSearchParam.RETURN_TO));
  let hasBack = $derived(onBack !== undefined || backPath !== null);

  let id = $derived($page.url.searchParams.get(AccessMode.INLINE));
  let arrangement: Arrangement = resolveArrangement();
  let selectionCount = 0;
  let bulkEditCountUnsub: (() => void) | undefined;

  async function addAction() {
    const action =
      resource === Resource.task
        ? PointronAction.CREATE_TASK_INLINE
        : resourceAction(resource, ResourceActionType.CREATE);
    appStore.runAction(action, {
      componentParams: {
        context: ResourceAccessPoint.BROWSER
      }
    });
  }

  let tooltip = $derived(resolveResourceTooltip(resource));
  let floatingButton = $derived(
    selectionCount > 0 || isHideCreateAction(resource)
      ? undefined
      : {
          label: "New " + resource,
          callback: addAction,
          icon: "plus",
          shortcut: Action.CREATE,
          style: ButtonStyle.OUTLINED
        }
  );

  let state: ResourceAccessPointState = ResourceAccessPointState.DEFAULT;

  function resolveArrangement() {
    return (
      uiState?.getResourceState(
        resource,
        ResourceAccessPoint.BROWSER,
        UIState.arrangement
      ) ?? Arrangement.LIST
    );
  }

  function determineExpansionType(resource: Resource) {
    if (resource === Resource.relation) return true;
    return false;
  }

  function determineSize(resource: Resource) {
    if (resource === Resource.task) return Size.xl;
    else if ($view.display === Display.TP) return Size.sm;
    return Size.md;
  }

  onMount(() => {
    bulkEditCountUnsub = bulkEditStore.count.subscribe((count) => {
      const state = bulkEditStore.getState();
      if (
        state.context &&
        state.context.resource === resource &&
        state.context.accessPoint === ResourceAccessPoint.BROWSER
      ) {
        selectionCount = count;
      } else {
        selectionCount = 0;
      }
    });
  });

  onDestroy(() => {
    if (bulkEditCountUnsub) bulkEditCountUnsub();
  });
</script>

{#key resource}
  <Panel
    floatingButton={hasBack && resource === Resource.node
      ? undefined
      : floatingButton}
    title={resource + "s"}
    isExpanded={determineExpansionType(resource)}
    onBack={() => {
      if (onBack) onBack();
      else if (backPath) appStore.gotoPath(backPath);
    }}
    info={tooltip ? { body: tooltip } : undefined}
    isShowBackButton={hasBack}
    panelSize={determineSize(resource)}
    {isPreventCwPadding}
  >
    {#snippet nonPadded()}
      <div class="relative flex flex-col gap-4 h-full overflow-auto pt-3">
        <LibraryRecordsPane
          {resource}
          {arrangement}
          accessPoint={ResourceAccessPoint.BROWSER}
          accessPointState={state}
          isConstrainedWidth={true}
        />
      </div>
    {/snippet}
    {#snippet right()}
      {#if rightSnippet}
        {@render rightSnippet?.()}
      {:else}
        {#key id}
          {#if id}
            <ResourceResolver {id} accessMode={AccessMode.INLINE} />
          {:else}
            <EmptyStatusView
              size={Size.lg}
              mainText="Nothing selected."
              subText={`Please select a ${resource} to view it here.`}
            />
          {/if}
        {/key}
      {/if}
    {/snippet}
  </Panel>
{/key}
{#if resource !== Resource.task}
  <ComponentShortcutListener
    shortcuts={[
      {
        shortcut: Action.CREATE,
        callback: addAction
      }
    ]}
  />
{/if}
<ComponentEmbedLayer isBackNavigable={true} />
