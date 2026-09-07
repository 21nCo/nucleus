<script lang="ts">
  import { enumToString, properCase } from "@21n/shared-utils/text.utils";
  import { cn } from "@21n/utils/ui.utils";
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/elements/size.enum";
  import { ContextMenuType, type IContextMenuItem } from "@21n/elements/contextMenu/context-menu.type";
  import Badge from "@21n/elements/text/Badge.svelte";
  import Switch from "@21n/elements/toggle/Switch.svelte";
  let {
    item,
    checked = $bindable(false),
    isRedAccent = false,
    onChange = undefined
  }: {
    item: IContextMenuItem;
    checked?: boolean;
    isRedAccent?: boolean;
    onChange?: ((event: CustomEvent<boolean>) => void) | undefined;
  } = $props();

  export function toggle() {
    if (item.type === ContextMenuType.SWITCH) {
      checked = !checked;
      onChange?.(new CustomEvent<boolean>("change", { detail: checked }));
    }
  }

  function handleSwitchChange(event: CustomEvent<boolean>) {
    onChange?.(new CustomEvent<boolean>("change", { detail: event.detail }));
  }

  $effect(() => {
    if (item.type !== ContextMenuType.SWITCH) return;
    checked = item.initialValue ?? false;
  });
</script>

<span class="flex items-center gap-2.5 flex-1 min-w-0">
  {#if item.icon && typeof item.icon === "string"}
    <Icon
      size={Size.sm}
      icon={item.icon}
      class={cn({
        "stroke-ars1": isRedAccent
      })}
    />
  {/if}
  <span
    class={cn("min-w-fit whitespace-nowrap", {
      "text-ars1": isRedAccent
    })}>
    {item.label ??
      (item.value != null ? properCase(enumToString(item.value.toString())) : "")}
  </span>
</span>
{#if item.secondStepComponent || item.action}
  <Icon icon="chevron-right" size={Size.sm} />
{/if}
{#if item.badge && !item.action && !item.secondStepComponent}
  <Badge text={item.badge} />
{/if}
{#if item.type === ContextMenuType.SWITCH}
  <Switch bind:on={checked} size={Size.sm} onChange={handleSwitchChange} />
{/if}
