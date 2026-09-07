<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import type { IButtonParams } from "@21n/elements/button/button.type";
  import BottomFloat from "@21n/elements/BottomFloat.svelte";
  import FloatingButtonItem from "@21n/elements/button/floating/FloatingButtonItem.svelte";
  let {
    params,
    class: classList = ""
  }: {
    params: IButtonParams[];
    class?: string;
  } = $props();
</script>

<BottomFloat class={classList}>
  {#if params.length === 1}
    <Button
      {...params[0]}
      parentBgIndex={params[0].parentBgIndex}
      type={params[0].variant}
      onclick={async () => {
        if (params[0].callback) await params[0]?.callback();
      }}
    />
  {:else}
    {#each params as param, index}
      <FloatingButtonItem {param} {index} length={params.length} />
    {/each}
  {/if}
</BottomFloat>
