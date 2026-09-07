<script lang="ts">
  import { onMount } from "svelte";
  import { fullPageLoadingScreen } from "@nucleum/stores/notification.store";

  onMount(() => {
    fullPageLoadingScreen.show("Finishing session...");
  });
</script>
