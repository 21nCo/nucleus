<script lang="ts">
  let {
    factor,
    isActive = false,
    parentBackgroundIndex = 1,
    onclick = undefined
  }: {
    factor: number;
    isActive?: boolean;
    parentBackgroundIndex?: number;
    onclick?: ((event: MouseEvent) => void) | undefined;
  } = $props();
  void parentBackgroundIndex;
  const classList = $derived.by(() => {
    let value = "h-16 w-28 rounded-md ";
    if (factor === 0) {
      value += " text-b2";
    } else if (factor === 1) {
      value += " text-base";
    } else if (factor === 2) {
      value += " text-h3";
    }
    return value;
  });
  const label = $derived(
    factor === 0 ? "smaller" : factor === 1 ? "default" : "larger"
  );
</script>

<div class="flex flex-col gap-1 items-center">
  <button
    {onclick}
    data-selected={isActive ? "true" : "false"}
    class={classList + (isActive ? " bg-aps1 text-bgs1" : " bg-bgs2 text-fgs3")}
    >Abc</button
  >
  <div class={isActive ? "text-aps1" : "text-fgs3"}>{label}</div>
</div>
