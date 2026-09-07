<script lang="ts">
  import { Size } from "@21n/elements/size.enum";
  import { bg, cn } from "@21n/utils/ui.utils";
  import Icon from "@21n/elements/Icon.svelte";
  import Badge from "@21n/elements/text/Badge.svelte";
  import type { IContextMenuItem } from "@21n/elements/contextMenu/context-menu.type";
  import { hoverable } from "@nucleum/actions/hover.action";
  let {
    item,
    on = $bindable(false),
    size = Size.md,
    parentBgIndex = 1,
    isPreventFillOnActive = false,
    count = undefined,
    onChange = undefined
  }: {
    item: IContextMenuItem;
    on?: boolean;
    size?: Size.sm | Size.md | Size.lg;
    parentBgIndex?: number;
    isPreventFillOnActive?: boolean;
    count?: number | undefined;
    onChange?: ((event: CustomEvent<boolean>) => void) | undefined;
  } = $props();
  let isHovering = $state(false);

  $effect(() => {
    on = item.initialValue ?? false;
  });

  function resolveIcon(icon: IContextMenuItem["icon"]) {
    return typeof icon === "string" ? icon : undefined;
  }

  function onclick() {
    on = !on;
    const changeEvent = new CustomEvent<boolean>("change", { detail: on });
    onChange?.(changeEvent);
  }
</script>

<button
  onclick={onclick}
  use:hoverable={{
    onHover: (e) => {
      isHovering = e;
    }
  }}
  data-context-menu-item-id={item.value}
  class={cn(
    "contextmenuitem flex flex-col items-center justify-center rounded-md border flex-1",
    {
      "min-h-8 min-w-8": size === Size.sm,
      "min-h-10 min-w-10": size === Size.md,
      "min-h-16 min-w-16": size === Size.lg,
      [`${bg(parentBgIndex + 1)}-striped`]: isHovering,
      "bg-aps3 border-aps1 text-aps1": on,
      "border-brs4": !on && isHovering,
      "border-brs3": !on && !isHovering
    }
  )}
>
  <Icon
    icon={resolveIcon(on ? item.activeIcon ?? item.icon : item.icon)}
    size={size === Size.lg ? Size.md : size}
    isFilled={on && !isPreventFillOnActive}
    class={cn({
      "fill-aps1": on,
      "stroke-fgs1": !on
    })}
  />
  <span class="text-b3">{on ? item.activeLabel : item.label}</span>
  {#if count}
    <div class="absolute bottom-1 right-1">
      <Badge text={count} size={Size.sm} />
    </div>
  {/if}
</button>
