<script lang="ts">
  import { renderMdAsHtml } from "@21n/elements/markdown/markdown.utils";
  import view from "@nucleum/stores/view.store";
  import { Size } from "@21n/elements/size.enum";
  import type { FormLabelInfoTooltip } from "@21n/elements/text/info.type";
  import { cn } from "@21n/utils/ui.utils";
  import Button from "@21n/elements/button/Button.svelte";
  import Icon from "@21n/elements/Icon.svelte";
    let {
    tooltip = undefined,
    info = undefined,
    variant = "v1",
    onClose = () => {},
  }: {
    tooltip?: string | undefined;
    info?: FormLabelInfoTooltip | undefined;
    variant?: "v1" | "v2";
    onClose?: () => void;
  } = $props();

  
  
  
</script>

{#if variant === "v1" && info}
  <div
    class={cn("text-left text-b2 rounded-md p-4 text-wrap", {
      "h-48 text-fgs2": $view.isConstrainedWidth,
      "bg-fgs2 text-bgs1 shadow-md min-w-[25rem] max-w-sm":
        !$view.isConstrainedWidth
    })}
  >
    <div class="flex flex-col gap-2">
      {#if $view.isConstrainedWidth}
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-1 text-fgs3">
            <Icon icon="info" size={Size.sm} class="text-fgs3" />
            <span class="text-b2 font-medium"> Information </span>
          </div>
          <Button icon="cross" size={Size.sm} onclick={onClose} />
        </div>
      {/if}
      <div>
        {@html renderMdAsHtml(info.body)}
      </div>
      {#if info.link}
        <a
          class="text-b4 font-medium text-aps1 hover:opacity-80"
          href={info.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          {info.linkText ?? "Learn more"}
        </a>
      {/if}
    </div>
  </div>
{:else}
  <div
    class={cn("min-w-fit whitespace-nowrap text-b3 rounded-md z-30 px-4 py-1", {
      "bg-bgs2 text-fgs2": $view.isConstrainedWidth,
      "bg-fgs2 text-bgs1": !$view.isConstrainedWidth
    })}
  >
    {tooltip ?? info?.body}
  </div>
{/if}
