<script lang="ts">
  import Onboarding from "@nucleum/components/onboarding/Onboarding.svelte";
  import type { IOnboardingConfig } from "@nucleum/components/onboarding/onboarding.type";
  const config: IOnboardingConfig = {
    headline: "Welcome to your focus haven!",
    subline: "One click to reimagine your focus journey. ✨"
  };
</script>

<Onboarding {config} />
