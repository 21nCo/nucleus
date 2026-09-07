<script lang="ts">
  import { nucleumDatafnStatus } from "@nucleum/datafn/datafn.store";
  import type { Resource } from "@nucleum/datafn/resource.enum";
  import InlineSyncingFeedbackBase from "@21n/elements/feedback/InlineSyncingFeedbackBase.svelte";

  let {
    resource,
    isShorter = false,
    text = undefined,
    padding = "",
    isDisableOutTransition = false
  }: {
    resource: Resource;
    isShorter?: boolean;
    text?: string | undefined;
    padding?: string;
    isDisableOutTransition?: boolean;
  } = $props();

  let currentResource = $state(resource);
  const isSyncing = $derived(
    Boolean(currentResource) &&
      ($nucleumDatafnStatus.status === "syncing" ||
        $nucleumDatafnStatus.status === "starting")
  );

  $effect(() => {
    currentResource = resource;
  });

  export function refresh(resourceParam?: Resource) {
    currentResource = resourceParam ?? resource;
  }
</script>

<InlineSyncingFeedbackBase
  {isShorter}
  {text}
  {padding}
  {isSyncing}
  {isDisableOutTransition}
/>
