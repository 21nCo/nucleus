<script lang="ts">
  import view from "@nucleum/stores/view.store";
  import { confirmationNotification } from "@nucleum/stores/notification.store";
  import { lastImportTime } from "@nucleum/products/pointron/pointron.store";
  import {
    StatusMessageType,
    type StatusMessage
  } from "@21n/types/statusMessage.type";
  import InlineInfoBanner from "@21n/elements/text/InlineInfoBanner.svelte";
  import context from "@nucleum/stores/context.store";
  import { TextStyle } from "@21n/types/text.enum";
  import Text from "@21n/elements/text/Text.svelte";
  import type {
    TableColumnItem,
    TableRowItem
  } from "@21n/types/tableCell.type";
  import { onMount } from "svelte";
  import ExportData from "@nucleum/products/pointron/settings/data/ExportData.svelte";
  import { ButtonVariant } from "@21n/types/button.type";
  import Table2 from "@21n/elements/table/Table2.svelte";
  import {
    TableCellType,
    type TableColumn
  } from "@21n/types/table.type";
  import ScrollViewBottomSpacer from "@21n/layout/scrollView/ScrollViewBottomSpacer.svelte";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import { Size } from "@21n/types/size.enum";
  import { InfoTextType } from "@21n/types/text.type";
  import ImportAppListPart from "@nucleum/products/pointron/settings/data/ImportAppListPart.svelte";

  let clearMessage: string | undefined = undefined;
  let fileInput: HTMLInputElement;
  let statusMessage: StatusMessage = {
    message: undefined,
    type: StatusMessageType.DEFAULT
  };
  $effect(() => {
    const importTime = $lastImportTime;
    if (importTime) {
      queueMicrotask(() => {
        void refreshImportHistory();
      });
    }
  });
  function handleDeleteImportEntry(rowId: string) {
    confirmationNotification.notify({
      title: "Revert this import",
      message: "Are you sure you want to revert this import?",
      confirmAction: {
        label: "Revert",
        variant: ButtonVariant.DANGER
      }
    });
  }

  const columns: TableColumn[] = [
    {
      label: "Date and time",
      key: "created"
    },
    {
      label: "File Name",
      key: "fileName"
    },
    {
      label: "Source",
      key: "source",
      width: 0.3
    },
    {
      label: "Status",
      key: "status",
      width: 0.3
    },
    {
      label: "Actions",
      key: "trash",
      width: 0.1,
      type: TableCellType.ACTION,
      action: (data: any) => {
        handleDeleteImportEntry(data.id);
      }
    }
  ];

  let importHistoryData: TableRowItem[] = [];

  async function refreshImportHistory() {
    if (importHistoryData.length > 0) {
      importHistoryData = importHistoryData.map((item) => {
        return {
          ...item,
          created: new Date(item.created).toLocaleString()
        };
      });
    }
  }
  onMount(async () => {
    await refreshImportHistory();
  });
</script>

{#if $context.isEmbed}
  <InlineInfoBanner
    content="We are sorry. Export feature is not currently available on app store distributions. Please use web app to export your data."
    action={{
      label: "Open web app",
      action: "web"
    }}
  />
{:else}
  <div class="flex flex-col gap-8 h-full flex-grow">
    <ImportAppListPart />
    <div class="flex flex-col gap-3">
      <div class="text-left mo:text-b2">Import history</div>
      <div class="w-full">
        {#if !importHistoryData || importHistoryData.length === 0}
          <EmptyStatusView size={Size.sm} subText="No import history found" />
        {:else}
          <Table2 {columns} data={importHistoryData} isStyled={true} />
        {/if}
      </div>
    </div>
    <div class={`flex flex-col ${$view.isPortrait ? `gap-3` : `gap-4`}`}>
      <Text
        width="w-fit"
        style={TextStyle.PANEL_HEADING}
        content="Export data"
      />
      <ExportData />
    </div>
    <ScrollViewBottomSpacer />
    <InlineInfoBanner
      content="**Note:** When a large amount of data is imported, Analytics data may take some time to get reflected. Please bear with us as we work on improving this scenario."
      type={InfoTextType.WARNING}
    />
  </div>
{/if}
