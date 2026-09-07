<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import { abg, cn } from "@21n/utils/ui.utils";
  import { Size } from "@21n/elements/size.enum";
  let {
    label,
    id,
    icon = "",
    isActive = false,
    onClick = undefined
  }: {
    label: string;
    id: string;
    icon?: string | undefined;
    isActive?: boolean;
    onClick?:
      | ((event: CustomEvent<{ label: string; id: string }>) => void)
      | undefined;
  } = $props();

  function handleTagClick() {
    onClick?.(new CustomEvent("click", { detail: { label, id } }));
  }
</script>

<button
  onclick={handleTagClick}
  class={cn(
    "w-fit flex items-center justify-center gap-1 whitespace-nowrap text-b3 border rounded-md py-1 px-3 transition-all active:scale-105",
    {
      "border-aps1": isActive,
      [abg()]: isActive,
      "border-fgs2": !isActive
    }
  )}
>
  {#if icon}
    <Icon isAccentBgContext={isActive} {icon} size={Size.sm} />
  {/if}
  {label}
</button>
