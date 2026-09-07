<script lang="ts">
  import { tooltip as tooltipAction } from "@nucleum/actions/popover.action";
  import { ButtonStyle, ButtonVariant } from "@21n/elements/button/button.type";
  import { Size } from "@21n/elements/size.enum";
  import { haptic } from "@21n/utils/embed.utils";
  import { cn } from "@21n/utils/ui.utils";
  import Icon from "@21n/elements/Icon.svelte";
  let {
    icon,
    size = Size.md,
    label = undefined,
    tooltip = undefined,
    type = ButtonVariant.SECONDARY,
    style = ButtonStyle.DEFAULT,
    onclick = undefined
  }: any = $props();
</script>

<div class="flex flex-col gap-1 items-center justify-center">
  <button
    class={cn(
      "flex items-center justify-center rounded-full",
      {
        "w-16 h-16": size === Size.lg,
        "w-14 h-14": size === Size.md,
        "w-10 h-10": size === Size.sm,
        "notouch:hover:bg-bgs1-striped active:bg-bgs2":
          style === ButtonStyle.PLAIN
      },
      style === ButtonStyle.DEFAULT && {
        "notouch:hover:brightness-110 active:brightness-110": true,
        "bg-aps1": type === ButtonVariant.PRIMARY,
        "bg-ars1": type === ButtonVariant.DANGER,
        "bg-bgs2": type === ButtonVariant.SECONDARY
      },
      style === ButtonStyle.OUTLINED && {
        "notouch:hover:brightness-90 active:brightness-90": true,
        border: true,
        "border-aps1": type === ButtonVariant.PRIMARY,
        "border-ars1": type === ButtonVariant.DANGER,
        "border-brs3": type === ButtonVariant.SECONDARY
      }
    )}
    use:tooltipAction={{
      text: tooltip
    }}
    onclick={(event) => {
      haptic();
      onclick?.(event);
    }}
  >
    <Icon
      {icon}
      {size}
      class={cn(
        style === ButtonStyle.DEFAULT && {
          "text-abg":
            type === ButtonVariant.PRIMARY || type === ButtonVariant.DANGER,
          "text-fgs1": type === ButtonVariant.SECONDARY
        },
        style === ButtonStyle.OUTLINED && {
          "text-aps1": type === ButtonVariant.PRIMARY,
          "text-ars1": type === ButtonVariant.DANGER,
          "text-fgs1": type === ButtonVariant.SECONDARY
        }
      )}
    />
  </button>
  {#if label}
    <p class="text-b3 text-fgs2">{label}</p>
  {/if}
</div>
