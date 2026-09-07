<script>
  import { tooltip } from "@nucleum/actions/popover.action";
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/elements/size.enum";

  let { onclick = undefined } = $props();
</script>

<div
  data-testid="quick-focus-unpin-action"
  class="absolute flex justify-center items-center w-6 h-6 border border-transparent hover:border-brs3 rounded-full right-0 -top-3 bg-bgs1 hover:bg-bgs2"
  use:tooltip={{
    text: "Unpin from quick focus"
  }}
  {onclick}
>
  <Icon icon="minus-circle" size={Size.md} class="fill-ars1" />
</div>
