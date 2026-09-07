<script lang="ts">
  import { ActionType } from "@nucleum/application/commandBar/action.type";
  import { generateCmdType } from "@21n/utils/utils";
  import { renderMdAsHtml } from "@nucleum/features/memory/markdown/markdown.utils";
  import type { ICommandAction } from "@nucleum/application/commandBar/cmd.type";
  import ResultItem from "@nucleum/application/commandBar/ResultItem.svelte";
  let {
    search = "",
    action,
    isActive = false,
    index,
    onclick = void 0
  }: {
    search?: string;
    action: ICommandAction;
    isActive?: boolean;
    index: number;
    onclick?: (event: MouseEvent) => void;
  } = $props();

  const label = $derived.by(() =>
    search && action?.cmdLabel?.toLowerCase()?.includes(search.toLowerCase())
      ? action?.cmdLabel.replace(
          new RegExp(search, "gi"),
          (matched: string) => `**${matched}**`
        )
      : action?.cmdLabel
  );
</script>

<ResultItem {isActive} {index} {onclick}>
  <div class="flex min-w-0 flex-1">
    {#if action.type === ActionType.PAGE}
      Go to{#if search}&nbsp;{/if}
    {/if}
    <!-- {@html label} -->
    {@html renderMdAsHtml(label, {
      isIncludeSpaces: true
    })}
  </div>
  <div class="bg-bgs2 rounded-md text-b3 text-fgs2 px-2 py-1">
    {generateCmdType(action?.type)}
  </div>
</ResultItem>
