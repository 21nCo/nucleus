<script lang="ts">
  import type { ClassListProp } from "@21n/elements/autocomplete/classListProp.type";
  let {
    style,
    label,
    id,
    isActive = false,
    isSelected = false,
    onClick = undefined
  }: {
    style: string;
    label: string;
    id: string;
    isActive?: boolean;
    isSelected?: boolean;
    onClick?: ((detail: { label: string; id: string }) => void) | undefined;
  } = $props();
  const classList: ClassListProp = {
    active: "bg-aps1 text-bgs1",
    inactive: "bg-bgs2",
    common: "bg-bgs2 hover:bg-bgs3",
    selected: "bg-bgs4"
  };
  function handleClick() {
    onClick?.({ label, id });
  }
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      handleClick();
    }
  }
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
{#if label && id}
  <div
    tabindex="0"
    {style}
    onclick={handleClick}
    onkeydown={handleKeyDown}
    class={`cursor-pointer text-b2 py-2 px-2.5  ${classList.common} ${
      isSelected
        ? classList.selected
        : isActive
          ? `${classList.active}`
          : classList.inactive
    }`}
  >
    {label}
  </div>
{/if}
