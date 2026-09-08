<script lang="ts">
  import { reorderList } from "@nucleum/actions/rearrange.action";
  import { requireActionRenderer } from "@nucleum/stores/resources/action-renderer";
  import { ButtonStyle, ButtonVariant } from "@21n/elements/button/button.type";
  import { InputStyle } from "@21n/elements/input/input.type";
  import {
    TableCellDefaultAction,
    TableCellType,
    type TableColumn
  } from "@21n/elements/table/table.type";
  import { cn } from "@21n/utils/ui.utils";
  import Button from "@21n/elements/button/Button.svelte";
  import DropDown from "@21n/elements/dropdown/DropDown.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import FormLabelTooltip from "@21n/elements/text/formLabel/FormLabelTooltip.svelte";
  import Switch from "@21n/elements/toggle/Switch.svelte";
  let {
    columns = [],
    data = $bindable([]),
    actions = [],
    isStyled = false,
    addAction = undefined,
    id = "table",
    width = "",
    onAdd = undefined,
    onReorder = undefined,
    onSelect = undefined,
    onMultiSelect = undefined
  }: {
    columns?: TableColumn[];
    data?: any[];
    actions?: { action: TableCellDefaultAction; index: number }[];
    isStyled?: boolean;
    addAction?: string | undefined;
    id?: string;
    width?: string;
    onAdd?: (() => void) | undefined;
    onReorder?:
      | ((
          event: CustomEvent<{ from: number; to: number; listId: string }>
        ) => void)
      | undefined;
    onSelect?: ((row: any) => void) | undefined;
    onMultiSelect?: ((row: any) => void) | undefined;
  } = $props();

  const renderColumns = $derived(
    actions.length > 0 ? injectDefaultActions(columns, actions) : columns
  );

  function injectDefaultActions(
    base: TableColumn[],
    actions: { action: TableCellDefaultAction; index: number }[]
  ): TableColumn[] {
    let result = base;
    actions.forEach((action) => {
      result = [
        ...result.slice(0, action.index),
        resolveDefaultAction(action.action),
        ...result.slice(action.index)
      ].filter((column) => column !== undefined);
    });
    return result;
  }

  function resolveDefaultAction(
    action: TableCellDefaultAction
  ): TableColumn | undefined {
    switch (action) {
      case TableCellDefaultAction.REORDER:
        return {
          key: "rearrange-horizontal",
          type: TableCellType.ACTION
        };
      case TableCellDefaultAction.REMOVE:
        return {
          key: "cross",
          type: TableCellType.ACTION,
          actionTooltip: {
            body: "Remove"
          },
          action: (row: any) => {
            data = data?.filter((d) => d.id !== row.id);
          }
        };
      case TableCellDefaultAction.SELECT_ROW:
        return {
          key: "circle",
          type: TableCellType.ACTION,
          action: (row: any) => {
            onSelect?.(row);
          }
        };
      case TableCellDefaultAction.MULTI_SELECT_ROW:
        return {
          key: "check",
          type: TableCellType.ACTION,
          action: (row: any) => {
            onMultiSelect?.(row);
          }
        };
    }
  }
  function resolveAction(column: TableColumn, row: any) {
    if (!("action" in column)) return;
    return column.action(row);
  }

  function resolveToggleValue(row: any, key: string) {
    return Boolean(row[key]);
  }

  function commitDataChange() {
    data = [...data];
  }

  function setToggleValue(row: any, key: string, value: boolean) {
    row[key] = value;
    commitDataChange();
  }

  function patchRow(row: any, patch: Record<string, unknown>) {
    Object.assign(row, patch);
    commitDataChange();
  }
</script>

<div
  class={cn("w-full overflow-x-auto", width, {
    "rounded-md border border-brs2": isStyled
  })}
>
  <div class={cn("table w-full text-b2", { "bg--bgs2 rounded-md": isStyled })}>
    <div class="table-header-group">
      <div class="table-row text-fgs3">
        {#each renderColumns as column (column.key)}
          <div
            class={cn("table-cell border-b border-brs2 align-middle p-3", {
              "w-8": column.type === TableCellType.ACTION
            })}
            style={column.type === TableCellType.ACTION ? "width:2rem" : ""}
          >
            <div class="flex items-center gap-1">
              {"label" in column ? column.label : ""}
              {#if column.tooltip}
                <FormLabelTooltip info={column.tooltip} />
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
    <!-- {#if isStyled}
      <Divider />
    {/if} -->
    <div
      class="table-row-group"
      use:reorderList={{
        listId: id,
        draggedOverClass: "!bg-bgs3",
        dragImage: "dragimage"
      }}
      onreorder={(event) => {
        onReorder?.(
          event as CustomEvent<{ from: number; to: number; listId: string }>
        );
      }}
    >
      {#each data as row, i (row.id)}
        <div class="table-row" draggable="true" data-index={i}>
          {#each renderColumns as column}
            <div class="table-cell align-middle px-3 py-2 text-left">
              {#if column.type === TableCellType.TEXT_INPUT}
                <TextInput
                  bind:value={row[column.key]}
                  onChange={commitDataChange}
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
                  on={resolveToggleValue(row, column.key)}
                  onChange={(event) =>
                    setToggleValue(row, column.key, event.detail)}
                  isDisabled={column.disabledCriteria?.(row) ?? false}
                />
              {:else if column.type === TableCellType.DROPDOWN && "options" in column}
                <DropDown
                  items={column.options}
                  groups={column.groups}
                  bind:value={row[column.key]}
                  style={column.style ?? InputStyle.BORDERED}
                />
              {:else if column.type === TableCellType.ACTION}
                <Button
                  icon={column.key}
                  tooltip={column.actionTooltip?.body}
                  onclick={() => resolveAction(column, row)}
                />
              {:else if column.type === TableCellType.CUSTOM && "component" in column}
                {@const componentProps =
                  typeof column.componentProps === "function"
                    ? column.componentProps(row)
                    : column.componentProps}
                {#if typeof column.component === "string"}
              {@const ComponentResolver = requireActionRenderer()}
                  <ComponentResolver
                    path={column.component}
                    params={{
                      row,
                      ...componentProps,
                      onRowPatch: (patch: Record<string, unknown>) =>
                        patchRow(row, patch)
                    }}
                  />
                {:else}
                  {@const CustomComponent = column.component}
                  <CustomComponent {row} {...componentProps} />
                {/if}
              {:else}
                <div>{row[column.key] ?? "NA"}</div>
              {/if}
            </div>
          {/each}
        </div>
      {/each}
    </div>
  </div>
  {#if addAction}
    <div class="flex justify--center items-center p-3 pt-6 w-full">
      <Button
        label={addAction}
        icon="plus"
        style={ButtonStyle.PLAIN}
        type={ButtonVariant.SECONDARY}
        onclick={() => {
          onAdd?.();
        }}
      />
    </div>
  {/if}
</div>
