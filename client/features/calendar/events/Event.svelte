<script lang="ts">
  import { untrack } from "svelte";
  import DatePicker from "@21n/elements/datetime/DatePicker.svelte";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import TextArea from "@21n/elements/input/TextArea.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import RecordTrashBanner from "@nucleum/components/records/RecordTrashBanner.svelte";
  import type { ICalendarEvent } from "@nucleum/features/calendar/events/event.type";
  import {
    AccessMode,
    ResourceAccessPoint
  } from "@nucleum/datafn/resource.type";
  import { resolveTrashedAtDate } from "@nucleum/datafn/resource.utils";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { InputStyle } from "@21n/elements/input/input.type";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import { Orientation } from "@21n/elements/direction.enum";
  import { Size } from "@21n/elements/size.enum";
  import { toSvelteStore } from "@datafn/svelte";

  let {
    id,
    accessPoint = ResourceAccessPoint.SELF
  }: {
    id: IRecordId;
    accessPoint?: ResourceAccessPoint;
    accessMode?: AccessMode;
  } = $props();

  let event = $state<ICalendarEvent | undefined>(undefined);
  let label = $state("");
  let notes = $state("");
  let date = $state<Date | undefined>(undefined);
  const recordStore = $derived.by(() =>
    toSvelteStore<Partial<ICalendarEvent>[]>(
      datafn.event.signal({
        filters: { id },
        limit: 1,
        metadata: {
          includeTrashed: true,
          includeArchived: true
        }
      }),
      { initialData: [] }
    )
  );
  const isLoading = $derived($recordStore.loading);
  const trashedAt = $derived(resolveTrashedAtDate(event));

  function normalizeEventRecord<T extends Partial<ICalendarEvent>>(
    record: T
  ): T {
    const normalizedLabel = record.label ?? record.event ?? "New event";
    return {
      ...record,
      event: record.event ?? normalizedLabel,
      label: normalizedLabel,
      startUnix: record.startUnix ?? record.value?.startUnix,
      endUnix: record.endUnix ?? record.value?.endUnix
    };
  }

  $effect(() => {
    const record = $recordStore.data[0];
    if (record) {
      untrack(() => applyEventRecord(record as ICalendarEvent));
    }
  });

  function applyEventRecord(record: ICalendarEvent) {
    const normalized = normalizeEventRecord(record);
    event = normalized;
    label = normalized?.label ?? normalized?.event ?? "";
    notes = normalized?.value?.notes ?? "";
    date = normalized?.startUnix ? new Date(normalized.startUnix) : undefined;
  }

  async function persist() {
    if (!event?.id) return;
    const startUnix = date?.getTime();
    const previousStartUnix = event.startUnix ?? event.value?.startUnix;
    const previousEndUnix = event.endUnix ?? event.value?.endUnix;
    const duration =
      previousStartUnix != null && previousEndUnix != null
        ? previousEndUnix - previousStartUnix
        : 60 * 60 * 1000;
    const endUnix = startUnix == null ? undefined : startUnix + duration;
    await datafn.event.mutate({
      operation: "merge",
      id: event.id,
      record: normalizeEventRecord({
        id: event.id,
        label,
        event: label,
        startUnix,
        endUnix,
        value: {
          ...(event.value ?? {}),
          notes,
          startUnix,
          endUnix
        }
      }),
      context: accessPoint
    });
  }
</script>

{#if isLoading}
  <EmptyStatusView isLoadingState={true} mainText="Loading event..." />
{:else if !event}
  <EmptyStatusView mainText="Event not found." />
{:else}
  <div class="flex flex-col w-full h-full bg-bgs1">
    {#if trashedAt}
      <RecordTrashBanner
        deletedAt={trashedAt.toISOString()}
        onRestore={async () => {
          await datafn.event.mutate({
            operation: "restore",
            id,
            context: accessPoint
          });
        }}
      />
    {/if}
    <div class="flex flex-col gap-4 p-6 w-full max-w-2xl">
      <TextInput
        bind:value={label}
        label={{ label: "Event name", orientation: Orientation.Vertical }}
        style={InputStyle.PLAIN}
        size={Size.lg}
        onDebouncedChange={persist}
      />
      <DatePicker bind:date variant="inline-with-icon" onChange={persist} />
      <TextArea
        bind:value={notes}
        label={{ label: "Notes", orientation: Orientation.Vertical }}
        debouncedChangeCallback={persist}
      />
    </div>
  </div>
{/if}
