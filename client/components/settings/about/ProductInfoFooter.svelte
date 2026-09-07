<svelte:options runes={true} />

<script lang="ts">
  import { cn } from "@21n/utils/ui.utils";
  import AppNameWithVersion from "@nucleum/components/settings/about/AppNameWithVersion.svelte";
  import BlankLabsFooter from "@nucleum/components/settings/about/BlankLabsFooter.svelte";
  import SystemStatus from "@nucleum/components/settings/about/SystemStatus.svelte";
  let {
    isHideAppVersion = false,
    isComingSoon = false,
    isShowSystemStatus = false
  }: {
    isHideAppVersion?: boolean;
    isComingSoon?: boolean;
    isShowSystemStatus?: boolean;
  } = $props();
</script>

<div
  class={cn("flex items-center w-full pt-10", {
    "justify-between": isShowSystemStatus,
    "justify-center": !isShowSystemStatus
  })}
>
  <div
    class={cn("flex flex-col justify-center  text-fgs3 text-b3", {
      "items-start": isShowSystemStatus,
      "items-center": !isShowSystemStatus
    })}
  >
    <div class="flex justify-center text-b4">
      {#if !isHideAppVersion}
        <AppNameWithVersion />
      {/if}
    </div>
    <BlankLabsFooter {isComingSoon} />
  </div>
  {#if isShowSystemStatus}
    <SystemStatus />
  {/if}
</div>
