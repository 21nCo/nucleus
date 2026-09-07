<script lang="ts">
  import view from "@nucleum/stores/view.store";
  import { TimeFormat } from "@21n/utils/time.type";
  import { properCase } from "@21n/shared-utils/text.utils";
  import { formatSeconds } from "@21n/utils/time.utils";
  import { cn } from "@21n/utils/ui.utils";

  let {
    value,
    type = "total"
  }: {
    value: number;
    type?: "total" | "focus" | "break";
  } = $props();
</script>

<div
  class={cn("flex flex-col grow items-start border border-brs3 rounded-md", {
    "w-24 sm:w-32 md:w-40 p-2 h-16": $view.isPortrait,
    "w-40 xl:w-[11rem] p-4 h-20": !$view.isPortrait
  })}
>
  <div class="text-b3">
    {properCase(type)}
  </div>
  <div
    class="font-medium {type === 'focus'
      ? 'text-aps1'
      : type === 'break'
        ? 'text-ass1'
        : ''} {$view.isPortrait ? 'text-base' : 'text-h2'}"
  >
    {formatSeconds(value, TimeFormat.CLOCK)}
  </div>
</div>
