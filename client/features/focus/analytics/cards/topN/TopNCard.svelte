<script lang="ts">
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import Table2 from "@21n/elements/table/Table2.svelte";
  import view from "@nucleum/stores/view.store";
  import { Size } from "@21n/elements/size.enum";
  import {
    TableCellType,
    type TableColumn
  } from "@21n/elements/table/table.type";
  import { isValidArrayWithData } from "@21n/shared-utils/obj.utils";
  import { isValidString } from "@21n/shared-utils/text.utils";
  import {
    type IAnalyticsCard,
    type AnalyticsDataRecord
  } from "@nucleum/features/focus/analytics/analytics.types";
  import LabelColumnCell from "@nucleum/features/focus/analytics/cards/topN/LabelColumnCell.svelte";
  import PreviousValueColumnCell from "@nucleum/features/focus/analytics/cards/topN/PreviousValueColumnCell.svelte";
  import ValueColumnCell from "@nucleum/features/focus/analytics/cards/topN/ValueColumnCell.svelte";

  let {
    card,
    data,
    previousTimePeriodData = [],
    objectiveColors = []
  }: {
    card: IAnalyticsCard;
    data: AnalyticsDataRecord[];
    previousTimePeriodData?: AnalyticsDataRecord[];
    objectiveColors?: { label: string; color: number }[];
  } = $props();

  function resolveKey(record: AnalyticsDataRecord) {
    return card.isGroupByTopLevelObjectives
      ? record.topLevelObjectiveLabel
      : record.objectiveLabel;
  }

  function resolveObjectiveColor(objectiveLabel: string) {
    const color = objectiveColors.find((x) => x.label === objectiveLabel);
    if (color) {
      return color.color;
    }
    const parent = data.find(
      (x) => x.objectiveLabel === objectiveLabel
    )?.topLevelObjectiveLabel;
    const parentColor = objectiveColors.find((x) => x.label === parent);
    if (parentColor) {
      return parentColor.color;
    }
    return 0;
  }

  let top = $derived.by(() => {
    let sumFocusByObjective: { [objectiveLabel: string]: number } = {};
    for (let record of data) {
      if (sumFocusByObjective[resolveKey(record)]) {
        sumFocusByObjective[resolveKey(record)] += record.focus;
      } else {
        sumFocusByObjective[resolveKey(record)] = record.focus;
      }
    }
    return Object.entries(sumFocusByObjective)
      .sort(([, focusA], [, focusB]) => focusB - focusA)
      .map(([objectiveLabel, focus]) => {
        return {
          label: !isValidString(objectiveLabel)
            ? "No objective"
            : objectiveLabel,
          id: objectiveLabel,
          value: focus,
          previousValue: calculatePrevious(objectiveLabel)?.focus ?? 0,
          color: resolveObjectiveColor(objectiveLabel)
        };
      })
      .slice(0, 10);
  });

  function calculatePrevious(objectiveLabel: string) {
    let sumFocusByObjective: { [objectiveLabel: string]: number } = {};
    for (let record of previousTimePeriodData) {
      if (sumFocusByObjective[resolveKey(record)]) {
        sumFocusByObjective[resolveKey(record)] += record.focus;
      } else {
        sumFocusByObjective[resolveKey(record)] = record.focus;
      }
    }

    let previousEntry = Object.entries(sumFocusByObjective)
      .map(([objectiveLabel, focus]) => {
        return {
          objectiveLabel,
          focus
        };
      })
      .find((entry) => entry.objectiveLabel === objectiveLabel);
    return previousEntry;
  }
  let columns = $derived.by(() => {
    const nextColumns: TableColumn[] = [
      {
        key: "label",
        label: "Objective",
        type: TableCellType.CUSTOM,
        component:
          LabelColumnCell as unknown as ConstructorOfATypedSvelteComponent,
        width: $view.isPortrait ? 1.2 : 3
      },
      {
        key: "value",
        label: "Total focus",
        type: TableCellType.CUSTOM,
        component:
          ValueColumnCell as unknown as ConstructorOfATypedSvelteComponent
      }
    ];
    if (!$view.isPortrait) {
      nextColumns.push({
        key: "previousValue",
        label: "Change",
        type: TableCellType.CUSTOM,
        component:
          PreviousValueColumnCell as unknown as ConstructorOfATypedSvelteComponent
      });
    }
    return nextColumns;
  });
</script>

<div class="flex flex-col gap-2 w-full flex-grow">
  <Table2 {columns} data={top} />
  {#if !isValidArrayWithData(top)}
    <EmptyStatusView
      size={Size.sm}
      mainText="No data present."
      subText="Please select a different time range to see data."
    />
  {/if}
</div>
