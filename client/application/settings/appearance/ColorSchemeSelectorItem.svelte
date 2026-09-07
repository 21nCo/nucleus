<script lang="ts">
  import appearance from "@nucleum/stores/appearance.store";
  import { AppSkin, type ColorScheme } from "@21n/theme/appearance.type";
  import { properCase } from "@21n/shared-utils/text.utils";
  import { cn } from "@21n/utils/ui.utils";
  import { Size } from "@21n/elements/size.enum";
  import { userPreferences } from "@nucleum/stores/preferences/user-preferences.store";
  let {
    colorScheme,
    isActive,
    size = Size.md,
    onclick = undefined
  }: {
    colorScheme: ColorScheme;
    isActive: boolean;
    size?: Size.sm | Size.md;
    onclick?: ((event: MouseEvent) => void) | undefined;
  } = $props();
  function getColors(colorScheme: ColorScheme) {
    return [
      colorScheme.colors.bgs1 ?? "",
      colorScheme.colors.bgs2 ?? "",
      colorScheme.colors.bgs3 ?? "",
      colorScheme.colors.aps1 ?? ""
    ];
  }

  function resolveColors(scheme: ColorScheme) {
    if ($userPreferences?.appearance?.skin == AppSkin.Glassy) {
      return Object.values(scheme.colors).filter(
        (color): color is string => Boolean(color)
      );
    }
    const colors = getColors(scheme);
    if (size == Size.sm) {
      return colors.slice(2);
    }
    return colors.slice(1);
  }
  const colors = $derived(resolveColors(colorScheme));
</script>

<button
  {onclick}
  data-selected={isActive}
  class={cn(
    "relative flex flex-col items-center mx-2 rounded-md border border-brs3",
    {
      "bg-bgs3": isActive,
      "bg-bgs2 hover:bg-bgs1": !isActive,
      "p-2 text-b3 gap-1.5 w-20": size == Size.sm,
      "p-3 max-w-[7rem] text-b2 gap-2 grow": size == Size.md
    }
  )}
>
  {#if colors && $userPreferences?.appearance?.skin != AppSkin.Glassy}
    <div class="flex w-full shadow-sm">
      {#each colors as color, colorIndex}
        <div
          class="grow w-5 h-6 {colorIndex === 0
            ? 'rounded-l'
            : colorIndex === colors.length - 1
              ? 'rounded-r'
              : ''}"
          style="background-color: {color}"
        ></div>
      {/each}
    </div>
  {/if}
  {properCase(colorScheme.label)}
  {#if isActive}
    <div
      class={cn(
        "active-marker absolute border-2 inset-0 left-0 top-0 border-aps1 rounded-lg"
      )}
    ></div>
  {/if}
</button>

<style>
  .active-marker {
    height: calc(100% + 8px);
    width: calc(100% + 8px);
    margin: -4px;
  }
</style>
