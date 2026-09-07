<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import view from "@nucleum/stores/view.store";
  import { ButtonStyle } from "@21n/types/button.type";

  let {
    activeStep,
    totalSteps,
    onNext,
    onFinal
  }: {
    activeStep: number;
    totalSteps: number;
    onNext?: () => void;
    onFinal?: () => void;
  } = $props();
  let temp = $derived(Array.from({ length: totalSteps - 1 }, (_, i) => i + 1));
</script>

<div
  class={`flex gap-3 w-full flex-col items-center  ${
    $view.isPortrait ? `justify-center mt-auto` : `mr-auto`
  }`}
>
  {#if $view.isPortrait}
    <div class="button mb-4 w-full">
      {#if activeStep !== totalSteps - 1}
        <Button isExpandToFullWidth={true} onclick={onNext} type="primary">
          {#if activeStep === 0}
            Get Started
          {:else}
            Next
          {/if}
        </Button>
      {:else}
        <Button
          isExpandToFullWidth={true}
          onclick={onFinal}
          type="primary"
        >
          Let's go
        </Button>
      {/if}
    </div>
  {/if}
  <div class={`flex gap-3 justify-center`}>
    {#if activeStep > 0 && activeStep !== totalSteps - 1}
      {#each temp as step, index}
        <div
          class={`rounded-full transition-all duration-300 ease-out ${
            $view.isPortrait
              ? activeStep === index + 1
                ? `bg-aps1 w-[0.5rem] h-[0.5rem]`
                : `bg-fgs2 w-[0.5rem] h-[0.5rem]`
              : activeStep === index + 1
                ? `bg-aps1 w-[2.5rem] h-[0.5rem]`
                : `bg-fgs2 w-[0.5rem] h-[0.5rem]`
          }`}
        />
      {/each}
    {/if}
  </div>
</div>
