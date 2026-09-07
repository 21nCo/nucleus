<script lang="ts">
  import DayTimelineCore from "./DayTimelineCore.svelte";
  import { isValidArrayWithData } from "@21n/shared-utils/obj.utils";
  import type {
    CalendarColumnLayout,
    CalendarTimelineEntry
  } from "@nucleum/features/calendar/calendar.type";
  import type { ISessionThumb } from "@nucleum/features/focus/logs/log.type";
  import { resolveSessionTimeSplit } from "@nucleum/products/pointron/pointron.utils";
  import type { ICalendarEvent } from "@nucleum/features/calendar/events/event.type";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { time } from "@datafn/client";
  import { toSvelteStore } from "@datafn/svelte";
  import { resolveExpandedSessionItems } from "@nucleum/features/focus/logs/session-items.utils";
  import { resolveCalendarEventOverlapFilters } from "@nucleum/features/calendar/calendar.utils";

  let {
    date,
    isExpandable = false,
    layout
  }: {
    date: Date;
    isExpandable?: boolean;
    layout: CalendarColumnLayout;
  } = $props();

  const sessionStore = $derived.by(() =>
    toSvelteStore<ISessionThumb[]>(
      datafn.session.signal({
        select: ["*", "items.*#"],
        temporal: time.day("startUnix", date),
        sort: ["startUnix"]
      }),
      { initialData: [] }
    )
  );
  const eventStore = $derived.by(() =>
    toSvelteStore<ICalendarEvent[]>(
      datafn.event.signal({
        filters: resolveCalendarEventOverlapFilters(
          datafn.temporal.resolveRangeSync({ scale: "day", at: date })
        ),
        sort: ["startUnix"]
      }),
      { initialData: [] }
    )
  );
  const timelineEntries = $derived(
    [
      ...resolveFocusEntries($sessionStore.data),
      ...resolveEventEntries($eventStore.data)
    ].sort((a, b) => a.startUnix - b.startUnix)
  );
  const isLoading = $derived(
    $sessionStore.loading ||
      $sessionStore.refreshing ||
      $eventStore.loading ||
      $eventStore.refreshing
  );

  function resolveFocusEntries(sessionRecordsInput: ISessionThumb[]) {
    const sessions = sessionRecordsInput.map((session) => ({ ...session }));
    sessions.forEach((session) => {
      session.expandedItems = resolveExpandedSessionItems(session.items);
    });
    if (isValidArrayWithData(sessions)) {
      return sessions.map((session: ISessionThumb) => ({
        startUnix: session.startUnix,
        endUnix: session.endUnix,
        component: "focusTimelineEntry",
        item: {
          ...session,
          splits: resolveSessionTimeSplit(session)
        }
      }));
    }
    return [];
  }

  function resolveEventEntries(events: ICalendarEvent[]) {
    if (isValidArrayWithData(events)) {
      return events.map((event: ICalendarEvent) => {
        const startUnix =
          event.startUnix ?? event.value?.startUnix ?? date.getTime();
        const endUnix =
          event.endUnix ?? event.value?.endUnix ?? startUnix + 60 * 60 * 1000;
        return {
          startUnix,
          endUnix,
          item: {
            ...event,
            label: event.label ?? event.event ?? "New event",
            event: event.event ?? event.label ?? "New event"
          }
        };
      });
    }
    return [];
  }
</script>

<DayTimelineCore
  {date}
  data={timelineEntries}
  {layout}
  isRefreshing={isLoading}
/>
