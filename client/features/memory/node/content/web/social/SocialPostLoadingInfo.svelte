<script lang="ts">
  import { cn } from "@21n/utils/ui.utils";

  let {
    loading,
    error,
    platform = "social"
  }: {
    loading: boolean;
    error: string;
    platform?: string;
  } = $props();
</script>

<div
  class={cn("mt-16", {
    "text-fgs3": loading,
    "text-ars1": error
  })}
>
  {loading
    ? `Loading ${platform} post...`
    : error || `Unable to load ${platform} post`}
</div>
