<script lang="ts">
  import Avatar from "@21n/elements/avatarPicker/Avatar.svelte";
  import Button from "@21n/elements/button/Button.svelte";
  import CustomColorPropagator from "@21n/elements/style/CustomColorPropagator.svelte";
  import { Size } from "@21n/types/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import { markdownSettings } from "@nucleum/components/markdown/markdown.settings";
  import type { ICalloutSetting } from "@nucleum/components/markdown/md.type";
  let {
    selected = $bindable(),
    onSelect,
    onEdit
  }: {
    selected?: ICalloutSetting;
    onSelect?: (callout: ICalloutSetting) => void;
    onEdit?: () => void;
  } = $props();
</script>

<div
  class="flex flex-col gap-1 text-left border border-brs2 rounded-md p-4 bg-bgs1 w-80"
>
  {#each $markdownSettings.callout as callout}
    <CustomColorPropagator
      color={callout.color}
      type="button"
      class={cn(
        "flex items-center gap-2 p-2 rounded-md text-ccs1 h-11",
        selected?.id === callout.id && "bg-ccs4",
        selected?.id !== callout.id && "hover:bg-ccs4"
      )}
      onclick={() => {
        selected = callout;
        onSelect?.(callout);
      }}
    >
      <Avatar avatar={callout.avatar} />
      <span>{callout.label}</span>
    </CustomColorPropagator>
  {/each}
  <div class="flex justify-center mt-8">
    <Button
      icon="edit"
      label="Edit"
      size={Size.xs}
      isPreventMinWidth={true}
      onclick={() => {
        onEdit?.();
      }}
    />
  </div>
</div>
