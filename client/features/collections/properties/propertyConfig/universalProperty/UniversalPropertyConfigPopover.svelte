<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import SwitchInput from "@21n/elements/toggle/SwitchInput.svelte";
  import type { IUniversalPropertyConfig } from "@nucleum/features/collections/properties/property.type";
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import { universalPropertyOptions } from "@nucleum/features/collections/properties/property.store";
  let {
    config,
    onChange
  }: {
    config: IUniversalPropertyConfig;
    onChange: (e: Partial<IUniversalPropertyConfig>) => void;
  } = $props();
</script>

<div
  class="flex flex-col justify-between gap-4 h-80 p-3 bg-bgs1 border border-brs2 rounded-md"
>
  <div class="flex flex-col gap-2 overflow-y-auto">
    {#each universalPropertyOptions as option}
      <button
        class={cn(
          "flex items-center gap-2 w-full justify-between p-2 rounded-md",
          {
            "cursor-not-allowed text-fgs3": config.type === option.value,
            "hover:bg-bgs2": config.type !== option.value
          }
        )}
        onclick={() => {
          if (config.type === option.value) return;
          config.type = option.value;
          onChange({ type: option.value });
        }}
      >
        <span class="flex items-center gap-2">
          <Icon
            icon={option.icon}
            size={Size.sm}
            class={config.type === option.value ? "text-fgs3" : "text-fgs1"}
          />
          <span class="text-b2">{option.label}</span>
        </span>
        {#if config.type === option.value}
          <Icon icon="check-circle" size={Size.sm} />
        {/if}
      </button>
    {/each}
  </div>
  <div class="flex px-3">
    <SwitchInput
      label={{ label: "Allow multi selection" }}
      isExpanded={true}
      size={Size.sm}
      bind:checked={config.isMultiSelect}
      onChange={(e) => {
        onChange({ isMultiSelect: e.detail });
      }}
    />
  </div>
</div>
