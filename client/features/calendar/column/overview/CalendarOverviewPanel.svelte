<script lang="ts">
  import ComingSoonView from "@21n/elements/ComingSoonView.svelte";
  import { appStore } from "@nucleum/stores/app.store";
  import { Product } from "@nucleum/client/config/product.type";
  import CalendarOverviewPanelNucleus from "@nucleum/features/calendar/column/overview/CalendarOverviewPanelNucleus.svelte";
  import CalendarOverviewPanelPointron from "@nucleum/features/calendar/column/overview/CalendarOverviewPanelPointron.svelte";

  let {
    date,
    isRewind = false
  }: {
    date: Date;
    isRewind?: boolean;
  } = $props();

  const product = $derived($appStore.product);
</script>

<div class="w-full h-full flex flex-grow">
  {#if product === Product.POINTRON}
    <CalendarOverviewPanelPointron {date} {isRewind} />
  {:else if product === Product.NUCLEUM}
    <CalendarOverviewPanelNucleus {date} {isRewind} />
  {:else}
    <ComingSoonView />
  {/if}
</div>
