<script lang="ts">
  import { userPreferences } from "@nucleum/stores/preferences/user-preferences.store";
  import { formatDatetime } from "@21n/utils/time.utils";

  let { item }: { item: { action: string; timestamp: Date } } = $props();
</script>

<div class="flex w-full items-center justify-between">
  <span class="text-b2">{item.action}</span>
  <span class="text-b3 text-fgs3 text-opacity-70"
    >{formatDatetime($userPreferences, item.timestamp)}</span
  >
</div>
