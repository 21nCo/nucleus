<script lang="ts">
  import { userPreferences } from "@nucleum/components/settings/userPreferences.store";
  import { currentTime } from "@nucleum/stores/app.store";
  import { formatDatetime } from "@21n/utils/time.utils";

</script>
<div class="h-full px-1.5 text-b3 text-fgs2 flex items-center hover:bg-bgs3-striped">
    {formatDatetime($userPreferences, $currentTime)}
</div>