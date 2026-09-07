<script lang="ts">
  import {
    reorderList,
    type DragDropEvent
  } from "@nucleum/actions/rearrange.action";
  import ComponentResolver from "@21n/layout/paint/ComponentResolver.svelte";
  import { ButtonStyle, ButtonVariant } from "@21n/elements/button/button.type";
  import { InputStyle } from "@21n/elements/input/input.type";
  import {
    TableCellDefaultAction,
    TableCellType,
    type TableColumn
  } from "@21n/elements/table/table.type";
  import { cn } from "@21n/utils/ui.utils";
  import Button from "@21n/elements/button/Button.svelte";
  import Divider from "@21n/elements/Divider.svelte";
  import DropDown from "@21n/elements/dropdown/DropDown.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import FormLabelTooltip from "@21n/elements/text/formLabel/FormLabelTooltip.svelte";
  import Switch from "@21n/elements/toggle/Switch.svelte";
  type TableRow = Record<string, any> & { id?: string | number };
  let {
    columns = [],
    data = $bindable([]),
    actions = [],
    isStyled = false,
    addAction = undefined,
    id = "table",
    width = "",
    onSelect = undefined,
    onMultiSelect = undefined,
    onReorder = undefined,
    onAdd = undefined
  }: {
    columns?: TableColumn[];
    data?: TableRow[];
    actions?: { action: TableCellDefaultAction; index: number }[];
    isStyled?: boolean;
    addAction?: string | undefined;
    id?: string;
    width?: string;
    onSelect?: ((event: CustomEvent<any>) => void) | undefined;
    onMultiSelect?: ((event: CustomEvent<any>) => void) | undefined;
    onReorder?: ((event: CustomEvent<DragDropEvent>) => void) | undefined;
    onAdd?: ((event: CustomEvent<void>) => void) | undefined;
  } = $props();
  const renderColumns = $derived.by(() => {
    let nextColumns = columns;
    if (actions.length > 0) {
      actions.forEach((action) => {
        nextColumns = [
          ...nextColumns.slice(0, action.index),
          resolveDefaultAction(action.action),
          ...nextColumns.slice(action.index)
        ].filter(isTableColumn);
      });
    }
    return nextColumns;
  });
  function isTableColumn(column: TableColumn | undefined): column is TableColumn {
    return column !== undefined;
  }

  function resolveDefaultAction(action: string): TableColumn | undefined {
    switch (action) {
      case TableCellDefaultAction.REORDER:
        return {
          key: "rearrange-horizontal",
          type: TableCellType.ACTION,
          action: () => undefined
        };
      case TableCellDefaultAction.REMOVE:
        return {
          key: "cross",
          type: TableCellType.ACTION,
          actionTooltip: {
            body: "Remove"
          },
          action: (row: TableRow) => {
            data = data?.filter((entry: TableRow) => entry.id !== row.id);
          }
        };
      case TableCellDefaultAction.SELECT_ROW:
        return {
          key: "circle",
          type: TableCellType.ACTION,
          action: (row: any) => {
            onSelect?.(new CustomEvent("select", { detail: row }));
          }
        };
      case TableCellDefaultAction.MULTI_SELECT_ROW:
        return {
          key: "check",
          type: TableCellType.ACTION,
          action: (row: any) => {
            onMultiSelect?.(new CustomEvent("multiSelect", { detail: row }));
          }
        };
    }
  }
  function resolveWidth(column: TableColumn) {
    return "width" in column
      ? column.width
      : column.type === TableCellType.ACTION
        ? 0.085
        : 1;
  }
  function resolveAction(column: TableColumn, row: any) {
    if (!("action" in column)) return;
    return column.action(row);
  }

  function resolveActionTooltip(column: TableColumn) {
    return "actionTooltip" in column ? column.actionTooltip?.body : undefined;
  }

  function handleReorder(detail: DragDropEvent) {
    onReorder?.(new CustomEvent("reorder", { detail }));
  }
</script>

<div
  class={cn("flex flex-col w-full overflow-x-auto", width, {
    "rounded-md border border-brs2": isStyled
  })}
>
  <div
    class={cn("grid gap-8 text-fgs3 text-left text-b2 rounded-md p-3", {
      "bg-bgs2": isStyled
    })}
    style="grid-template-columns: {renderColumns
      .map((column) => `${resolveWidth(column)}fr`)
      .join(' ')}"
  >
    {#each renderColumns as column (column.key)}
      <div
        class={cn("flex items-center gap-1", {
          "w-8": column.type === TableCellType.ACTION
        })}
      >
        {"label" in column ? column.label : ""}
        {#if column.tooltip}
          <FormLabelTooltip info={column.tooltip} />
        {/if}
      </div>
    {/each}
  </div>
  {#if isStyled}
    <Divider />
  {/if}
  <div
    class="flex flex-col px-3"
    use:reorderList={{
      listId: id,
      draggedOverClass: "!outline-aps1",
      dragImage: "dragimage",
      onDrop: handleReorder
    }}
  >
    {#each data as row, i (row.id)}
      <div
        class="grid gap-8 py-2 text-left outline outline-transparent rounded-md"
        style="grid-template-columns: {renderColumns
          .map((column) => `${resolveWidth(column)}fr`)
          .join(' ')}"
        draggable="true"
        data-index={i}
      >
        {#each renderColumns as column}
          {#if column.type === TableCellType.TEXT_INPUT}
            <TextInput
              bind:value={row[column.key]}
              placeholder={"placeholder" in column &&
              typeof column.placeholder === "string"
                ? column.placeholder
                : "placeholder" in column &&
                    column.placeholder instanceof Function
                  ? column.placeholder(row)
                  : ""}
            />
          {:else if column.type === TableCellType.TOGGLE}
            <Switch
              bind:on={row[column.key]}
              isDisabled={column.disabledCriteria?.(row) ?? false}
            />
          {:else if column.type === TableCellType.DROPDOWN && "options" in column}
            <!-- TODO: tooltip for dropdown group is not updating the position on scroll-->
            <DropDown
              items={column.options}
              groups={column.groups}
              bind:value={row[column.key]}
              style={column.style ?? InputStyle.BORDERED}
            />
          {:else if column.type === TableCellType.ACTION}
            <Button
              icon={column.key}
              tooltip={resolveActionTooltip(column)}
              onclick={() => resolveAction(column, row)}
            />
          {:else if column.type === TableCellType.CUSTOM && "component" in column}
            {@const componentProps =
              typeof column.componentProps === "function"
                ? column.componentProps(row)
                : column.componentProps}
            {#if typeof column.component === "string"}
              <ComponentResolver
                path={column.component}
                params={{ row, ...componentProps }}
              />
            {:else}
              <column.component {row} {...componentProps} />
            {/if}
          {:else}
            <div>{row[column.key] ?? "NA"}</div>
          {/if}
        {/each}
      </div>
    {/each}
  </div>
  {#if addAction}
    <div class="flex justify--center items-center p-3 pt-6 w-full">
      <Button
        label={addAction}
        icon="plus"
        style={ButtonStyle.PLAIN}
        type={ButtonVariant.SECONDARY}
        onclick={() => {
          onAdd?.(new CustomEvent("add"));
        }}
      />
    </div>
  {/if}
</div>
