<script lang="ts">
  let {
    label,
    isActive = false,
    onclick = undefined
  }: {
    label: string;
    isActive?: boolean;
    onclick?: ((event: CustomEvent<{ label: string }>) => void) | undefined;
  } = $props();
  function handleClick() {
    const clickEvent = new CustomEvent<{ label: string }>("click", {
      detail: { label }
    });
    onclick?.(clickEvent);
  }
</script>

<button
  onclick={handleClick}
  class={isActive
    ? "bg-bgs3 flex flex-row p-4 rounded-md gap-4"
    : "bg-bgs2 flex flex-row p-4 rounded-md gap-4"}
>
  <div class="flex flex-row items-center truncate">
    <div class="text-h1">{label}</div>
  </div>
</button>
