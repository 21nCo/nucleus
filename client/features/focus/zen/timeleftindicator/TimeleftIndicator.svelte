<script lang="ts">
  import { activeSession } from "@nucleum/features/focus/session.store";
  import { onMount } from "svelte";
  import Spoke from "@nucleum/features/focus/zen/timeleftindicator/Spoke.svelte";
  let { parentBgIndex = 1 }: { parentBgIndex?: number } = $props();
  let numberOfSpokes = 0;
  let minorStops = 6;
  let stopValueInSeconds = 0;
  let partValueInSeconds = 0;
  let arr: any[] = [];
  //1 part is the span between 2 major stops
  let desiredPartValues = [480, 240, 120, 60, 30, 15, 10, 5, 1];
  let desiredNumberOfParts = [3, 4, 5, 6];
  let majorStops: number[] = [];
  let timeRemaining = $derived(
    $activeSession.plannedDuration - $activeSession.totalElapsed
  );
  onMount(() => {
    // sessionStore.subscribe((x) => {
    //   refresh();
    // });
    refresh();
    // console.log({
    //   minorStops,
    //   stopValueInMinutes: stopValueInSeconds,
    //   partValueInMinutes: partValueInSeconds,
    //   numberOfSpokes,
    //   majorStops,
    //   arr
    // });
  });

  function refresh() {
    let plannedDurationInMinutes = $activeSession.plannedDuration / 60;
    let plannedDurationInHours = plannedDurationInMinutes / 60;
    let plannedDurationInSeconds = $activeSession.plannedDuration;
    if (plannedDurationInHours >= 3) {
      for (let i = 0; i < desiredNumberOfParts.length; i++) {
        if (
          plannedDurationInHours % desiredNumberOfParts[i] === 0 &&
          desiredPartValues.some(
            (x) => x === (plannedDurationInHours / desiredNumberOfParts[i]) * 60
          )
        ) {
          partValueInSeconds =
            (plannedDurationInHours * 60 * 60) / desiredNumberOfParts[i];
          for (let index = 0; index <= desiredNumberOfParts[i]; index++) {
            majorStops.push(index * partValueInSeconds);
          }
          break;
        }
      }
    } else if (plannedDurationInMinutes >= 3) {
      for (let i = 0; i < desiredNumberOfParts.length; i++) {
        if (
          plannedDurationInMinutes % desiredNumberOfParts[i] === 0 &&
          desiredPartValues.some(
            (x) => x === plannedDurationInMinutes / desiredNumberOfParts[i]
          )
        ) {
          partValueInSeconds =
            (plannedDurationInMinutes * 60) / desiredNumberOfParts[i];
          for (let index = 0; index <= desiredNumberOfParts[i]; index++) {
            majorStops.push(index * partValueInSeconds);
          }
          break;
        }
      }
    } else if (plannedDurationInSeconds >= 3) {
      stopValueInSeconds = 1;
      minorStops = 15;
      partValueInSeconds = stopValueInSeconds * minorStops;
      const numberOfParts = plannedDurationInSeconds / partValueInSeconds;
      for (let index = 0; index <= numberOfParts; index++) {
        majorStops.push(index * partValueInSeconds);
      }
    }
    if (partValueInSeconds === 0) {
      let numberOfParts = 4;
      if (plannedDurationInHours >= 3) {
        stopValueInSeconds =
          (+(plannedDurationInHours / numberOfParts).toFixed(0) / minorStops) *
          60 *
          60;
      } else if (plannedDurationInMinutes >= 3) {
        stopValueInSeconds =
          (+(plannedDurationInMinutes / numberOfParts).toFixed(0) /
            minorStops) *
          60;
      } else if (plannedDurationInSeconds >= 3) {
        stopValueInSeconds =
          +(plannedDurationInSeconds / numberOfParts).toFixed(0) / minorStops;
      }
      partValueInSeconds = stopValueInSeconds * minorStops;
      for (let index = 0; index <= numberOfParts; index++) {
        majorStops.push(index * partValueInSeconds);
      }
    } else {
      stopValueInSeconds = partValueInSeconds / minorStops;
    }
    if (stopValueInSeconds === 0) return;
    numberOfSpokes = plannedDurationInSeconds / stopValueInSeconds;
    let remainder =
      stopValueInSeconds > 1
        ? plannedDurationInSeconds % stopValueInSeconds
        : 0;
    //x = +numberOfSpokes.toFixed(0) + 1;
    arr = [];
    try {
      for (let i = 0; i <= numberOfSpokes; i++) {
        if (arr?.length < 0 || arr.length % 1 != 0) continue;
        arr.push(i * stopValueInSeconds);
      }
      if (remainder > 0 && arr?.length > 0) {
        arr.push(plannedDurationInSeconds);
      }
    } catch (error) {
      console.log({ error });
    }
  }
</script>

{#if arr && arr.length > 0}
  <div class="flex justify-between w-full items-end mt-8 max-w-xl">
    {#each arr as value, index}
      <Spoke
        {value}
        previousStop={arr[index - 1] ?? 0}
        {parentBgIndex}
        {timeRemaining}
        isMajorStop={majorStops.some((x) => x === value)}
      />
    {/each}
  </div>
{/if}
