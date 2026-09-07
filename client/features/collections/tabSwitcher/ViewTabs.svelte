<script lang="ts">
  import { hoverable } from "@nucleum/actions/hover.action";
  import CustomColorPropagator from "@21n/elements/style/CustomColorPropagator.svelte";
  import type { ISelectValue } from "@21n/types/select.type";
  import { cn } from "@21n/utils/ui.utils";
  import type { IViewTab } from "@nucleum/features/collections/tabSwitcher/viewTab.type";
  import TabCountBadge from "@nucleum/features/collections/counts/TabCountBadge.svelte";

  let {
    tabs,
    selected = $bindable(),
    hoveredItem = $bindable(),
    tabCounts = new Map(),
    onSelect = undefined
  }: {
    tabs: IViewTab[];
    selected?: ISelectValue | undefined;
    hoveredItem?: ISelectValue | undefined;
    tabCounts?: Map<string, number>;
    onSelect?: ((event: CustomEvent<ISelectValue>) => void) | undefined;
  } = $props();
  if (!selected) selected = tabs[0].value;

  function resolveCountKey(value: ISelectValue) {
    return value.toString();
  }

  function onTabHover(value: ISelectValue, isHovered: boolean) {
    hoveredItem = isHovered ? value : undefined;
  }
</script>

<div class="flex flex-1 min-w-0 mo:w-full mo:pb-1 overflow-x-auto gap-3">
  {#each tabs as option (option.value)}
    <CustomColorPropagator color={option.color} class="flex whitespace-nowrap">
      <button
        class={cn(
          "flex gap-2 items-center justify-center border rounded-md px-3 py-1 min-w-16 text-b2",
          !option.color && {
            "border-brs3 hover:bg-bgs2": selected !== option.value,
            "border-aps1 bg-aps1 text-abg": selected === option.value
          },
          option.color && {
            "border-ccs1 bg-ccs1 text-abg": selected === option.value,
            "border-ccs2 bg-ccs3":
              selected !== option.value && hoveredItem === option.value,
            "border-ccs2 bg-ccs5":
              selected !== option.value && hoveredItem !== option.value
          }
        )}
        use:hoverable={{
          onHover: (isHovered) => onTabHover(option.value, isHovered)
        }}
        onclick={() => {
          selected = option.value;
          onSelect?.(
            new CustomEvent<ISelectValue>("select", {
              detail: option.value
            })
          );
        }}
      >
        <span class="flex items-center gap-2">
          {option.label}
          {#if tabCounts.has(resolveCountKey(option.value))}
            <TabCountBadge
              count={tabCounts.get(resolveCountKey(option.value))}
              isActive={selected === option.value}
              hasCustomColor={!!option.color}
            />
          {/if}
        </span>
      </button>
    </CustomColorPropagator>
  {/each}
</div>
