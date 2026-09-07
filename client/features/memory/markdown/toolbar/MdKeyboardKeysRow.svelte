<script lang="ts">
  import { cn } from "@21n/utils/ui.utils";
  import KeyboardToolbarKey from "@21n/elements/keyboardToolbar/KeyboardToolbarKey.svelte";
  import Icon from "@21n/elements/Icon.svelte";
  import { fly } from "svelte/transition";
  let {
    onKey = undefined,
    onClose = undefined
  }: {
    onKey?: ((key: string) => void) | undefined;
    onClose?: (() => void) | undefined;
  } = $props();
</script>

<div
  class={cn(
    "flex items-center justify-start gap-1.5 min-w-0 flex-1 h-full overflow-x-auto text-fgs1 pr-1 pl-2 bg-bgs2",
    {
      // "bg-[#D1D4D9] dark:bg-[#2b2b2d]": $context.os === OperatingSystem.IOS
      // "[background:linear-gradient(65deg,#D1D4D9_0%,#D1D4D9_90%,white_90%,white_100%)] dark:[background:linear-gradient(65deg,#2C2C2C_0%,#2C2C2C_90%,black_90%,black_100%)]":
      //   $context.os === OperatingSystem.IOS
    }
  )}
  in:fly={{ y: 10 }}
>
  <KeyboardToolbarKey
    icon="at"
    onclick={() => {
      onKey?.("@");
    }}
  />
  <KeyboardToolbarKey
    icon="hash"
    onclick={() => {
      onKey?.("#");
    }}
  />
  <KeyboardToolbarKey
    icon="asterisk"
    onclick={() => {
      onKey?.("*");
    }}
  />
  <KeyboardToolbarKey
    icon="quote"
    onclick={() => {
      onKey?.('"');
    }}
  />
  <KeyboardToolbarKey
    icon="brackets-square"
    onclick={() => {
      onKey?.("[]");
    }}
  />
  <KeyboardToolbarKey
    icon="hugeicons:solid-line-01"
    onclick={() => {
      onKey?.("-");
    }}
  />
  <button
    class="p-1 h-[42px] rounded-md flex items-center justify-center flex-1 min-w-0 hover:bg-bgs3"
    onclick={() => {
      onClose?.();
    }}
  >
    <Icon icon="ph:caret-line-down-light" />
  </button>
</div>
