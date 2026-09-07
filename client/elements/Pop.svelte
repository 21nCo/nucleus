<script lang="ts">
  import { IconVariant } from "@21n/elements/icon.type";
  import Icon from "@21n/elements/Icon.svelte";
  import { generateUID } from "@21n/utils/utils";
  import { Size } from "@21n/elements/size.enum";
  let {
    isVisible = false,
    hideCloseButton = false,
    hideHeader = false,
    size = Size.md,
    title = "",
    classList = "",
    style = "",
    onClose = () => {},
    children
  }: any = $props();

  function handleClose() {
    onClose();
  }
</script>

<div
  {style}
  class={`bg-bgs3  absolute transition-all motion-reduce:transition-none motion-reduce:hover:transition-none ${
    size === Size.lg
      ? `px-4 py-6 rounded-lg`
      : size === Size.md
        ? `px-3 py-4 rounded-md`
        : `px-2 py-2 rounded-sm`
  } ${classList} ${
    isVisible ? "visible scale-1 z-20" : "hidden scale-[0.95] -z-10"
  }`}
>
  {#if !hideHeader && (title || !hideCloseButton)}
    <div
      class={`flex justify-between ${!title && hideCloseButton ? `` : `mb-4`}`}
    >
      {#if title}
        <span
          class={`text-fgs1 ${
            size === Size.lg
              ? ` text-base`
              : size === Size.md
                ? ` text-b2`
                : ` text-b3`
          }`}>{title}</span
        >
      {/if}
      {#if !hideCloseButton}
        <Icon onclick={handleClose} icon="cross" />
      {/if}
    </div>
  {/if}
  {@render children?.()}
</div>
