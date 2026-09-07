<script lang="ts">
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import SettingsAsPageLayout from "@nucleum/application/settings/asPage/SettingsAsPageLayout.svelte";
  import ComponentResolver from "@21n/layout/paint/ComponentResolver.svelte";
  import { page } from "$app/stores";
  import view from "@nucleum/stores/view.store";
  import SettingsAsModal from "@nucleum/application/settings/SettingsAsModal.svelte";
  import { AppSearchParam } from "@21n/types/appStore.type";
  import { appStore } from "@nucleum/stores/app.store";
  import ComponentEmbedLayer from "@21n/layout/layers/ComponentEmbedLayer.svelte";
  const route = $derived($page.url.searchParams.get(AppSearchParam.SETTING));
  const backPath = $derived(
    $page.url.searchParams.get(AppSearchParam.RETURN_TO)
  );

  function handleBack() {
    if (backPath) appStore.gotoPath(backPath);
  }
</script>

{#if $view.isConstrainedWidth}
  <SettingsAsPageLayout
    isShowBackButton={backPath !== null}
    onBack={handleBack}
  >
    {#if route}
      <ComponentResolver path={route} />
    {:else}
      <EmptyStatusView
        subText="Please select an option from the left panel to get started"
      />
    {/if}
  </SettingsAsPageLayout>
{:else}
  <SettingsAsModal />
{/if}
<ComponentEmbedLayer isBackNavigable={true} />
