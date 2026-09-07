<svelte:options runes={true} />

<script lang="ts">
  import { userPreferences } from "@nucleum/components/settings/userPreferences.store";
  import { onMount } from "svelte";
  import AnalyticsTags from "@21n/layout/layers/analytics/AnalyticsTags.svelte";
  let { isLanding = false }: { isLanding?: boolean } = $props();
  let isAnalyticsTagsMapped = $state(false);
  onMount(() => {
    if ($userPreferences?.isAnonymousAnalyticsEnabled || isLanding) {
      localStorage.removeItem("gaTag");
      localStorage.removeItem("clarityTag");
      const gaTag = import.meta.env.VITE_GA_TAG;
      const clarityTag = import.meta.env.VITE_CLARITY_TAG;
      if (gaTag) {
        localStorage.setItem("gaTag", gaTag);
      }
      if (clarityTag) {
        localStorage.setItem("clarityTag", clarityTag);
      }
      isAnalyticsTagsMapped = true;
    }
  });
</script>

{#if isAnalyticsTagsMapped}
  <AnalyticsTags />
{/if}
