<svelte:options runes={true} />

<script lang="ts">
  import { appStore } from "@nucleum/stores/app.store";
  import { onMount } from "svelte";
  import { CacheKey } from "@21n/layout/layers/cache/cache.type";
  let components = $state<any[]>([]);
  const globalCacheKeys: string[] = [CacheKey.CALENDAR_CACHE];

  onMount(() => {
    globalCacheKeys.forEach((key) => {
      const action = appStore.resolveAction(key);
      if (action) components = [...components, action];
    });
  });
</script>

<div>
  {#each components as item (item.action)}
    {@const Component = item.component}
    <Component {...item.componentParams} />
  {/each}
</div>
