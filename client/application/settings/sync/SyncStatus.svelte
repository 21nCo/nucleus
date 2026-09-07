<script lang="ts">
  import { cn } from "@21n/utils/ui.utils";
  import { nucleumDatafnStatus } from "@nucleum/datafn/datafn.store";
  import { formatDatetime } from "@21n/utils/time.utils";
  import { userPreferences } from "@nucleum/stores/preferences/user-preferences.store";
  const status = $derived(
    $nucleumDatafnStatus.nucleumMode === "sync-direct"
      ? "DIRECT"
      : $nucleumDatafnStatus.pendingChanges > 0
        ? "PENDING"
        : "SYNCED"
  );
  const lastSyncedAt = $derived($nucleumDatafnStatus.lastSyncAt);
</script>

<div class="flex items-center gap-1 border- border-brs3 px-4 py-1 rounded-md">
  <span
    class={cn("w-3 h-3 rounded-full", {
      "bg-ags1": status === "SYNCED",
      "bg-ass1": status === "PENDING",
      "bg-aps1": status === "DIRECT"
    })}
  >
  </span>
  <span class="text-b3 text-fgs3"
    >{status === "SYNCED"
      ? "Synced"
      : status === "DIRECT"
        ? "Cloud direct"
        : `Pending ${$nucleumDatafnStatus.pendingChanges} items`}</span
  >
  {#if lastSyncedAt}
    <span class="text-b3 text-fgs3 text-end"
      >- Last synced at:
      {formatDatetime($userPreferences, new Date(lastSyncedAt))}</span
    >
  {/if}
</div>
