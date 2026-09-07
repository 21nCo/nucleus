<script lang="ts">
  import { Size } from "@21n/types/size.enum";
  import { formatSeconds } from "@21n/utils/time.utils";
  import { cn } from "@21n/utils/ui.utils";

  let {
    splits,
    size = Size.sm
  }: {
    splits: {
      focus: number;
      brek: number;
    };
    size?: Size.sm | Size.md;
  } = $props();
</script>

<div
  class={cn("flex gap-2 py-1 rounded-md", {
    "text-b3": size === Size.sm,
    "text-b2": size === Size.md
  })}
>
  <!-- <div class="min-w-fit text-fgs1">
      T:
      {formatSeconds(total)}
    </div> -->
  <div class="min-w-fit text-aps1">
    F:
    {formatSeconds(splits.focus)}
  </div>
  <div class="min-w-fit text-ass1">
    B:
    {formatSeconds(splits.brek)}
  </div>
</div>
