<script lang="ts">
  import PanelSwitcher from "@21n/elements/switcher/PanelSwitcher.svelte";
  import CopyableText from "@21n/elements/text/CopyableText.svelte";
  import { spaceInContext } from "@nucleum/features/spaces/space.store";
  import { PanelSwitcherStyle } from "@21n/types/switcher.enum";
  import { stripTablePrefix } from "@21n/shared-utils/text.utils";
  let { id }: { id: string } = $props();
  let docSlug = stripTablePrefix(id);
  let selected = "Access from web";
</script>

<PanelSwitcher
  items={["Access from web", "Use in code"]}
  bind:value={selected}
  style={PanelSwitcherStyle.BAR}
/>
{#if selected === "Access from web"}
  <CopyableText
    parentBackgroundIndex={1}
    text={(window.location.host ?? "") +
      "/d/" +
      ($spaceInContext.slug ?? "space") +
      "/" +
      docSlug}
    label="Document URL"
  />
{:else}
  <div class="flex flex-col items-start w-full gap-4">
    <span class="text-fgs2 text-b2">
      Use the below params after installing Gathery package.
    </span>
    <CopyableText text={$spaceInContext.id} label="Space ID" />
    <CopyableText text={docSlug} label="Document ID" />
  </div>
{/if}
