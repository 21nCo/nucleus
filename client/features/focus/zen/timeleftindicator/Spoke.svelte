<script lang="ts">
  import { formatSeconds } from "@21n/utils/time.utils";
  import { onMount } from "svelte";

  let {
    value,
    previousStop,
    parentBgIndex = 1,
    timeRemaining,
    isMajorStop = false
  }: {
    value: number;
    previousStop: number;
    parentBgIndex?: number;
    timeRemaining: number;
    isMajorStop?: boolean;
  } = $props();
  let markerRef: any;
  let activeMarkerRef: any;
  let leftOffset: number;
  let activeMarkerLeftOffset: number;
  let isShowActiveStop: boolean = false;
  /**
   * isActiveStop is true if the current time remaining is between the previous stop and the current stop i.e. the current stop is where time left indicator is
   */
  let isActiveStop = $derived(
    timeRemaining > previousStop && timeRemaining < value
  );
  $effect(() => {
    if (!isActiveStop) return;
    setTimeout(() => {
      refreshMarkerPositioning();
    }, 1);
  });
  onMount(() => {
    refreshMarkerPositioning();
  });
  function refreshMarkerPositioning() {
    if (markerRef) {
      let rect = markerRef.getBoundingClientRect();
      leftOffset = rect.width / 2;
    } else if (activeMarkerRef) {
      let rect = activeMarkerRef.getBoundingClientRect();
      activeMarkerLeftOffset = rect.width / 2;
      isShowActiveStop = true;
    }
  }
</script>

<div class="flex flex-col">
  <div class="relative">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="2"
      height={isMajorStop ? "21" : "14"}
      viewBox="0 0 2 21"
      fill="none"
    >
      <path
        d="M0.927734 1V20.0932"
        stroke-width="1.48566"
        stroke-linecap="round"
        class={timeRemaining > previousStop ? "stroke-fgs1" : "stroke-bgs4"}
      />
    </svg>
    {#if isActiveStop}
      <div
        class="absolute -bottom-6 text-b4 text-bgs2 z-20 flex justify-center min-w-max {isShowActiveStop
          ? 'opacity-100'
          : 'opacity-0'}"
        bind:this={activeMarkerRef}
        style="left: -{activeMarkerLeftOffset}px;"
      >
        <div
          class="h-4 w-4 {parentBgIndex === 1
            ? 'left-overlay-bgs1'
            : 'left-overlay-bgs2'}"
        />
        <div class="bg-fgs1 rounded-sm px-4">
          {formatSeconds(timeRemaining) + " left"}
        </div>

        <div
          class="h-4 w-4 {parentBgIndex === 1
            ? 'right-overlay-bgs1'
            : 'right-overlay-bgs2'}"
        />
      </div>
    {:else if isMajorStop}
      <div
        class="absolute -bottom-6 text-b4 z-10 min-w-max"
        bind:this={markerRef}
        style="left: -{leftOffset}px;"
      >
        {formatSeconds(value) ?? ""}
      </div>
    {:else}
      <!-- <div class="absolute -bottom-6 text-b4 z-10 min-w-max">
          {i}
        </div> -->
    {/if}
  </div>
</div>

<style>
  .right-overlay-bgs2 {
    background-image: linear-gradient(
      to right,
      rgba(var(--colors-bgs2), var(--tw-bg-opacity)) 0%,
      rgba(var(--colors-bgs2), var(--tw-bg-opacity)) 50%,
      transparent 100%
    );
  }
  .left-overlay-bgs2 {
    background-image: linear-gradient(
      to right,
      transparent 0%,
      rgba(var(--colors-bgs2), var(--tw-bg-opacity)) 50%,
      rgba(var(--colors-bgs2), var(--tw-bg-opacity)) 100%
    );
  }
  .right-overlay-bgs1 {
    background-image: linear-gradient(
      to right,
      rgba(var(--colors-bgs1), var(--tw-bg-opacity)) 0%,
      rgba(var(--colors-bgs1), var(--tw-bg-opacity)) 50%,
      transparent 100%
    );
  }
  .left-overlay-bgs1 {
    background-image: linear-gradient(
      to right,
      transparent 0%,
      rgba(var(--colors-bgs1), var(--tw-bg-opacity)) 50%,
      rgba(var(--colors-bgs1), var(--tw-bg-opacity)) 100%
    );
  }
</style>
