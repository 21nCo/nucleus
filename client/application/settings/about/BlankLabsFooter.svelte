<svelte:options runes={true} />

<script lang="ts">
  import TwentyOneNative from "@21n/branding/TwentyOneNative.svelte";
  let { isComingSoon = false }: { isComingSoon?: boolean } = $props();
</script>

<div class="flex items-center gap-1.5">
  <span class="-mb-0.5">
    {isComingSoon ? "In works at" : "Built at"}
  </span>

  <a href="https://21n.org" target="_blank" rel="noopener noreferrer">
    <div class="flex items-center gap-2">
      <TwentyOneNative />
    </div></a
  >
</div>
