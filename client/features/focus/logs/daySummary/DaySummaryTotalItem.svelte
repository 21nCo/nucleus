<script lang="ts">
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

<span class="flex gap-1 items-center text-b2 userdata">
  <span class="text-fgs3"> {properCase(type)}:</span>
  <span
    class={cn({
      "text-aps1": type === "focus",
      "text-ass1": type === "break"
    })}
  >
    {formatSeconds(value)}
  </span>
</span>
