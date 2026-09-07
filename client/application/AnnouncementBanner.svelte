<script lang="ts">
  import Link from "@21n/elements/text/Link.svelte";
  let {
    body,
    actionLabel = undefined,
    action = undefined
  }: {
    body: string;
    actionLabel?: string | undefined;
    action?: string | undefined;
  } = $props();
</script>

<div
  class="flex flex-wrap items-center justify-center gap-4 rounded-md px-8 py-2 outline outline-1 outline-a1 text-b2"
>
  <div class="flex-grow text-center">
    <span><b>New 🚀:</b></span>
    {body}
  </div>
  {#if action && actionLabel}
    <div class="font-bold underline">
      <Link label={actionLabel} href={action} />
    </div>
  {/if}
</div>
