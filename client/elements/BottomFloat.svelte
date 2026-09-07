<script lang="ts">
  import type { Snippet } from "svelte";
  import { onMount, onDestroy } from "svelte";
  import { player } from "@nucleum/application/modal/modal.store";
  import view from "@nucleum/stores/view.store";
  import { cn } from "@21n/utils/ui.utils";
  import { generateRandomId } from "@21n/shared-utils/crypto.utils";
  let {
    margin = undefined,
    zIndex = "z-20",
    containerId = undefined,
    class: classList = "",
    children = undefined
  }: {
    margin?: string | undefined;
    zIndex?: string;
    containerId?: string | undefined;
    class?: string;
    children?: Snippet | undefined;
  } = $props();
  let isAppMenuHidden = $state(resolveIfAppMenuHidden());
  const fallbackContainerId = generateRandomId();
  let ref: HTMLElement;
  let portal: HTMLElement | undefined = undefined;
  const resolvedClassList = $derived(
    classList.includes("justify") ? classList : `${classList} justify-center`.trim()
  );

  onMount(() => {
    isAppMenuHidden = resolveIfAppMenuHidden();
    const finalContainerId = containerId || fallbackContainerId;
    if (finalContainerId && ref) {
      portal = document.createElement("div");
      portal.className = "bottomfloat-container";
      const container = document.getElementById(finalContainerId);
      if (container) {
        container.appendChild(portal);
        portal.appendChild(ref);
      }
    }
  });

  onDestroy(() => {
    const finalContainerId = containerId || fallbackContainerId;
    if (portal && finalContainerId) {
      const container = document.getElementById(finalContainerId);
      if (container && container.contains(portal)) {
        container.removeChild(portal);
      }
    }
  });

  function resolveIfAppMenuHidden() {
    return !document.getElementById("app-menu");
  }
</script>

<div id={fallbackContainerId} />
<div bind:this={ref}>
  <div
    class={cn(
      "bottomfloat absolute bottom-0 flex inset-x-0 mx-auto",
      zIndex && zIndex,
      margin && margin,
      !margin && {
        "mb-8": $view.isPortrait && isAppMenuHidden,
        "mb-[10.5rem]": $view.isPortrait && $player.isMiniOn,
        "mb-24": $view.isPortrait && !isAppMenuHidden,
        "mb-4": !$view.isPortrait
      },
      resolvedClassList
    )}
  >
    {@render children?.()}
  </div>
</div>
