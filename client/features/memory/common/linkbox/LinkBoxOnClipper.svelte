<script lang="ts">
  import { toolbarState } from "@nucleum/extensions/clipper/contentScripts/store";
  import { Placement } from "@21n/elements/direction.enum";
  import LinkSearch from "@nucleum/features/memory/common/linkbox/LinkSearch.svelte";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  let {
    onFocus = undefined,
    onLink = undefined
  }: {
    onFocus?: ((event: CustomEvent<void>) => void) | undefined;
    onLink?: ((event: CustomEvent<IRecordId>) => void) | undefined;
  } = $props();
  let searchQuery = $state("");
  let searchRef = $state<LinkSearch | undefined>(undefined);

  export function focus() {
    searchRef?.focus();
  }

  function handleLink(id: IRecordId) {
    const linkEvent = new CustomEvent<IRecordId>("link", {
      detail: id
    });
    onLink?.(linkEvent);
  }

  function handleFocus() {
    const focusEvent = new CustomEvent<void>("focus");
    onFocus?.(focusEvent);
  }
</script>

<LinkSearch
  accessPoint={ResourceAccessPoint.CLIPPER}
  bind:searchQuery
  bind:this={searchRef}
  resultsPlacement={$toolbarState.position === Placement.Bottom
    ? Placement.TopCenter
    : Placement.BottomCenter}
  onSelect={(e) => {
    if (e.detail?.item?.id) handleLink(e.detail?.item?.id);
    searchQuery = "";
  }}
  onFocus={handleFocus}
/>
