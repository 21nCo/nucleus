<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import {
    nucleumDatafnStatus,
    refreshNucleumDatafnStatus
  } from "@nucleum/datafn/datafn.store";
  import { stringify } from "@21n/shared-utils/json.utils";

  let isRefreshing = false;

  async function refresh() {
    isRefreshing = true;
    try {
      await refreshNucleumDatafnStatus();
    } finally {
      isRefreshing = false;
    }
  }
</script>

<div class="w-full h-full flex flex-col gap-4 p-4 overflow-auto">
  <div class="flex items-center justify-between gap-3">
    <div>
      <div class="text-h4 font-medium">DataFn local data</div>
      <div class="text-b3 text-fgs2">
        {$nucleumDatafnStatus.storageDbName ?? "Not initialized"}
      </div>
    </div>
    <Button label={isRefreshing ? "Refreshing" : "Refresh"} onclick={refresh} />
  </div>
  <pre
    class="text-b3 bg-bgs2 border border-brs3 rounded-md p-3 overflow-auto">{stringify(
      $nucleumDatafnStatus,
      { space: 2 }
    )}</pre>
</div>
