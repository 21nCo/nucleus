<script lang="ts">
  import { onMount } from "svelte";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { page } from "$app/stores";
  import view from "@nucleum/stores/view.store";
  import LibraryRecordsPane from "@nucleum/application/library/LibraryRecordsPane.svelte";
  import { AppSearchParam } from "@21n/types/appStore.type";
  import { isValidEnumValue } from "@21n/shared-utils/text.utils";
  import { GlobalEvent } from "@21n/types/event.enum";

  let { defaultResource = Resource.node }: { defaultResource?: Resource } =
    $props();

  let selectedResource = $state<Resource>(Resource.unknown);
  let recordsPaneRef = $state<LibraryRecordsPane | undefined>();

  $effect.pre(() => {
    if (!$view.isConstrainedWidth && selectedResource === Resource.unknown) {
      selectedResource = defaultResource;
    }
  });

  function syncSelectedResource(resourceParam?: string | null) {
    if (resourceParam && isValidEnumValue(resourceParam, Resource)) {
      selectedResource = resourceParam as Resource;
      return;
    }
    if (!resourceParam && $view.isConstrainedWidth) {
      selectedResource = Resource.unknown;
      return;
    }
    if (!$view.isConstrainedWidth && selectedResource === Resource.unknown) {
      selectedResource = defaultResource;
    }
  }

  onMount(() => {
    const syncFromWindow = () => {
      const resourceParam = new URL(window.location.href).searchParams.get(
        AppSearchParam.RESOURCE
      );
      syncSelectedResource(resourceParam);
    };
    const pageSub = page.subscribe(async (p) => {
      syncSelectedResource(p.url.searchParams.get(AppSearchParam.RESOURCE));
    });
    window.addEventListener(GlobalEvent.CUSTOM_NAVIGATION, syncFromWindow);
    window.addEventListener("popstate", syncFromWindow);
    syncFromWindow();
    return () => {
      pageSub();
      window.removeEventListener(GlobalEvent.CUSTOM_NAVIGATION, syncFromWindow);
      window.removeEventListener("popstate", syncFromWindow);
    };
  });
</script>

<div class="flex flex-col gap-4 w-full">
  {#key selectedResource}
    <LibraryRecordsPane
      resource={selectedResource}
      bind:this={recordsPaneRef}
    />
  {/key}
</div>
