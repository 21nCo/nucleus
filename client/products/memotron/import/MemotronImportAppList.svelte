<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import { Size } from "@21n/types/size.enum";
  import { ButtonStyle, ButtonVariant } from "@21n/types/button.type";
  import Text from "@21n/elements/text/Text.svelte";
  import { TextStyle } from "@21n/types/text.enum";
  import view from "@nucleum/stores/view.store";
  import { appStore } from "@nucleum/stores/app.store";
  import { ImportSource } from "@nucleum/products/memotron/import/data.type";
  import { MemotronAction } from "@nucleum/features/memory/memory-action.enum";
  import ExternalLogo from "@21n/branding/external/ExternalLogo.svelte";

  const availableImports = [
    {
      source: ImportSource.POCKET,
      name: "Pocket",
      description: "Import your saved bookmarks from Pocket as web page nodes",
      icon: "pocket",
      formats: ".zip file",
      isAvailable: true
    }
  ];

  function triggerImport(source: ImportSource) {
    appStore.runAction(MemotronAction.IMPORT_APP_DATA, {
      componentParams: { importSource: source }
    });
  }
</script>

<div class="flex flex-col gap-4">
  <Text style={TextStyle.PANEL_HEADING} content="Import from other apps" />

  <div class="grid gap-4 {$view.isPortrait ? 'grid-cols-1' : 'grid-cols-2'}">
    {#each availableImports as importApp}
      <div
        class="flex flex-col gap-3 p-4 border border-brs2 rounded-lg bg-bgs1"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 bg-bgs3 rounded-lg flex items-center justify-center"
          >
            <ExternalLogo provider={importApp.icon} />
          </div>
          <div class="flex-1">
            <div class="text-b2 text-fgs1 font-medium">{importApp.name}</div>
            <div class="text-b4 text-fgs3">Format: {importApp.formats}</div>
          </div>
        </div>

        <div class="text-b3 text-fgs2">{importApp.description}</div>

        <div class="flex justify-end">
          <Button
            size={Size.sm}
            type={ButtonVariant.PRIMARY}
            style={ButtonStyle.OUTLINED}
            isDisabled={!importApp.isAvailable}
            onclick={() => triggerImport(importApp.source)}
          >
            Import from {importApp.name}
          </Button>
        </div>
      </div>
    {/each}
  </div>

  <div class="text-b4 text-fgs3">
    More import sources coming soon. Have a request? Let us know on our Discord.
  </div>
</div>
