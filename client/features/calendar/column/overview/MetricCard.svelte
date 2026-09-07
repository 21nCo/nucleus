<script lang="ts">
  import { cn } from "@21n/utils/ui.utils";
  import view from "@nucleum/stores/view.store";

  let {
    label,
    value,
    isAccent = false,
    callback = undefined
  }: {
    label: string;
    value: number;
    isAccent?: boolean;
    callback?: (() => void) | undefined;
  } = $props();
</script>

<button
  class={cn(
    "flex flex-col items-start justify-between border border-brs3 rounded-md min-w-fit grow",
    {
      "p-2 h-16 bg-bgs2": $view.isPortrait,
      "p-2 h-fit dp:p-2": !$view.isPortrait,
      "cursor-pointer hover:bg-bgs2": callback,
      "cursor-default": !callback
    }
  )}
  onclick={callback}
>
  <div class="text-b2">
    {label}
  </div>
  <div class="flex gap-2 items-center">
    <div
      class={cn("font-medium min-w-fit text-base dp:text-h4 2k:text-h3", {
        "text-aps1": isAccent
      })}
    >
      {value}
    </div>
  </div>
</button>
