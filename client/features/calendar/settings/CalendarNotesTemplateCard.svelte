<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import Text from "@21n/elements/text/Text.svelte";
  import { ButtonStyle } from "@21n/types/button.type";
  import { Size } from "@21n/types/size.enum";
  import { TextStyle } from "@21n/types/text.enum";
  import { TimeScaleUnit } from "@21n/types/time.type";
  let {
    scale,
    description = null,
    onEdit
  }: {
    scale: TimeScaleUnit;
    description?: string | null;
    onEdit: () => void;
  } = $props();
  const title = $derived(
    scale === TimeScaleUnit.DAY
      ? "Daily notes"
      : scale === TimeScaleUnit.MONTH
        ? "Monthly notes"
        : "Yearly notes"
  );
  const defaultDescription = $derived(
    `Customize the template used when creating new ${title.toLowerCase()}`
  );
</script>

<div
  class="flex flex-col gap-8 items-center justify-between p-4 rounded-md border border-brs2 bg-bgs2"
>
  <div class="flex flex-col gap-3 items-start w-full">
    <Text content={title} style={TextStyle.FORM_LABEL} />
    <span class="text-b2 text-fgs3">{description || defaultDescription}</span>
  </div>
  <Button
    style={ButtonStyle.OUTLINED}
    size={Size.sm}
    label="Edit"
    isPreventMinWidth={true}
    icon="edit"
    onclick={onEdit}
  />
</div>
