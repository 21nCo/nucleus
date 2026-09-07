<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import ResourceResolver from "@21n/layout/paint/ResourceResolver.svelte";
  import { AccessMode } from "@nucleum/datafn/resource.type";
  import { initializeNucleumPublicLinkDatafn } from "@nucleum/datafn/datafn.store";

  let isReady = $state(false);
  let errorMessage = $state("");
  const recordId = $derived($page.url.searchParams.get("id") ?? "");
  const region = $derived($page.url.searchParams.get("region") ?? "insouth");

  onMount(async () => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get(
      "token"
    );
    if (!token || !recordId) {
      errorMessage = "This public link is incomplete.";
      return;
    }
    try {
      await initializeNucleumPublicLinkDatafn({ token, region });
      isReady = true;
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "Unable to open public link.";
    }
  });
</script>

<div class="w-full h-full bg-bgs1">
  {#if errorMessage}
    <EmptyStatusView
      mainText="Public link unavailable"
      subText={errorMessage}
    />
  {:else if !isReady}
    <EmptyStatusView isLoadingState={true} mainText="Opening public link..." />
  {:else}
    <ResourceResolver id={recordId} accessMode={AccessMode.INLINE} />
  {/if}
</div>
