<script module lang="ts">
  const calendarNotesCreationPromises = new Map<string, Promise<void>>();

  async function ensureCalendarNotesCreated(
    id: string,
    create: () => Promise<void>
  ) {
    let pending = calendarNotesCreationPromises.get(id);
    if (!pending) {
      pending = create().finally(() => {
        calendarNotesCreationPromises.delete(id);
      });
      calendarNotesCreationPromises.set(id, pending);
    }
    await pending;
  }
</script>

<script lang="ts">
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import NodeContent from "@nucleum/features/memory/node/content/NodeContent.svelte";
  import {
    ActiveNodeStore,
    type IActiveNodeStore
  } from "@nucleum/features/memory/node/node.store";
  import { NodeType } from "@nucleum/features/memory/node/node.type";
  import type { TimeScaleUnit } from "@21n/types/time.type";
  import { onDestroy, onMount, setContext } from "svelte";
  import {
    AccessMode,
    ResourceAccessPoint
  } from "@nucleum/datafn/resource.type";
  import { resolveCalendarNotesId } from "@nucleum/features/calendar/calendar.utils";
  import { LoadingAnimationType } from "@21n/types/feedback.type";
  import { preferences } from "@nucleum/stores/preferences/preferences.store";
  import { ActiveCaptureStore } from "@nucleum/features/memory/capture/capture.store";
  import { Preference } from "@nucleum/stores/preferences/preferences.type";
  import type { IMarkdownTemplate } from "@nucleum/features/memory/markdown/md.type";
  import { Size } from "@21n/types/size.enum";
  import { page } from "$app/stores";
  import { Context } from "@21n/types/appStore.type";
  import { datafn, nucleumDatafnStatus } from "@nucleum/datafn/datafn.store";
  import { acquireDnDPage, appStore } from "@nucleum/stores/app.store";

  let {
    date,
    scale,
    mdId
  }: {
    date: Date;
    scale: TimeScaleUnit;
    mdId: string;
  } = $props();

  let node = $state<IActiveNodeStore | undefined>(undefined);
  const captureStore = ActiveCaptureStore.resolve(mdId);
  const isSyncing = $derived(
    $nucleumDatafnStatus.status === "syncing" ||
      $nucleumDatafnStatus.status === "starting"
  );
  const isFullScreenActive = $derived(
    $page.url?.searchParams?.get(AccessMode.POP) ===
      resolveCalendarNotesId(date, scale)
  );

  async function initialize(scaleParam: TimeScaleUnit) {
    if (isSyncing) return;
    const id = resolveCalendarNotesId(date, scaleParam);
    const result = await datafn.node.select(id, {
      select: ["id"],
      metadata: {
        includeTrashed: true,
        includeArchived: true
      }
    });
    const savedTemplate = preferences.resolve(Preference.NOTES_TEMPLATE, {
      subVariables: [scaleParam]
    });
    if (!result?.id) {
      if (isSyncing) return;
      await ensureCalendarNotesCreated(id, () =>
        captureStore.saveCalendarNotes({
          date,
          scale: scaleParam,
          template: savedTemplate as IMarkdownTemplate | undefined
        })
      );
    }
    node = ActiveNodeStore.resolve(id);
    const nodeInitResult = await node.init({
      accessMode: AccessMode.INLINE,
      accessPoint: ResourceAccessPoint.CALENDAR
    });
    if (nodeInitResult?.error) {
      throw new Error(nodeInitResult.error);
    }
    nodeContext.id = id;
  }

  const nodeContext = {
    id: $node?.id,
    contentType: NodeType.NODULAR_MARKDOWN
  };

  setContext(Context.NODE, nodeContext);

  let releaseDnDPage: (() => void) | undefined;

  onMount(() => {
    releaseDnDPage = acquireDnDPage();
  });

  onDestroy(() => {
    releaseDnDPage?.();
  });
</script>

{#if isSyncing || isFullScreenActive}
  <EmptyStatusView
    size={Size.sm}
    mainText="Temporarily unavailable."
    subText={isSyncing
      ? "Calendar notes are not available while sync is in progress."
      : "Calendar notes are hidden while full screen mode is active."}
  />
{:else}
  {#await initialize(scale)}
    <div class="flex items-center justify-center h-full mo:px-0 px-10 pt-6">
      <EmptyStatusView
        isLoadingState={true}
        loadingAnimation={LoadingAnimationType.PAGE_PULSE}
      />
    </div>
  {:then _}
    <div class="flex w-full h-full overflow-y-auto">
      {#if node}
        <NodeContent {node} {mdId} />
      {/if}
    </div>
  {:catch err}
    <EmptyStatusView
      mainText="Error loading calendar notes. Please try again after some time."
      subText="Something went wrong."
    />
  {/await}
{/if}
