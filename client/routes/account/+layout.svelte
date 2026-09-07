<svelte:options runes={true} />

<script lang="ts">
  import type { Snippet } from "svelte";
  import AccountLayout from "@nucleum/components/account/AccountLayout.svelte";

  let { children }: { children?: Snippet } = $props();
</script>

<AccountLayout>
  {@render children?.()}
</AccountLayout>
