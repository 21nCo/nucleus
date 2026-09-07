<svelte:options runes={true} />

<script lang="ts">
  import type { Snippet } from "svelte";
  import { appLoadingState } from "@nucleum/stores/app.store";
  import context from "@nucleum/stores/context.store";
  import MemotronNotifications from "@nucleum/products/memotron/base/MemotronNotifications.svelte";
  import UserBaseLayer from "@21n/layout/layers/UserBaseLayer.svelte";
  import MemoryBase from "@nucleum/products/memotron/base/MemoryBase.svelte";
  import TopNavLeftMenuItem from "@21n/layout/topNav/TopNavLeftMenuItem.svelte";
  import { resourceAction } from "@nucleum/datafn/resource.utils";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { ResourceActionType } from "@nucleum/datafn/resource.type";
  let { children }: { children?: Snippet } = $props();
  let isLiteMode = $state($context.isEmbed && $context.isSheet);

  async function onUserBaseLayerReady() {
    if (isLiteMode) return;
    $appLoadingState.isLocalLoaded = true;
  }
</script>

<UserBaseLayer onReady={onUserBaseLayerReady}>
  {#snippet topnav()}
    <div class="flex items-center h-full">
      <TopNavLeftMenuItem
        action={resourceAction(Resource.node, ResourceActionType.CREATE)}
      />
    </div>
  {/snippet}
  {@render children?.()}
  <MemotronNotifications />
</UserBaseLayer>
<MemoryBase />
