<script lang="ts">
  import Rating from "@nucleum/features/collections/properties/ratingProperty/Rating.svelte";
  import { InputStyle } from "@21n/elements/input/input.type";
  import EndText from "@nucleum/features/collections/properties/propertyConfig/EndText.svelte";
  let {
    avatar,
    value = $bindable(0),
    count = $bindable(5)
  }: {
    avatar: string;
    value?: number;
    count?: number;
  } = $props();
  let experimentalCountIncrementor = false;
</script>

<div class="flex items-center justify-between gap-1 h-full w-full">
  <span class="flex items-center gap-1 h-full">
    {#if experimentalCountIncrementor}
      <button
        onclick={() => {
          count = Math.max(3, count - 1);
        }}
        class="flex items-center h-full px-1 py-[0.06rem] rounded-full border border-brs3"
      >
        -
      </button>
    {/if}
    <Rating {avatar} {count} bind:value style={InputStyle.PLAIN} />
  </span>
  {#if experimentalCountIncrementor}
    <button
      onclick={() => {
        count = Math.min(10, count + 1);
      }}
      class="flex items-center h-full px-1 py-[0.06rem] rounded-full border border-brs3"
    >
      +
    </button>
  {/if}
  <EndText text="Preview" />
</div>
