<script lang="ts">
  import { activeSession } from "@nucleum/features/focus/session.store";
  import IntervalBarItem from "@nucleum/features/focus/elements/intervalbar/IntervalBarItem.svelte";
  import { SessionType } from "@nucleum/features/focus/logs/log.type";
  import {
    generateIntervalsFromComposition,
    getTotalsFromComposition
  } from "@nucleum/features/focus/composition.utils";
  import {
    SessionCompositionType,
    type SessionComposition
  } from "@21n/types/pointron/sessionComposition.type";
  import {
    BlockType,
    SessionUIContext,
    type ISessionInterval
  } from "@21n/types/pointron/session.type";
  import TimeLabel from "@nucleum/features/focus/elements/intervalbar/TimeLabel.svelte";
  import view from "@nucleum/stores/view.store";
  import MoreBarsInfo from "@nucleum/features/focus/elements/intervalbar/MoreBarsInfo.svelte";
  import { SessionState } from "@21n/types/pointron/sessionState.enum";
  let {
    context = SessionUIContext.DEFAULT,
    composition = undefined
  }: { context?: SessionUIContext; composition?: SessionComposition } =
    $props();
  let preceedingHiddenBars: ISessionInterval[] = [];
  let succeedingHiddenBars: ISessionInterval[] = [];
  function resolveCountupBarDuration(bar: ISessionInterval) {
    const barIndex = intervalBarState.intervals.findIndex((x) => x.id == bar.id);
    const endTime = intervalBarState.intervals[barIndex + 1]?.start;
    if (bar.start && barIndex > -1 && endTime) {
      return (endTime - bar.start) / 1000;
    } else if (bar.start) {
      return (Date.now() - bar.start) / 1000;
    } else {
      return bar.duration;
    }
  }
  let intervalBarState = $derived.by(() => {
    if (!composition) {
      return {
        composition: $activeSession.composition,
        intervals: $activeSession.intervals,
        plannedDuration: $activeSession.plannedDuration,
        type: $activeSession.type
      };
    }
    if (composition.type === SessionCompositionType.COUNTUP) {
      return resolveCountupIntervalBarState(composition);
    }
    const intervals = generateIntervalsFromComposition(composition, $activeSession.end);
    if (intervals.length === 0) return resolveCountupIntervalBarState(composition);
    return {
      composition,
      intervals,
      plannedDuration: getTotalsFromComposition({ intervals }).duration,
      type:
        intervals.length > 1
          ? SessionType.PREDEFINED_INTERVALS
          : SessionType.COUNTDOWN
    };
  });
  let visibleLimit = $derived($view.isPortrait ? 4 : 10);
  let isHideSomeBars = $derived(
    intervalBarState.intervals.length > visibleLimit
  );
  let visibleBars = $derived.by(() =>
    resolveVisibleBars(intervalBarState.intervals)
  );

  function resolveVisibleBars(blocks: ISessionInterval[]) {
    if (!isHideSomeBars || intervalBarState.type === SessionType.COUNTUP) {
      preceedingHiddenBars = [];
      succeedingHiddenBars = [];
      return blocks;
    }
    let barInProgressIndex = blocks.findIndex(
      (x) => x.progress != 1 && x.progress != 0
    );
    if (
      barInProgressIndex === -1 &&
      $activeSession.state === SessionState.NOT_STARTED
    ) {
      barInProgressIndex = Math.floor(blocks.length / 2);
    }

    const halfVisible = Math.floor(visibleLimit / 2);
    let startIndex = Math.max(0, barInProgressIndex - halfVisible);
    let endIndex = Math.min(blocks.length, startIndex + visibleLimit);

    if (endIndex === blocks.length) {
      startIndex = Math.max(0, endIndex - visibleLimit);
    }
    if (startIndex === 0) {
      endIndex = Math.min(blocks.length, visibleLimit);
    }

    preceedingHiddenBars = blocks.slice(0, startIndex);
    succeedingHiddenBars = blocks.slice(endIndex);
    return blocks.slice(startIndex, endIndex);
  }
  function resolveWidth(bar: ISessionInterval) {
    if (intervalBarState.type === SessionType.COUNTUP) {
      return (
        ($activeSession.totalElapsed
          ? (resolveCountupBarDuration(bar) ?? 0) / $activeSession.totalElapsed
          : 100) * 100
      );
    } else if (!isHideSomeBars)
      return ((bar?.duration ?? 0) / intervalBarState.plannedDuration) * 100;
    return (
      ((bar.duration ?? 0) /
        visibleBars.reduce((acc, cur) => acc + cur.duration, 0)) *
      80
    );
  }
  function resolveCountupIntervalBarState(composition: SessionComposition) {
    return {
      composition,
      intervals: [
        {
          id: "preview-countup",
          start: new Date().getTime(),
          duration: 0.0001,
          progress: 1,
          type: BlockType.FOCUS
        }
      ],
      plannedDuration: 0,
      type: SessionType.COUNTUP
    };
  }

  function resolveIntervalType(type: BlockType) {
    if (type === BlockType.FOCUS) return "focus";
    if (type === BlockType.BREAK) return "break";
    return "none";
  }
</script>

<div
  class="flex w-full gap-4 pt-4 items-center h-12 min-h-[3rem]"
  data-testid="interval-bar"
  data-composition-preview={composition ? "true" : "false"}
  data-session-type={intervalBarState.type}
  data-interval-count={intervalBarState.intervals.length}
  data-visible-interval-count={visibleBars.length}
>
  <TimeLabel
    label="start"
    {context}
    composition={intervalBarState.composition}
    plannedDuration={intervalBarState.plannedDuration}
    sessionType={intervalBarState.type}
  />
  <div class="flex flex-row items-center gap-3 mo:gap-1 w-full">
    {#if preceedingHiddenBars.length > 0}
      <MoreBarsInfo length={preceedingHiddenBars.length} />
    {/if}
    {#each visibleBars as bar, index}
      <div
        style="width: {resolveWidth(bar)}%"
        data-testid="interval-bar-item"
        data-interval-type={resolveIntervalType(bar.type)}
        data-duration={bar.duration}
        data-progress={bar.progress}
        data-visible-index={index}
      >
        <IntervalBarItem progress={bar?.progress} type={bar?.type} {context} />
      </div>
    {/each}
    {#if succeedingHiddenBars.length > 0}
      <MoreBarsInfo length={succeedingHiddenBars.length} />
    {/if}
  </div>
  <TimeLabel
    label="end"
    {context}
    composition={intervalBarState.composition}
    plannedDuration={intervalBarState.plannedDuration}
    sessionType={intervalBarState.type}
  />
</div>
