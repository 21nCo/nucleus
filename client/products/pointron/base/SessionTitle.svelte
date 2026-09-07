<script lang="ts">
  import { SessionState } from "@nucleum/features/focus/sessionState.enum";
  import { TimeFormat } from "@21n/utils/time.type";

  import { formatSeconds } from "@21n/utils/time.utils";
  import { activeSession } from "@nucleum/features/focus/session.store";
  import { Product } from "@nucleum/client/config/product.type";
  import { resolveProductConfig } from "@nucleum/products/product.config";

  let { ctx = Product.NUCLEUM }: { ctx?: Product } = $props();
</script>

<svelte:head>
  {#if $activeSession.isSessionRunning}
    {#key $activeSession.timeElapsed}
      <title>
        {$activeSession.state === SessionState.FOCUS_RUNNING
          ? "Focus"
          : "Break"}: {formatSeconds(
          $activeSession.timeElapsed,
          TimeFormat.CLOCK
        )}
        - {resolveProductConfig(ctx).displayName}
      </title>
    {/key}
  {:else}
    <title>
      {resolveProductConfig(ctx).displayName} - {resolveProductConfig(ctx)
        .tagline}
    </title>
  {/if}
</svelte:head>

<div
  id="focusData"
  data-focus-active={$activeSession.isSessionRunning}
  data-focus-time-elapsed={$activeSession.timeElapsed}
  data-focus-state={$activeSession.state}
></div>
