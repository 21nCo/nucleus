<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import Icon from "@21n/elements/Icon.svelte";
  import view from "@nucleum/stores/view.store";
  import { ButtonStyle } from "@21n/elements/button/button.type";
  import { Size } from "@21n/elements/size.enum";

  let {
    currentStep,
    totalSteps,
    onBack,
    onSkip,
    onFinish
  }: {
    currentStep: number;
    totalSteps: number;
    onBack?: () => void;
    onSkip?: () => void;
    onFinish?: () => void;
  } = $props();
</script>

<div class="flex justify-between w-full">
  {#if currentStep > 0}
    {#if $view.isPortrait}
      <Icon onclick={onBack} icon="chevron-left" />
    {:else}
      <Button size={Size.sm} onclick={onBack} icon="back-sm">Back</Button>
    {/if}
  {/if}
  <div class="ml-auto">
    {#if $view.isPortrait && currentStep > 0}
      {#if currentStep !== totalSteps - 1}
        <Button onclick={onSkip} style={ButtonStyle.PLAIN}>Skip</Button>
      {:else}
        <Icon onclick={onFinish} icon="cross" />
      {/if}
    {/if}
  </div>
</div>
