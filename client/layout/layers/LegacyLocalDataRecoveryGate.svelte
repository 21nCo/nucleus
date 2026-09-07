<svelte:options runes={true} />

<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import InlineInfoBanner from "@21n/elements/text/InlineInfoBanner.svelte";
  import Text from "@21n/elements/text/Text.svelte";
  import type { LegacyLocalDataSummary } from "@nucleum/persistence/legacyLocalDataBackup";
  import { resolveLegacyLocalDataRecordCount } from "@nucleum/persistence/legacyLocalDataBackup";
  import { ButtonVariant } from "@21n/elements/button/button.type";
  import { Size } from "@21n/elements/size.enum";
  import { TextStyle } from "@21n/elements/text/text.enum";
  import { InfoTextType } from "@21n/elements/text/info.type";

  let {
    summary,
    mode = "required",
    errorMessage = undefined,
    onImport,
    onDownloadAndContinue
  }: {
    summary: LegacyLocalDataSummary;
    mode?: "required" | "importing" | "downloading";
    errorMessage?: string | undefined;
    onImport: () => void | Promise<void>;
    onDownloadAndContinue: () => void | Promise<void>;
  } = $props();

  const recordCount = $derived(resolveLegacyLocalDataRecordCount(summary));
  const databaseCount = $derived(summary.databases.length);
  const isBusy = $derived(mode === "importing" || mode === "downloading");
</script>

<div class="flex h-screen w-screen items-center justify-center bg-bgs1 p-4">
  <section
    class="flex w-full max-w-2xl flex-col gap-5 rounded-md border border-brs2 bg-bgs1 p-5 shadow--md"
  >
    <div class="flex flex-col gap-2">
      <Text content="Old local data found" style={TextStyle.PANEL_HEADING} />
      <p class="text-b2 text-fgs2">
        This device still has data from the previous local storage system.
      </p>
    </div>

    <InlineInfoBanner
      type={InfoTextType.WARNING}
      size={Size.md}
      content={`Found ${recordCount} records across ${databaseCount} legacy databases. You can import them into DataFn now, or download a raw backup and continue with a clean DataFn start.`}
    />

    {#if errorMessage}
      <InlineInfoBanner
        type={InfoTextType.ERROR}
        size={Size.md}
        content={errorMessage}
      />
    {/if}

    <div class="max-h-48 overflow-auto rounded-md border border-brs2">
      {#each summary.databases as database}
        <div
          class="flex items-center justify-between gap-3 border-b border-brs2 px-4 py-3 last:border-b-0"
        >
          <div class="min-w-0">
            <div class="truncate text-b2 text-fgs1">{database.name}</div>
            <div class="text-b3 text-fgs3">{database.provider}</div>
          </div>
          <div class="shrink-0 text-b3 text-fgs2">
            {database.stores.reduce((total, store) => total + store.count, 0)}
            records
          </div>
        </div>
      {/each}
    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:justify-end">
      <Button
        label="Download backup and continue"
        icon="download"
        type={ButtonVariant.SECONDARY}
        size={Size.sm}
        onclick={() => onDownloadAndContinue()}
        isLoading={mode === "downloading"}
        isDisabled={isBusy}
      />
      <Button
        label="Import old data"
        icon="restore"
        type={ButtonVariant.PRIMARY}
        size={Size.sm}
        onclick={() => onImport()}
        isLoading={mode === "importing"}
        isDisabled={isBusy}
      />
    </div>
  </section>
</div>
