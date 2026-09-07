<script lang="ts">
  import BreadcrumbMini from "@21n/elements/breadcrumb/BreadcrumbMini.svelte";
  import CustomColorPropagator from "@21n/elements/style/CustomColorPropagator.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import type { IObjectiveThumb } from "@nucleum/features/focus/goals/goal.type";
  import { resolveObjectiveColor } from "@nucleum/features/focus/goals/goal.utils";

  let { item }: { item: IObjectiveThumb } = $props();

  const parentLabels = $derived(
    item.parent
      ? item.parent
          .map((x) => x.label)
          .filter((label): label is string => Boolean(label))
      : []
  );
  const color = $derived(resolveObjectiveColor(item));
</script>

<CustomColorPropagator
  {color}
  class={cn("flex flex-col w-full items-start text-left userdata", {
    "text-ccs1": color
  })}
>
  {#if parentLabels}
    <BreadcrumbMini hierarchy={parentLabels} />
  {/if}
  {item.label ? item.label : "Untitled"}
</CustomColorPropagator>
