<script lang="ts">
  import type { FormLabelInfoTooltip } from "@21n/elements/text/info.type";
  import { copyToClipboard } from "@21n/utils/utils";
  import Icon from "@21n/elements/Icon.svelte";
  import FormControlLabelWrapper from "@21n/elements/text/formLabel/FormControlLabelWrapper.svelte";
  import { bg, cn } from "@21n/utils/ui.utils";
    let {
    parentBackgroundIndex = 1,
    infoParams = undefined,
    label = "",
    text = "",
  }: {
    parentBackgroundIndex?: number;
    infoParams?: FormLabelInfoTooltip | undefined;
    label?: string;
    text?: string;
  } = $props();

  
  
  
  let copied = $state(false);
  const copyText = () => {
    copyToClipboard(text);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 1000);
  };
</script>

<FormControlLabelWrapper props={{ label, tooltip: infoParams }}>
  <button class="relative text-b2 cursor-pointer w-full" onclick={copyText}>
    <div
      class={cn(
        "flex justify-between w-full px-3 py-2 text-fgs3 rounded-md border-none outline-none",
        bg(parentBackgroundIndex)
      )}
    >
      {text}
      <Icon icon="copy" />
    </div>
    {#if copied}
      <div
        class="absolute top-0 right-0 w-full bg-bgs4 bg-opacity-90 h-full flex items-center justify-center rounded-md"
      >
        copied!
      </div>
    {/if}
  </button>
</FormControlLabelWrapper>
