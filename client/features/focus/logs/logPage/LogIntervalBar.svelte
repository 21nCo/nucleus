<script lang="ts">
  import { userPreferences } from "@nucleum/stores/preferences/user-preferences.store";
  import view from "@nucleum/stores/view.store";
  import { isEmptyArray } from "@21n/shared-utils/obj.utils";
  import { formatTime } from "@21n/utils/time.utils";
  import IntervalBarItem from "@nucleum/features/focus/elements/intervalbar/IntervalBarItem.svelte";
  import type { ISessionInterval } from "@21n/types/pointron/session.type";
  import MoreBarsInfo from "@nucleum/features/focus/elements/intervalbar/MoreBarsInfo.svelte";

  let { log }: { log: any } = $props();
  let visibleLimit = $derived($view.isPortrait ? 6 : 12);
  let blockData = $derived.by(() => {
    let blocks: ISessionInterval[] = isEmptyArray(log.blocks)
      ? [{ duration: log.elapsed, type: 1, progress: 1 }]
      : log.blocks;
    let overFlowBlocks: ISessionInterval[] = [];

    if (blocks.length > visibleLimit) {
      overFlowBlocks = log.blocks.slice(visibleLimit);
      blocks = blocks.slice(0, visibleLimit);
    }

    return { blocks, overFlowBlocks };
  });
</script>

<div class="flex items-center gap-4 w-full">
  <div class="text-fgs2 min-w-fit {$view.isPortrait && 'text-b3'}">
    {formatTime($userPreferences, new Date(log.startUnix))}
  </div>
  <div class="flex flex-row items-center gap-3 w-full">
    {#each blockData.blocks as bar}
      <div
        style="width: {(log.elapsed
          ? (bar?.duration ?? 0) / log.elapsed
          : 100) * 100}%"
      >
        <IntervalBarItem progress={bar?.progress} type={bar?.type} />
      </div>
    {/each}
    {#if blockData.overFlowBlocks.length > 0}
      <MoreBarsInfo length={blockData.overFlowBlocks.length} />
    {/if}
  </div>
  <div class="text-fgs2 min-w-fit {$view.isPortrait && 'text-b3'}">
    {formatTime($userPreferences, new Date(log.plannedEndUnix ?? log.endUnix))}
  </div>
</div>
