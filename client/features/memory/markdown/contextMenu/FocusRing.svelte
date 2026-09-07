<script lang="ts">
  import { cn } from "@21n/utils/ui.utils";
  let {
    isFocusing = false,
    isHint = false,
    onclick = undefined
  }: {
    isFocusing?: boolean;
    isHint?: boolean;
    onclick?: ((event: MouseEvent) => void) | undefined;
  } = $props();
</script>

{#if isHint}
  <button class="h-3 w-3 rounded-full border-2 border-dotted border-fgs4"
  ></button>
{:else}
  <button
    class={cn(
      "h-4 w-4 rounded-full border-2 border-dotted hover:border-aps1 hover:border-2 hover:border-solid",
      {
        "border-aps1": isFocusing,
        "border-fgs3": !isFocusing
      }
    )}
    onclick={(event) => {
      event.stopPropagation();
      onclick?.(event);
    }}
  />
{/if}
