<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/types/size.enum";
  let {
    item,
    size = Size.lg,
    onClick = undefined
  }: {
    item: string;
    size?: Size;
    onClick?: ((event: CustomEvent<{ item: string }>) => void) | undefined;
  } = $props();
  let isActive: boolean = false;
  function clickHandler() {
    isActive = !isActive;
    const clickEvent = new CustomEvent<{ item: string }>("click", {
      detail: { item }
    });
    onClick?.(clickEvent);
  }
</script>

<button
  class="outline outline-a1 rounded-full flex justify-center items-center {isActive
    ? 'bg-aps1'
    : 'bg-none'} {size === Size.lg
    ? 'w-16 h-16'
    : size === Size.md
      ? 'w-12 h-12'
      : 'w-12 h-12'}"
  onclick={clickHandler}
>
  <Icon icon={item} {size} {isActive} />
</button>
