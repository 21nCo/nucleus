<script lang="ts">
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import type {
    ISessionLogThumb,
    ISessionThumb
  } from "@nucleum/features/focus/logs/log.type";
  import type { IRecordId } from "@21n/types/data.type";
  import { isSameResource } from "@nucleum/datafn/resource.utils";
  import ObjectiveFocusSessionThumbnail from "@nucleum/features/focus/goals/history/GoalFocusSessionThumbnail.svelte";
  import ScrollViewBottomSpacer from "@21n/layout/scrollView/ScrollViewBottomSpacer.svelte";
  import { toSvelteStore } from "@datafn/svelte";

  let {
    id,
    isIncludeSubObjectives = false
  }: {
    id: IRecordId;
    isIncludeSubObjectives?: boolean;
  } = $props();

  const objectiveStore = $derived.by(() =>
    toSvelteStore<{ id: IRecordId; children?: { id: IRecordId }[] }[]>(
      isIncludeSubObjectives
        ? datafn.objective.signal({
            select: ["id", "children.**"],
            filters: {
              id: id.toString()
            },
            limit: 1
          })
        : datafn.emptySignal([]),
      { initialData: [] }
    )
  );
  const objective = $derived.by(() =>
    $objectiveStore.data.find((objective) => isSameResource(objective.id, id))
  );
  const objectiveIds = $derived.by(() => {
    const ids = [id.toString()];
    if (isIncludeSubObjectives) {
      ids.push(
        ...((objective?.children ?? []).map((objective) =>
          objective.id.toString()
        ) ?? [])
      );
    }
    return ids;
  });
  const sessionLogStore = $derived.by(() =>
    toSvelteStore<ISessionLogThumb[]>(
      datafn.sessionLog.signal({
        select: ["sessionId", "task.*"],
        filters: {
          objectiveId: { $in: objectiveIds }
        }
      }),
      { initialData: [] }
    )
  );
  const sessionLogs = $derived($sessionLogStore.data);
  const sessionIds = $derived.by(() => [
    ...new Set(
      sessionLogs
        .map((log) => log.sessionId?.toString())
        .filter((sessionId): sessionId is string => Boolean(sessionId))
    )
  ]);
  const sessionStore = $derived.by(() =>
    toSvelteStore<ISessionThumb[]>(
      datafn.session.signal({
        filters: {
          id: { $in: sessionIds }
        }
      }),
      { initialData: [] }
    )
  );
  const sessions = $derived($sessionStore.data);
  const isLoading = $derived(
    $objectiveStore.loading ||
      $objectiveStore.refreshing ||
      $sessionLogStore.loading ||
      $sessionLogStore.refreshing ||
      $sessionStore.loading ||
      $sessionStore.refreshing
  );

  function groupSessionsByDay(sessions: ISessionThumb[]) {
    const groups = new Map<string, ISessionThumb[]>();

    sessions.forEach((session) => {
      const date = new Date(session.startUnix).toLocaleDateString();
      if (!groups.has(date)) {
        groups.set(date, []);
      }
      groups.get(date)?.push(session);
    });

    groups.forEach((logs) => {
      logs.sort(
        (a, b) =>
          new Date(b.startUnix).getTime() - new Date(a.startUnix).getTime()
      );
    });
    return Array.from(groups.entries()).sort(
      (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  }
</script>

<div class="flex flex-col w-full h-full gap-4 py-8 overflow-auto">
  {#if isLoading || sessionLogs.length === 0}
    <EmptyStatusView
      isLoadingState={isLoading}
      mainText="No focus sessions recorded yet"
    />
  {:else}
    <div class="relative flex flex-col gap-8 userdata">
      <div class="absolute left-[5.5px] -top-6 bottom-0 w-[2px] bg-bgs4" />

      {#each groupSessionsByDay(sessions) as [date, daySessions]}
        <div class="flex flex-col gap-6">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-bgs4 relative z-10" />
            <div class="text-b2 text-fgs3">
              {new Date(date).toLocaleDateString("en-US", {
                year: "numeric",
                weekday: "short",
                month: "long",
                day: "numeric"
              })}
            </div>
          </div>

          <div class="flex flex-col gap-4 ml-[5px]">
            {#each daySessions as session}
              <ObjectiveFocusSessionThumbnail
                objectiveId={id}
                {session}
                logs={sessionLogs.filter((x) =>
                  x.sessionId ? isSameResource(x.sessionId, session) : false
                )}
              />
            {/each}
          </div>
        </div>
      {/each}
      <ScrollViewBottomSpacer />
    </div>
  {/if}
</div>
