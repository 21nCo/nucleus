<script lang="ts">
  import { AlertType } from "@nucleum/stores/notifications/notification.type";
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  let {
    message = $bindable(null),
    type = AlertType.INFO,
    size = Size.md,
    isDissappear = true
  }: {
    message?: string | null;
    type?: AlertType;
    size?: Size.sm | Size.md | Size.lg;
    isDissappear?: boolean;
  } = $props();
  let timer: ReturnType<typeof setTimeout> | undefined = undefined;
  $effect(() => {
    if (!message || !isDissappear) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      message = null;
    }, 4000);
    return () => clearTimeout(timer);
  });
</script>

<div class="h-6 w-full flex justify-center">
  {#if message}
    <div
      class={cn({
        "text-ars1": type === AlertType.ERROR,
        "text-ass1": type === AlertType.WARNING,
        "text-ags1": type === AlertType.SUCCESS,
        "text-fgs2": type === AlertType.INFO,
        "text-base": size === Size.lg,
        "text-b2": size === Size.md,
        "text-b3": size === Size.sm
      })}
    >
      {message}
    </div>
  {/if}
</div>
