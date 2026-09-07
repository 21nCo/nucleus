<script lang="ts">
  import { Arrangement, Orientation } from "@21n/elements/direction.enum";
  import Slider from "@21n/elements/slider/Slider.svelte";
  import VerticalSwitcher from "@21n/elements/switcher/VerticalSwitcher.svelte";
  import { VerticalSwitcherStyle } from "@21n/elements/switcher/switcher.enum";
  import Text from "@21n/elements/text/Text.svelte";
  import { TextStyle } from "@21n/elements/text/text.enum";
  import SwitchInput from "@21n/elements/toggle/SwitchInput.svelte";
  import { Size } from "@21n/elements/size.enum";
  import OptionSelector from "@21n/elements/select/OptionSelector.svelte";
  import { Resource } from "@nucleum/datafn/resource.enum";
  let {
    density = $bindable(1),
    arrangement = $bindable(Arrangement.LIST),
    isHideThumbnailPreview = $bindable(false),
    isHideThumbnailTitle = $bindable(false),
    allArrangements,
    resource,
    onDensityChange,
    onPreviewSettingChange,
    onTitleSettingChange,
    onArrangementChange
  }: {
    density?: number;
    arrangement?: Arrangement;
    isHideThumbnailPreview?: boolean;
    isHideThumbnailTitle?: boolean;
    allArrangements: {
      value: Arrangement;
      label: string;
      icon: string;
    }[];
    resource: Resource;
    onDensityChange: (density: number) => void;
    onPreviewSettingChange: (event: CustomEvent) => void;
    onTitleSettingChange: (event: CustomEvent) => void;
    onArrangementChange: (event: CustomEvent) => void;
  } = $props();
  let initializedArrangement = $state(false);
  let initializedDensity = $state(false);

  $effect(() => {
    if (!initializedArrangement) {
      initializedArrangement = true;
      return;
    }
    onArrangementChange(new CustomEvent("switch", { detail: arrangement }));
  });

  $effect(() => {
    if (!initializedDensity) {
      initializedDensity = true;
      return;
    }
    onDensityChange(density ?? 1);
  });
</script>

<div class="flex flex-col gap-2 p-2 py-4 w-56 bg-bgs1">
  <div class="px-2 text-left">
    <Text content="Arrangement" style={TextStyle.SECTION_HEADING_SMALL} />
  </div>
  <VerticalSwitcher
    labelOrientation={Orientation.Horizontal}
    style={VerticalSwitcherStyle.BG}
    items={allArrangements}
    bind:selected={arrangement}
  />
  {#if arrangement === Arrangement.MASONRY}
    <div class="flex flex-col w-full gap-4 mt-4">
      <span class="px-2">
        <SwitchInput
          label={{ label: "Hide title" }}
          size={Size.sm}
          isExpanded={true}
          bind:checked={isHideThumbnailTitle}
          onChange={onTitleSettingChange}
        />
      </span>
      <div class="flex flex-col gap-1 px-2">
        <span class="text-fgs3 text-b3">Sizing</span>
        <OptionSelector
          size={Size.sm}
          options={[
            { label: "s", value: 2.5 },
            { label: "m", value: 2 },
            { label: "l", value: 1.5 },
            { label: "xl", value: 1 }
          ]}
          bind:selected={density}
        />
      </div>
    </div>
  {:else if arrangement === Arrangement.GRID && resource === Resource.node}
    <span class="px-2">
      <SwitchInput
        label={{ label: "Hide preview" }}
        size={Size.sm}
        isExpanded={true}
        bind:checked={isHideThumbnailPreview}
        onChange={onPreviewSettingChange}
      />
    </span>
  {/if}
</div>
