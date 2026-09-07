<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import Button from "@21n/elements/button/Button.svelte";
  import { toasts } from "@nucleum/stores/notification.store";
  import { ButtonVariant } from "@21n/types/button.type";
  import { Size } from "@21n/types/size.enum";
  import InlineInfoBanner from "@21n/elements/text/InlineInfoBanner.svelte";
  import { parse } from "@21n/shared-utils/json.utils";
  import {
    datafn,
    datafnRuntime,
    refreshNucleumDatafnStatus
  } from "@nucleum/datafn/datafn.store";
  import { lastImportTime } from "@nucleum/products/pointron/pointron.store";
  import {
    isPointronDatafnBackup,
    resolveDatafnImportErrorCount
  } from "@nucleum/products/pointron/settings/data/pointronDatafnBackup.utils";
  import { logger } from "@nucleum/components/debug/logger.client";

  let fileInput: HTMLInputElement;
  let isProcessingImport: boolean = false;
  let fileName: string = "";
  let jsonData: unknown;

  async function importData() {
    if (!fileInput.files) return;
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = event.target?.result;
        if (!importedData) return;
        const parsedData = parse(importedData as string);
        if (!isPointronDatafnBackup(parsedData)) {
          resetFile();
          toasts.error("Invalid Pointron DataFn backup file");
          return;
        }
        jsonData = parsedData;
        fileName = file.name;
      } catch (error) {
        logger.error({ at: "PointronImportData.importData.parse", error });
        isProcessingImport = false;
        toasts.error("Invalid file selected");
      }
    };
    reader.readAsText(file);
  }
  async function processImport() {
    if (isProcessingImport) return;
    if (!$datafnRuntime?.storage) {
      toasts.error("Pointron import is not available in cloud direct mode");
      return;
    }
    if (!isPointronDatafnBackup(jsonData)) {
      toasts.error("Please select a valid file");
      return;
    }
    isProcessingImport = true;
    try {
      const result = await datafn.importData(jsonData, {
        triggerCloneUp: true
      });
      await refreshNucleumDatafnStatus();
      const errorCount = resolveDatafnImportErrorCount(result);
      if (errorCount > 0) {
        toasts.error(
          `Pointron data imported with ${errorCount} skipped records`
        );
      } else {
        toasts.success("Pointron data imported successfully");
      }
      $lastImportTime = Date.now();
      resetFile();
    } catch (error) {
      logger.error({ at: "PointronImportData.processImport", error });
      toasts.error("Unable to import Pointron data");
    } finally {
      isProcessingImport = false;
    }
  }

  function resetFile() {
    if (fileInput) fileInput.value = "";
    fileName = "";
    jsonData = undefined;
  }
</script>

<div class="flex flex-col w-full gap-4 p-4 px-6 bg-bgs2 rounded-md">
  <div class="flex w-full justify-between">
    <div class="flex items-center gap-2">
      <input
        type="file"
        id="fileInput"
        bind:this={fileInput}
        onchange={importData}
        accept=".json"
        class="hidden"
      />
      <label
        for="fileInput"
        class="bg-bgs3 rounded-md py-2 px-3 cursor-pointer"
      >
        Choose File
      </label>
      {#if fileName}
        {fileName}
        <Icon icon="cross" onclick={resetFile} />
      {/if}
    </div>

    <Button
      size={Size.sm}
      onclick={processImport}
      type={ButtonVariant.PRIMARY}
      label={isProcessingImport ? "Uploading..." : "Import"}
      isLoading={isProcessingImport}
      isDisabled={!fileName || isProcessingImport || !$datafnRuntime?.storage}
    />
  </div>
  <div class="self-start text-b3">
    <b>Note:</b> Only Pointron DataFn export <i>.json</i> is currently accepted
  </div>
</div>
{#if isProcessingImport}
  <InlineInfoBanner
    content="**Import in progress.** Kindly **do not close this tab** until the import is complete. Import might take a few seconds or upto a minute depending on the amount of data."
  />
{/if}
