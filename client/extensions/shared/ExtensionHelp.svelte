<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import Text from "@21n/elements/text/Text.svelte";
  import { TextStyle } from "@21n/types/text.enum";
  import HelpItem from "@nucleum/extensions/shared/HelpItem.svelte";

  let {
    onClose = undefined,
    onResync = undefined
  }: {
    onClose?: (() => void) | undefined;
    onResync?: (() => void) | undefined;
  } = $props();

  function openDiscord() {
    const discordUrl = "https://discord.com/invite/9HJqKYTZKg";
    window.open(discordUrl, "_blank", "noopener,noreferrer");
  }
  function openDocs(path: string) {
    window.open(`https://docs.memotron.app/${path}`, "_blank");
  }

  const helpItems: {
    label: string;
    icon: string;
    isAwayAction?: boolean;
    callback: () => void;
  }[] = [
    {
      label: "Resync data",
      icon: "reload",
      callback: () => {
        onResync?.();
      }
    },
    {
      label: "Go to docs",
      icon: "book",
      isAwayAction: true,
      callback: () => openDocs("")
    },
    {
      label: "See what's new",
      icon: "sparkle",
      isAwayAction: true,
      callback: () => openDocs("changelog/clipper/new")
    },
    {
      label: "Leave feedback",
      icon: "chat",
      isAwayAction: true,
      callback: openDiscord
    },
    {
      label: "Join our Discord",
      icon: "discord",
      isAwayAction: true,
      callback: openDiscord
    }
  ];
</script>

<div class="h-full w-full flex flex-col items-center gap-8 p-4">
  <div class="flex justify-between w-full">
    <Text content="Help center" style={TextStyle.PANEL_HEADING} />
    <Button
      icon="cross"
      onclick={() => {
        onClose?.();
      }}
    />
  </div>
  <div
    class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2 w-full overflow-y-auto"
  >
    {#each helpItems as item}
      <HelpItem {...item} onclick={() => item.callback()} />
    {/each}
  </div>
  <div class="text-fgs3 text-b2 w-full flex justify-center">
    You can also email us at&nbsp;
    <a href="mailto:hello@21n.org" class="text-aps1">hello@21n.org</a>
  </div>
  <div class="flex flex-col items-center gap-1 mt-auto text-fgs3 text-b3">
    <div>Memotron clipper v0.58.2</div>
    <div>Last updated: Oct 13, 2025</div>
  </div>
</div>
