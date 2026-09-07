<script lang="ts">
  import type { Snippet } from "svelte";
  import DropDown from "@21n/elements/dropdown/DropDown.svelte";
  import { DropDownStyle } from "@21n/types/dropdownItem.type";
  import { appConstants } from "@nucleum/stores/app.store";
  let { children }: { children?: Snippet } = $props();
  let items = appConstants.colorSchemes.map((x) => ({
    value: x.tailwindSelector,
    label: x.label + " " + (x.isDark ? "dark" : "light")
  }));
  let className: string = items[0].value;

  function handleWrapperClick(event: MouseEvent) {
    event.stopPropagation();
  }
</script>

<div
  class={className + " bg-bgs1 border border-fgs1"}
  onclick={handleWrapperClick}
>
  <DropDown
    bind:value={className}
    {items}
    value={items[0].value}
    style={DropDownStyle.OUTLINED}
    isActive={true}
  />
  <div
    class="flex items-center justify-center"
    style="min-width:320px; min-height:500px;padding:20px;"
  >
    {@render children?.()}
  </div>
</div>
