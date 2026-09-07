<svelte:options runes={true} />

<script lang="ts">
  import { appStore } from "@nucleum/stores/app.store";
  import { cn } from "@21n/utils/ui.utils";
  import { onMount } from "svelte";
  let status: "UP" | "HASISSUES" | "UNDERMAINTENANCE" | undefined =
    $state(undefined);
  let statusPageUrl: string | undefined = $state(
    $appStore.appData?.urls?.statusPage
  );
  onMount(async () => {
    if (!$appStore.appData?.urls?.systemStatusJson) return;
    const data = await fetch($appStore.appData?.urls?.systemStatusJson);
    if (!data || !data.ok) return;
    const json = await data.json();
    status = json.page?.status;
    if (!statusPageUrl) statusPageUrl = json.page?.url;
  });
  function resolveStatusLabel(status: string) {
    switch (status) {
      case "UP":
        return "All systems operational.";
      case "HASISSUES":
        return "System has issues";
      case "UNDERMAINTENANCE":
        return "System is under maintenance";
      default:
        return "Unknown system status";
    }
  }
</script>

<div>
  {#if status}
    <a
      class="flex items-center gap-2 border- border-brs3 px-4 py-1 rounded-md"
      href={statusPageUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span
        class={cn("w-3 h-3 rounded-full", {
          "bg-fgs1":
            status !== "UP" &&
            status !== "HASISSUES" &&
            status !== "UNDERMAINTENANCE",
          "bg-ags1": status === "UP",
          "bg-ars1": status === "HASISSUES",
          "bg-ass1": status === "UNDERMAINTENANCE"
        })}
      >
      </span>
      <span class="text-b3 text-fgs3">{resolveStatusLabel(status)}</span>
    </a>
  {:else if $appStore.appData?.urls?.systemStatusEmbed}
    <iframe
      title="System status"
      src={$appStore.appData?.urls?.systemStatusEmbed}
      width="230"
      height="61"
      frameBorder="0"
      scrolling="no"
      style="border: none;"
    >
    </iframe>
  {/if}
</div>
