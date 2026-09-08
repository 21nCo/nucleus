<script lang="ts">
  import view from "@nucleum/stores/view.store";
  import modalEvent from "@nucleum/stores/overlays/modal.store";
  import Icon from "@21n/elements/Icon.svelte";
  import Button from "@21n/elements/button/Button.svelte";
  import { Size } from "@21n/elements/size.enum";
  import FileItem from "@nucleum/products/memotron/import/FileItem.svelte";
  import { UploadStatus } from "@nucleum/application/settings/import/uploadStatus.enum";
  import { convertFileSize } from "@21n/utils/utils";
  import { FileSizeMeasurement } from "@21n/utils/fileSizeMeasurement.enum";
  import { toasts } from "@nucleum/stores/notification.store";
  import {
    ImportSource,
    StepType,
    type ImportHistoryItem
  } from "@nucleum/stores/preferences/import.type";
  import { ButtonStyle, ButtonVariant } from "@21n/elements/button/button.type";
  import Divider from "@21n/elements/Divider.svelte";
  import { Display } from "@21n/elements/display.enum";
  import { enumToString, properCase } from "@21n/shared-utils/text.utils";
  import { renderMdAsHtml } from "@21n/elements/markdown/markdown.utils";
  import { generateResourceId } from "@nucleum/datafn/id.utils";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { preferences } from "@nucleum/stores/preferences/preferences.store";
  import { MemotronAction } from "@nucleum/features/memory/memory-action.enum";
  import { Preference } from "@nucleum/stores/preferences/preferences.type";
  import { cn } from "@21n/utils/ui.utils";
  import FieldMapping from "@nucleum/products/memotron/import/FieldMapping.svelte";
  import type { FieldMappingConfig } from "@nucleum/stores/preferences/import.type";
  import { PocketImporter } from "@nucleum/products/memotron/import/pocket.importer";
  import { Action } from "@nucleum/client/config/action.enum";

  let {
    importSource = ImportSource.POCKET
  }: {
    importSource?: ImportSource;
  } = $props();

  let inputRef: HTMLInputElement;
  let activeStepIndex: number = 0;
  let isShowSummary: boolean = false;
  let importResult: {
    success: boolean;
    totalCreated: number;
    totalRecords: number;
    collectionsCreated: number;
    fileName: string;
    errorMessage?: string;
  } | null = null;

  let locallyUploadedFiles: FileList | null = null;
  let tempFileList:
    | {
        label: string;
        size: number;
        file: File;
        uploadStatus: UploadStatus;
        uploadProgress: number;
      }[]
    | null = null;

  const filesLimit = 5;

  let isEverythingUploaded: boolean = false;
  let isUploading: boolean = false;
  let fieldMappings: Record<string, string> = {};

  function initializeFieldMappings() {
    if (config.fieldMappingConfig) {
      fieldMappings = Object.keys(config.fieldMappingConfig).reduce(
        (acc, key) => {
          acc[key] = config.fieldMappingConfig![key].defaultValue;
          return acc;
        },
        {} as Record<string, string>
      );
    }
  }

  const importSourceConfig = {
    [ImportSource.POCKET]: {
      name: "Pocket",
      fileFormats: ["CSV"],
      acceptedFiles: ".zip",
      maxSizeText: "10MB",
      maxFileSize: 10000000,
      allowMultipleFiles: false,
      fieldMappingConfig: {
        saves: {
          label: "Pocket Saves",
          description: "Your saved articles and links",
          options: [{ value: "nodes", label: "Web Page Nodes" }],
          defaultValue: "nodes"
        },
        tags: {
          label: "Pocket tags",
          description: "Tags associated with your saves",
          options: [
            { value: "ignore", label: "Don't import" },
            {
              value: "simple_collections",
              label: "Simple collections"
            },
            {
              value: "typed_collections",
              label: "Typed collections"
            }
          ],
          defaultValue: "simple_collections"
        },
        collections: {
          label: "Pocket collections",
          description: "Any user created collections in Pocket",
          options: [
            { value: "ignore", label: "Don't import" },
            { value: "simple_collections", label: "Simple collections" },
            { value: "typed_collections", label: "Typed collections" }
          ],
          defaultValue: "simple_collections"
        }
      } as FieldMappingConfig,
      steps: [
        {
          subTitle: "Let us guide you through importing data from Pocket",
          description:
            "Step 1: Go to [https://getpocket.com/export](https://getpocket.com/export) and sign in. Then click on **Export CSV file** button. You will receive an email with a link to download a zip file. Download the zip file and upload in the next step.",
          type: StepType.NON_INTERACTIVE
        },
        {
          subTitle:
            "Choose how different types of data from Pocket should be mapped in Memotron.",
          type: StepType.FIELD_MAPPING
        },
        {
          subTitle:
            "Note: Each bookmark from Pocket will become a web page node in Memotron. Multiple CSV files in the ZIP will be processed.",
          description: "Upload the ZIP file containing your exported data.",
          type: StepType.UPLOAD
        }
      ]
    }
  };

  const config = importSourceConfig[importSource];
  const accept = config.acceptedFiles;

  function getFileFormatNote() {
    const formatsText = config.fileFormats.join(", ");
    return `File format: ${formatsText} (in ZIP), max size: ${config.maxSizeText}`;
  }
  const note = getFileFormatNote();

  function onJumpToUpload() {
    activeStepIndex = config.steps.length - 1;
  }

  function onNext() {
    if (activeStepIndex < config.steps.length - 1) {
      activeStepIndex++;
    }
  }

  function resetFileInput() {
    locallyUploadedFiles = null;
    inputRef ? (inputRef.value = "") : "";
  }

  function onBack() {
    resetFileInput();
    if (activeStepIndex > 0) {
      activeStepIndex--;
    }
  }

  let progressInterval: ReturnType<typeof setInterval> | null = null;
  function keepIncreasingProgress() {
    if (progressInterval) clearInterval(progressInterval);
    progressInterval = setInterval(() => {
      if (tempFileList) {
        tempFileList = tempFileList?.map((item) => {
          if (item.uploadProgress < 90) {
            return {
              ...item,
              uploadProgress: item.uploadProgress + 1
            };
          }
          return item;
        });

        if (isEverythingUploaded) {
          if (progressInterval) clearInterval(progressInterval);
          tempFileList = tempFileList.map((item) => {
            return {
              ...item,
              uploadStatus: UploadStatus.UPLOADED,
              uploadProgress: 100
            };
          });
        }
      }
    }, 500);
  }

  async function saveImportHistory(importItem: ImportHistoryItem) {
    let imports: ImportHistoryItem[] =
      (preferences.resolve(Preference.IMPORT_HISTORY) as ImportHistoryItem[]) ||
      [];
    if (!Array.isArray(imports)) imports = [];
    imports = imports.filter(
      (item: ImportHistoryItem) =>
        item.id.toString() !== importItem.id.toString()
    );
    imports.push(importItem);
    preferences.save(Preference.IMPORT_HISTORY, imports);
  }

  async function onUpload() {
    if (!tempFileList) {
      toasts.error("Please upload a file");
      return;
    }

    const file = tempFileList[0].file;

    isUploading = true;
    tempFileList = tempFileList.map((item) => ({
      ...item,
      uploadStatus: UploadStatus.UPLOADING,
      uploadProgress: 10
    }));
    keepIncreasingProgress();
    const importId = generateResourceId(Resource.import).toString();

    try {
      let totalCreated = 0;
      let totalRecords = 0;
      let collectionsCreated = 0;
      if (
        importSource === ImportSource.POCKET &&
        file.name.toLowerCase().endsWith(".zip")
      ) {
        const importItem: ImportHistoryItem = {
          id: importId,
          source: importSource,
          fileName: file.name,
          createdAt: new Date(),
          status: "IN_PROGRESS"
        };
        await saveImportHistory(importItem);
        const pocketImporter = new PocketImporter(fieldMappings, importId);
        const result = await pocketImporter.run(file);
        totalCreated = result?.totalCreated ?? 0;
        totalRecords = result?.totalRecords ?? 0;
        collectionsCreated = result?.collectionsCreated ?? 0;
      } else {
        throw new Error("Please select a supported file type");
      }
      importResult = {
        success: true,
        totalCreated,
        totalRecords,
        collectionsCreated,
        fileName: file.name
      };
      const importItem: ImportHistoryItem = {
        id: importId,
        source: importSource,
        fileName: file.name,
        createdAt: new Date(),
        totalRecords: {
          nodes: totalCreated,
          collections: collectionsCreated
        },
        status: "SUCCESS"
      };
      await saveImportHistory(importItem);

      isEverythingUploaded = true;
      toasts.success(
        `Successfully imported ${totalCreated} items from ${config.name} archive`
      );
      if (progressInterval) clearInterval(progressInterval);
    } catch (error) {
      console.error("Error during import:", error);
      if (progressInterval) clearInterval(progressInterval);
      importResult = {
        success: false,
        totalCreated: 0,
        totalRecords: 0,
        collectionsCreated: 0,
        fileName: file.name,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
      toasts.error(
        "Failed to import file: " +
          (error instanceof Error ? error.message : String(error))
      );

      const failedImportItem: ImportHistoryItem = {
        id: importId,
        source: importSource,
        fileName: file.name,
        createdAt: new Date(),
        status: "FAILED"
      };
      await saveImportHistory(failedImportItem);
    } finally {
      isUploading = false;
      isShowSummary = true;
    }
  }

  function onClose() {
    resetFileInput();
    modalEvent.hide(MemotronAction.IMPORT_APP_DATA);
    modalEvent.hide(Action.IMPORT_FROM_OTHER_APPS);
  }

  function getSizeString(sizeInBytes: number) {
    if (sizeInBytes > 1000000) {
      return `${convertFileSize(sizeInBytes, FileSizeMeasurement.MEGABYTES)}MB`;
    } else if (sizeInBytes > 1000) {
      return `${convertFileSize(sizeInBytes, FileSizeMeasurement.KILOBYTES)}KB`;
    } else {
      return `${sizeInBytes}B`;
    }
  }

  function isFileCountInLimit(files: FileList | null) {
    if (files && files.length > filesLimit) {
      alert(`You can upload maximum ${filesLimit} files at a time`);
      return false;
    }
    return true;
  }

  function isFileValid(file: File) {
    if (file.size > config.maxFileSize) {
      alert(`File size should be less than ${config.maxSizeText}`);
      return false;
    }

    // Check file type based on import source configuration
    const fileName = file.name.toLowerCase();
    const acceptedTypes = config.acceptedFiles.split(",");
    const isValidType = acceptedTypes.some((type) =>
      fileName.endsWith(type.trim())
    );

    if (!isValidType) {
      alert(`Please select a ${config.fileFormats.join(" or ")} file`);
      return false;
    }

    return true;
  }

  function handleLocallyUploadedFileChange(
    locallyUploadedFiles?: FileList | null
  ) {
    if (locallyUploadedFiles) {
      if (!isFileCountInLimit(locallyUploadedFiles)) {
        tempFileList = null;
      } else {
        for (let i = 0; i < locallyUploadedFiles.length; i++) {
          const file = locallyUploadedFiles[i];
          if (!isFileValid(file)) {
            tempFileList = null;
            break;
          } else {
            tempFileList = Array.from(locallyUploadedFiles).map((file) => {
              return {
                label: file.name,
                size: file.size,
                file: file,
                uploadStatus: UploadStatus.NOT_STARTED,
                uploadProgress: 0
              };
            });
          }
        }
      }
    }
    return tempFileList;
  }

  function handleRemove(index: number) {
    return () => {
      if (tempFileList) {
        tempFileList.splice(index, 1);
        tempFileList = [...tempFileList];
      }
    };
  }

  $effect(() => {
    if (tempFileList && tempFileList.length > 0) {
      isEverythingUploaded =
        tempFileList.every(
          (item) => item.uploadStatus === UploadStatus.UPLOADED
        ) ?? false;
    } else {
      isEverythingUploaded = false;
    }
  });

  $effect(() => {
    tempFileList = handleLocallyUploadedFileChange(locallyUploadedFiles);
  });

  function resolveTitle(importSource: ImportSource) {
    return `Import from ${config.name}`;
  }

  function resolveImageSrc(importSource: ImportSource, index: number) {
    return import.meta.env?.VITE_STATIC_URL
      ? import.meta.env?.VITE_STATIC_URL +
          "/memotron/import/" +
          importSource.toLowerCase() +
          "/" +
          index +
          ".png"
      : "/images/blank.png";
  }

  function handleFieldMappingChange({
    field,
    value
  }: {
    field: string;
    value: string;
  }) {
    fieldMappings[field] = value;
  }

  initializeFieldMappings();
</script>

<div class="flex flex-col gap-4 justify-between w-full h-full">
  {#if $view.display === Display.MO}
    <div class="header flex justify-between">
      {#if activeStepIndex !== 0}
        <button onclick={onBack}>
          <Icon size={Size.sm} icon={"chevron-left"} />
        </button>
      {/if}
      <div class="ml-auto">
        <Button
          size={$view.isPortrait ? Size.sm : Size.md}
          onclick={onClose}
          icon={"cross"}
        />
      </div>
    </div>
  {/if}
  {#if isShowSummary}
    <div class="flex flex-col items-center gap-4 w-full">
      <div class="font-normal cw:text-base text-h4">
        {resolveTitle(importSource)}
      </div>
      <div class="font-normal w-full cw:text-b3 text-b2">Import Summary</div>
    </div>
    <div class="flex flex-col gap-4 w-full max-w-lg mx-auto">
      {#if importResult}
        <div class="bg-bgs2 rounded-lg p-4">
          <div class="flex items-center gap-2 mb-3">
            {#if importResult.success}
              <Icon icon="check-circle" class="text-ags1" />
              <span class="font-medium text-ags1">Import Successful</span>
            {:else}
              <Icon icon="x-circle" class="text-ars1" />
              <span class="font-medium text-ars1">Import Failed</span>
            {/if}
          </div>

          <div class="space-y-2 text-b2">
            <div class="flex justify-between">
              <span class="text-fgs2">File:</span>
              <span class="font-medium">{importResult.fileName}</span>
            </div>

            {#if importResult.success}
              <div class="flex justify-between">
                <span class="text-fgs2">Nodes Created:</span>
                <span class="font-medium">{importResult.totalCreated}</span>
              </div>

              {#if importResult.collectionsCreated > 0}
                <div class="flex justify-between">
                  <span class="text-fgs2">Collections Created:</span>
                  <span class="font-medium"
                    >{importResult.collectionsCreated}</span
                  >
                </div>
              {/if}

              <div class="flex justify-between">
                <span class="text-fgs2">Total Records Processed:</span>
                <span class="font-medium">{importResult.totalRecords}</span>
              </div>
            {:else}
              <div class="bg-bgs3 border border-red-200 rounded p-3 mt-2">
                <div class="text-red-500 text-b3">
                  <strong>Error:</strong>
                  {importResult.errorMessage || "Unknown error occurred"}
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {:else if config.steps[activeStepIndex].type === StepType.NON_INTERACTIVE}
    <div class="flex flex-col items-center gap-2">
      <div class="font-normal cw:text-base text-h4">
        {resolveTitle(importSource)}
      </div>
      <div class="font-normal w-full cw:text-b3 text-b2">
        {#key config.steps[activeStepIndex].subTitle}
          {@html renderMdAsHtml(config.steps[activeStepIndex].subTitle)}
        {/key}
      </div>
    </div>
    <div class="flex flex-col items-center gap-2 w-full">
      <div
        class="text-fgs2 mr-auto dp:mt-4 w-full cw:text-b3 cw:text-left text-b2"
      >
        {#key config.steps[activeStepIndex].description}
          {@html renderMdAsHtml(
            config.steps[activeStepIndex].description || ""
          )}
        {/key}
      </div>
      <div
        class="rounded-xl overflow-auto object-contain mt-4 flex items-center justify-center mo:w-full w-4/5"
      >
        <img
          class="w-full"
          alt={`Step-${activeStepIndex + 1}`}
          src={resolveImageSrc(importSource, activeStepIndex)}
        />
      </div>
    </div>
  {:else if config.steps[activeStepIndex].type === StepType.FIELD_MAPPING}
    <div class="flex flex-col items-center gap-2 w-full">
      <div class="font-normal cw:text-base text-h4">
        {resolveTitle(importSource)}
      </div>
      <div class="font-normal w-full cw:text-b3 text-b2">
        {#key config.steps[activeStepIndex].subTitle}
          {@html renderMdAsHtml(config.steps[activeStepIndex].subTitle)}
        {/key}
      </div>
    </div>
    <div class="flex flex-col items-center gap-2 w-full flex-grow">
      {#if config.steps[activeStepIndex].description}
        <div
          class="text-fgs2 mr-auto dp:mt-4 w-full cw:text-b3 cw:text-left text-b2"
        >
          {#key config.steps[activeStepIndex].description}
            {@html renderMdAsHtml(
              config.steps[activeStepIndex].description || ""
            )}
          {/key}
        </div>
      {/if}
      {#if config.fieldMappingConfig}
        <div class="w-full mt-4 h-full overflow-y-auto">
          <FieldMapping
            fieldMappingConfig={config.fieldMappingConfig}
            bind:fieldMappings
            onMappingChange={handleFieldMappingChange}
          />
        </div>
      {/if}
    </div>
  {:else if config.steps[activeStepIndex].type === StepType.UPLOAD}
    <div class="flex flex-col items-center gap-2 w-full">
      <div class="font-normal cw:text-b3 text-b2">
        {resolveTitle(importSource)}
      </div>
      <div class="font-normal cw:text-b3 text-b2">
        {#key config.steps[activeStepIndex].subTitle}
          {@html renderMdAsHtml(config.steps[activeStepIndex].subTitle || "")}
        {/key}
      </div>
    </div>
    <div class="flex flex-col items-center gap-2 w-full">
      {#if !tempFileList || tempFileList.length === 0 || (tempFileList?.length > 0 && config.allowMultipleFiles)}
        <div
          class={cn(
            "text-fgs2 mr-auto",
            $view.isPortrait
              ? "text-left text-b4"
              : "flex justify-center text-b2 w-full"
          )}
        >
          {#key config.steps[activeStepIndex].description}
            {@html renderMdAsHtml(
              config.steps[activeStepIndex].description || ""
            )}
          {/key}
        </div>
        <div
          class={cn(
            "rounded-xl border-dashed p-4 overflow-auto mt-4 border flex items-center justify-center",
            $view.isPortrait ? "w-full" : "w-[530px]",
            tempFileList?.length ? "border-fgs3" : "h-[290px] border-bgs4"
          )}
        >
          <div
            class={`flex items-center ${
              tempFileList?.length && !$view.isPortrait
                ? `gap-3`
                : `flex-col gap-2 `
            }`}
          >
            <Icon icon="upload" />
            <div
              class={cn("flex-col", {
                "text-left": tempFileList?.length && !$view.isPortrait,
                "text-center": !tempFileList?.length || $view.isPortrait
              })}
            >
              <div class="cw:text-b3 text-b2">
                Browse {accept} file or drag and drop here
              </div>
              <div
                class={cn("text-fgs3 cw:text-b3 text-b2", {
                  "mb-4": !tempFileList?.length,
                  "text-b4": $view.isPortrait
                })}
              >
                {note}
              </div>
            </div>
            <input
              multiple={false}
              bind:files={locallyUploadedFiles}
              class="hidden"
              {accept}
              bind:this={inputRef}
              type="file"
            />
            <Button
              size={Size.sm}
              onclick={() => {
                inputRef.click();
              }}
            >
              Browse
            </Button>
          </div>
        </div>
      {/if}
    </div>
    {#if tempFileList?.length}
      <div class="flex w-full justify-center">
        <div class="w-4/5 overflow-auto h-60 border rounded-md border-brs2">
          {#each tempFileList as file, index}
            <FileItem
              label={file.label}
              size={getSizeString(file.size)}
              uploadStatus={file.uploadStatus}
              uploadProgress={file.uploadProgress}
              onRemove={handleRemove(index)}
            />
          {/each}
        </div>
      </div>
    {/if}
  {/if}
  {#if !tempFileList?.length}
    <div class="navigation-dots flex gap-3 w-full justify-center">
      {#each config.steps as step, index}
        <button
          class={cn("navigation-dot w-2 h-2 rounded-full", {
            "bg-aps1": activeStepIndex === index,
            "bg-fgs2": activeStepIndex !== index
          })}
          onclick={() => {
            activeStepIndex = index;
          }}
        />
      {/each}
    </div>
  {/if}
  <footer>
    <Divider />
    {#if activeStepIndex === config.steps.length - 1 && isEverythingUploaded}
      <div class="p-4">
        Import completed successfully! Your data has been imported and converted
        to web page nodes.
      </div>
    {/if}
    <div class="flex mo:px-3 mo:py-2 p-4">
      {#if $view.isPortrait}
        {#if activeStepIndex !== config.steps.length - 1}
          <Button size={Size.sm} onclick={onJumpToUpload}>Jump to upload</Button
          >
        {:else}
          <Button size={Size.sm} onclick={onClose}>Cancel</Button>
        {/if}
      {:else if activeStepIndex !== 0}
        <Button size={Size.sm} onclick={onBack}>Back</Button>
      {/if}
      <div class="ml-auto flex gap-3">
        {#if !$view.isPortrait && !config.fieldMappingConfig}
          {#if activeStepIndex !== config.steps.length - 1}
            <Button size={Size.sm} onclick={onJumpToUpload}
              >Jump to upload</Button
            >
          {:else if activeStepIndex === config.steps.length - 1}
            <Button size={Size.sm} onclick={onClose}>Cancel</Button>
          {/if}
        {/if}

        {#if activeStepIndex !== config.steps.length - 1}
          <Button
            size={Size.sm}
            onclick={onNext}
            type={ButtonVariant.PRIMARY}
            style={ButtonStyle.OUTLINED}>Next</Button
          >
        {:else if activeStepIndex === config.steps.length - 1 && !isEverythingUploaded}
          <Button
            isLoading={isUploading}
            size={Size.sm}
            onclick={onUpload}
            type={ButtonVariant.PRIMARY}>Import</Button
          >
        {:else if activeStepIndex === config.steps.length - 1 && isEverythingUploaded}
          <Button size={Size.sm} onclick={onClose}>Done</Button>
        {/if}
      </div>
    </div>
  </footer>
</div>
