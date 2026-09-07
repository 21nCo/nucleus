<script lang="ts">
  import Onboarding from "@nucleum/application/onboarding/Onboarding.svelte";
  import type { IOnboardingConfig } from "@nucleum/application/onboarding/onboarding.type";
  const config: IOnboardingConfig = {
    headline: "At last, your memory atlas!",
    subline: "One click to unlock your digital memory paradise. ✨🎉"
  };
</script>

<Onboarding {config} />
