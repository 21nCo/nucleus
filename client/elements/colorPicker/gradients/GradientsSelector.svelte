  <script lang="ts">
  import { cn } from "@21n/utils/ui.utils";
  import { gradientsList } from "@21n/elements/colorPicker/gradients/gradients";
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/elements/size.enum";
  let {
    value = "",
    onChange = undefined
  }: {
    value?: string;
    onChange?: ((value: string) => void) | undefined;
  } = $props();
  function handleGradientClick(id: string) {
    value = id;
    onChange?.(id);
  }
</script>

<div class="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-4">
  {#each gradientsList as gradient}
    <button
      class={cn("relative h-40 rounded-md", gradient.gradient, {})}
      onclick={() => handleGradientClick(gradient.id)}
    >
      {#if gradient.id === value}
        <div
          class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        >
          <Icon
            icon="check-circle"
            isFilled={true}
            size={Size.lg}
            class="text-fgs1 shadow-md rounded-full border border-fgs1"
          />
        </div>
      {/if}
    </button>
  {/each}
</div>
