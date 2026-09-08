<script lang="ts">
  import { isValidArrayWithData } from "@21n/shared-utils/obj.utils";
  import LinkItems from "@nucleum/features/memory/common/linkbox/LinkItems.svelte";
  import LinkSearch from "@nucleum/features/memory/common/linkbox/LinkSearch.svelte";
  import { LinkType } from "@nucleum/datafn/link.type";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import { isSameResource } from "@nucleum/datafn/resource.utils";
  import type { IActiveCaptureStore } from "@nucleum/features/memory/capture/capture.store";
  import { cn } from "@21n/utils/ui.utils";
  let {
    captureStore,
    expand = $bindable(null),
    onLinked = undefined,
    onPropertyChange = undefined,
    onUnlinked = undefined
  }: {
    captureStore: IActiveCaptureStore;
    expand?: IRecordId | null;
    onLinked?: ((event: CustomEvent<any>) => void) | undefined;
    onPropertyChange?: ((event: CustomEvent<any>) => void) | undefined;
    onUnlinked?: ((event: CustomEvent<IRecordId>) => void) | undefined;
  } = $props();
  let link = $state("");
  let searchRef = $state<LinkSearch | undefined>(undefined);
  async function propagatePropertyChanges(e: CustomEvent) {
    if (!e.detail || !e.detail?.id || e.detail?.value === undefined) return;
    captureStore.updateProperty({
      id: e.detail.id,
      value: e.detail.value
    });
    onPropertyChange?.(e);
  }

  export function focus() {
    searchRef?.focus();
  }
  const hasLinks = $derived(isValidArrayWithData($captureStore.links));
</script>

<section
  class="flex flex-col gap-4 w-full bg--bgs2 border border-brs3 rounded-md p-2"
>
  <div
    class={cn({
      "px-1 pt-1": hasLinks
    })}
  >
    <LinkSearch
      accessPoint={ResourceAccessPoint.CAPTURE}
      searchQuery={link}
      onSelect={async (e) => {
        if (!e.detail.item) return;
        await captureStore.directLink(e.detail.item);
        link = "";
        const linkedEvent = new CustomEvent<any>("linked", {
          detail: e.detail.item
        });
        onLinked?.(linkedEvent);
      }}
      bind:this={searchRef}
    />
  </div>

  {#if hasLinks}
    <div class="flex flex-col gap-2 overflow-y-auto styledscroll">
      <LinkItems
        {expand}
        accessPoint={ResourceAccessPoint.CAPTURE}
        isExpandable={true}
        links={$captureStore.links
          ?.filter((x) => x.linkType !== LinkType.MENTION)
          ?.map((x) => x.to) ?? []}
        nodeId={$captureStore.nodeId}
        propertyValues={$captureStore.propertyValues}
        onUnlink={(e) => {
          if (expand && isSameResource(expand, e.detail)) {
            expand = null;
          }
          captureStore.removeDLink(e.detail);
          onUnlinked?.(e);
        }}
        onPropertyChange={propagatePropertyChanges}
      />
    </div>
  {/if}
</section>
