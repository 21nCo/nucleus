<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import {
    nucleumDatafnStatus,
    pullDatafnNow,
    reconcileDatafnNow
  } from "@nucleum/datafn/datafn.store";
  import { stringify } from "@21n/shared-utils/json.utils";

  let isBusy = false;
  let errorMessage = "";

  async function run(action: "pull" | "reconcile") {
    isBusy = true;
    errorMessage = "";
    try {
      if (action === "pull") await pullDatafnNow();
      else await reconcileDatafnNow();
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "DataFn sync failed";
    } finally {
      isBusy = false;
    }
  }
</script>

<div class="w-full h-full flex flex-col gap-4 p-4 overflow-auto">
  <div class="flex items-center justify-between gap-3">
    <div>
      <div class="text-h4 font-medium">DataFn sync</div>
      <div class="text-b3 text-fgs2">{$nucleumDatafnStatus.status}</div>
    </div>
    <div class="flex gap-2">
      <Button
        label={isBusy ? "Running" : "Pull"}
        onclick={() => run("pull")}
        isDisabled={isBusy}
      />
      <Button
        label="Reconcile"
        onclick={() => run("reconcile")}
        isDisabled={isBusy}
      />
    </div>
  </div>
  {#if errorMessage}
    <div class="text-b3 text-red-500" role="alert">{errorMessage}</div>
  {/if}
  <pre
    class="text-b3 bg-bgs2 border border-brs3 rounded-md p-3 overflow-auto">{stringify(
      $nucleumDatafnStatus,
      { space: 2 }
    )}</pre>
</div>
