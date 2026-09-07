<script lang="ts">
  import { isSameResource } from "@nucleum/datafn/resource.utils";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import Text from "@21n/elements/text/Text.svelte";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import { Layout } from "@21n/layout/layout-mode.type";
  import { Size } from "@21n/elements/size.enum";
  import { TextStyle } from "@21n/elements/text/text.enum";
  import { cn } from "@21n/utils/ui.utils";
  import QuickStartThumbnail from "@nucleum/features/focus/quickstart/QuickStartThumbnail.svelte";

  let {
    items: initialItems = [],
    layout,
    isInEditMode,
    title = undefined,
    emptyStatusText = undefined,
    onUnpin = undefined
  }: {
    items?: any[];
    layout: Layout;
    isInEditMode: boolean;
    title?: string;
    emptyStatusText?: string;
    onUnpin?: ((event: CustomEvent<IRecordId>) => void) | undefined;
  } = $props();
  let items = $state(initialItems);

  $effect(() => {
    items = initialItems;
  });

  function handleUnpin(e: CustomEvent<IRecordId>) {
    items = items.filter((x) => !isSameResource(x.id, e.detail));
    onUnpin?.(e);
  }
</script>

<div class="flex flex-col gap-2 w-full px-4">
  {#if title}
    <Text content={title} style={TextStyle.SECTION_HEADING} />
  {/if}
  {#if items.length > 0}
    <div
      class={cn("w-full", {
        "flex flex-col gap-3": layout === Layout.LIST,
        "grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))]":
          layout != Layout.LIST,
        "gap-2": layout != Layout.LIST && !isInEditMode,
        "gap-5 pt-4": isInEditMode
      })}
    >
      {#each items as item, index (item.id)}
        <QuickStartThumbnail
          {item}
          {layout}
          {isInEditMode}
          onUnpin={handleUnpin}
        />
      {/each}
    </div>
  {:else}
    <div class="flex w-full py-6">
      <EmptyStatusView size={Size.sm} subText={emptyStatusText} />
    </div>
  {/if}
</div>
