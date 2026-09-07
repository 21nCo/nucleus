<script lang="ts">
  import Onboarding from "@nucleum/components/onboarding/Onboarding.svelte";
  import type { IOnboardingConfig } from "@nucleum/components/onboarding/onboarding.type";
  const config: IOnboardingConfig = {
    headline: "At last, your memory atlas!",
    subline: "One click to unlock your digital memory paradise. ✨🎉"
  };
</script>

<Onboarding {config} />
