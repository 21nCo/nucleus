<script lang="ts">
  import Onboarding from "@nucleum/application/onboarding/Onboarding.svelte";
  import type { IOnboardingConfig } from "@nucleum/application/onboarding/onboarding.type";
  const config: IOnboardingConfig = {
    headline: "Welcome to your focus haven!",
    subline: "One click to reimagine your focus journey. ✨"
  };
</script>

<Onboarding {config} />
