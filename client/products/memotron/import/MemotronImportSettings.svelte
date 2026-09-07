<script lang="ts">
  import {
    toasts,
    confirmationNotification
  } from "@nucleum/stores/notification.store";
  import context from "@nucleum/stores/context.store";
  import { ButtonVariant } from "@21n/elements/button/button.type";
  import Table2 from "@21n/elements/table/Table2.svelte";
  import { TableCellType, type TableColumn } from "@21n/elements/table/table.type";
  import ScrollViewBottomSpacer from "@21n/layout/scrollView/ScrollViewBottomSpacer.svelte";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import { Size } from "@21n/elements/size.enum";
  import { InfoTextType } from "@21n/elements/text/info.type";
  import InlineInfoBanner from "@21n/elements/text/InlineInfoBanner.svelte";
  import { preferences } from "@nucleum/stores/preferences/preferences.store";
  import { type ImportHistoryItem } from "@nucleum/products/memotron/import/data.type";
  import { enumToString, properCase } from "@21n/shared-utils/text.utils";
  import MemotronImportAppList from "@nucleum/products/memotron/import/MemotronImportAppList.svelte";
  import { Preference } from "@nucleum/stores/preferences/preferences.type";
  import {
    removeDuplicatesFilter,
    resourceInList
  } from "@nucleum/datafn/resource.utils";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { Resource } from "@nucleum/datafn/resource.enum";

  type ImportHistoryRow = Omit<
    ImportHistoryItem,
    "source" | "totalRecords" | "status" | "createdAt"
  > & {
    source: string;
    totalRecords: string;
    status: string;
    createdAt: string;
  };

  const importHistoryData = $derived(resolveImportHistoryData($preferences));

  function handleDeleteImportEntry(importId: string) {
    confirmationNotification.notify({
      title: "Revert this import",
      message:
        "Are you sure you want to revert this import? This will delete all imported nodes and collections.",
      confirmAction: {
        label: "Revert",
        variant: ButtonVariant.DANGER,
        callback: () => revertImport(importId)
      }
    });
  }

  async function revertImport(importId: string) {
    try {
      const imports =
        (preferences.resolve(
          Preference.IMPORT_HISTORY
        ) as ImportHistoryItem[]) || [];
      const importRecord = imports.find(resourceInList(importId));
      if (!importRecord) {
        toasts.error("Import record not found");
        return;
      }
      if (importRecord.status === "REVERTED") {
        toasts.error("Import already reverted");
        return;
      }
      const [nodesResult, collectionsResult] = (await datafn.query([
        {
          resource: Resource.node,
          filters: {
            importId: importId.toString()
          }
        },
        {
          resource: Resource.collection,
          filters: {
            importId: importId.toString()
          }
        }
      ])) as Array<{ data?: { id: string }[] }>;

      const nodeIds = (nodesResult.data ?? []).map((node) => node.id);
      if (nodeIds.length > 0) {
        await datafn.node.mutate(
          nodeIds.map((id) => ({
            operation: "delete",
            id
          }))
        );
      }

      const collectionIds = (collectionsResult.data ?? []).map(
        (collection) => collection.id
      );
      if (collectionIds.length > 0) {
        await datafn.collection.mutate(
          collectionIds.map((id) => ({
            operation: "delete",
            id
          }))
        );
      }

      const updatedImports = imports.map((item: ImportHistoryItem) =>
        item.id === importId ? { ...item, status: "REVERTED" } : item
      );
      preferences.save(Preference.IMPORT_HISTORY, updatedImports);

      toasts.success("Import reverted successfully");
    } catch (error) {
      console.error("Error reverting import:", error);
      toasts.error("Failed to revert import");
    }
  }

  const columns: TableColumn[] = [
    {
      label: "Date and time",
      key: "createdAt",
      width: 0.5
    },
    {
      label: "File Name",
      key: "fileName",
      width: 0.5
    },
    {
      label: "Source",
      key: "source",
      width: 0.2
    },
    {
      label: "Records",
      key: "totalRecords",
      width: 0.2
    },
    {
      label: "Status",
      key: "status",
      width: 0.3
    },
    {
      label: "Actions",
      key: "trash",
      actionTooltip: {
        body: "Revert import"
      },
      width: 0.1,
      type: TableCellType.ACTION,
      action: (data: ImportHistoryItem) => {
        handleDeleteImportEntry(data.id);
      }
    }
  ];

  function resolveImportHistoryData(
    preferencesData: Record<string, unknown>
  ): ImportHistoryRow[] {
    const imports =
      (preferencesData?.[Preference.IMPORT_HISTORY] as ImportHistoryItem[]) ||
      [];
    return imports
      .filter(removeDuplicatesFilter)
      .sort(
        (a: ImportHistoryItem, b: ImportHistoryItem) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .map((item: ImportHistoryItem) => ({
        ...item,
        createdAt: new Date(item.createdAt).toLocaleString(),
        source: properCase(enumToString(item.source)),
        totalRecords: item.totalRecords
          ? `${item.totalRecords.nodes}${item.totalRecords.collections ? ` + ${item.totalRecords.collections} collections` : ""}`
          : "N/A",
        status:
          item.status === "SUCCESS"
            ? "✅ Success"
            : item.status === "FAILED"
              ? "❌ Failed"
              : item.status === "REVERTED"
                ? "🔄 Reverted"
                : "⏳ In Progress"
      }));
  }
</script>

{#if $context.isEmbed}
  <InlineInfoBanner
    content="Import features are currently not available on app store distributions. Please use web app to import data."
    action={{
      label: "Open web app",
      action: "web"
    }}
  />
{:else}
  <div class="flex flex-col gap-8 h-full flex-grow">
    <MemotronImportAppList />
    <div class="flex flex-col w-full flex-grow gap-3">
      <div class="text-left mo:text-b2">Import history</div>
      <div class="flex w-full flex-grow">
        {#if !importHistoryData || importHistoryData.length === 0}
          <EmptyStatusView size={Size.sm} subText="No import history found" />
        {:else}
          <Table2 {columns} data={importHistoryData} isStyled={true} />
        {/if}
      </div>
    </div>
    <ScrollViewBottomSpacer />
  </div>
{/if}
