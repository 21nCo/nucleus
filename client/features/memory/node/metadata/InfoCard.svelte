<script lang="ts">
  import { bg, cn } from "@21n/utils/ui.utils";
  import { userPreferences } from "@nucleum/stores/preferences/user-preferences.store";
  import {
    formatDateRelativeToToday,
    formatDatetime
  } from "@21n/utils/time.utils";
  import Icon from "@21n/elements/Icon.svelte";

  let {
    label,
    value,
    parentBgIndex = 1,
    span = "",
    onclick = undefined
  }: {
    label: string;
    value: string | number | undefined;
    parentBgIndex?: number;
    span?: string;
    onclick?: ((event: MouseEvent) => void) | undefined;
  } = $props();

  function valueFormatter(value: string | string[] | number) {
    if (typeof value === "number") {
      return value;
    }
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return formatDateRelativeToToday(new Date(value));
    }
    return value;
  }
</script>

<button
  class={cn(
    "flex group items-start justify-between gap-1 rounded-md p-2 dp:px-3",
    span,
    bg(parentBgIndex)
  )}
  {onclick}
>
  <div class="flex flex-col items-start gap-1">
    <span class="text-fgs3 text-b3">{label}</span>
    <span class="text-fgs1 text-b2 whitespace-nowrap font-medium"
      >{valueFormatter(value ?? "NA")}</span
    >
  </div>
  <div
    class="h-full flex items-center opacity-0 group-hover:opacity-100 transition-all"
  >
    <Icon icon="chevron-right" class="text-fgs4" />
  </div>
</button>
