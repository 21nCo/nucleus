<script lang="ts">
  import { tooltip } from "@nucleum/actions/popover.action";
  import Divider from "@21n/elements/Divider.svelte";
  import Icon from "@21n/elements/Icon.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import OptionSelector from "@21n/elements/select/OptionSelector.svelte";
  import Text from "@21n/elements/text/Text.svelte";
  import { phosphorRatingIcons } from "@21n/icons-v2/icons-list";
  import { Orientation } from "@21n/elements/direction.enum";
  import { Size } from "@21n/elements/size.enum";
  import { TextStyle } from "@21n/elements/text/text.enum";
  import { cn } from "@21n/utils/ui.utils";
  let {
    onAvatarSelect,
    onSizeSelect,
    scale = 5,
    avatar = $bindable("")
  }: {
    onAvatarSelect: (icon: string) => void;
    onSizeSelect: (size: number) => void;
    scale?: number;
    avatar?: string;
  } = $props();
  let _scale = $state<number | "custom">("custom");
  let _customScaleValue = $state(5);

  $effect(() => {
    _scale = scale === 3 || scale === 5 || scale === 10 ? scale : "custom";
    _customScaleValue = scale;
  });
</script>

<div
  class="flex flex-col gap-3 w-80 h-96 bg-bgs1 border border-brs3 rounded-md p-3"
>
  <OptionSelector
    size={Size.sm}
    labelProps={{ label: "Scale" }}
    options={[{ value: 3 }, { value: 5 }, { value: 10 }, { value: "custom" }]}
    parentBackgroundIndex={2}
    bind:selected={_scale}
    onSelect={() => {
      if (_scale !== "custom") {
        _customScaleValue = _scale;
        onSizeSelect(_scale);
      }
    }}
  />
  {#if _scale === "custom"}
    <TextInput
      type="number"
      bind:value={_customScaleValue}
      onChange={() => {
        onSizeSelect(_customScaleValue);
      }}
      placeholder="Enter custom scale"
    />
  {/if}
  <Divider orientation={Orientation.Horizontal} />
  <Text content="Select an icon" style={TextStyle.SECTION_HEADING_SMALL} />
  <div class="flex flex-wrap overflow-y-auto h-full">
    {#each phosphorRatingIcons as icon}
      <button
        class={cn(
          "w-10 h-10 rounded-md flex items-center justify-center hover:bg-bgs2 cursor-pointer",
          {
            "bg-aps3": icon === avatar
          }
        )}
        use:tooltip={{ text: icon }}
        onclick={() => {
          avatar = icon;
          onAvatarSelect(icon);
        }}
      >
        <Icon
          icon={"ph:" + icon}
          size={Size.lg}
          class={cn({
            "text-aps1": icon === avatar
          })}
        />
      </button>
    {/each}
  </div>
</div>
