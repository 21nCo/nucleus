<script lang="ts">
  import { tooltip } from "@nucleum/actions/popover.action";
  import { toasts } from "@nucleum/stores/notification.store";
  import { rgbToHex } from "@21n/utils/ui.utils";
  import { copyToClipboard } from "@21n/utils/utils";

  let { colors = [] }: { colors?: string[] | undefined } = $props();
</script>

<div class="flex flex-wrap gap-2 w-full items-start">
  {#if colors && colors.length > 0}
    {#each colors as color}
      {@const hex = rgbToHex(color)}
      <button
        class="w-8 h-8 border border-brs2 rounded-md"
        style={`background-color: ${color}`}
        aria-label={`Copy ${hex}`}
        use:tooltip={{
          text: hex
        }}
        onclick={() => {
          copyToClipboard(hex);
          toasts.success(`Copied ${hex} to clipboard!`);
        }}
      ></button>
    {/each}
  {:else}
    NA
  {/if}
</div>
