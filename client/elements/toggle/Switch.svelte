<script lang="ts">
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";
  let {
    on = $bindable(false),
    id = "toggle-switch" + generateSimpleRandomId(),
    size = Size.md,
    isDisabled = false,
    ariaLabel = undefined,
    onChange = undefined
  }: {
    on?: boolean;
    id?: string;
    size?: Size;
    isDisabled?: boolean;
    ariaLabel?: string | undefined;
    onChange?: ((event: CustomEvent<boolean>) => void) | undefined;
  } = $props();

  function handleChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement | null;
    if (!input) return;
    on = input.checked;
    if (typeof onChange === "function") {
      onChange(new CustomEvent("change", { detail: on }));
    }
  }
</script>

<label
  class={cn("flex items-center", {
    "cursor-not-allowed opacity-40": isDisabled,
    "cursor-pointer": !isDisabled
  })}
  for={id}
>
  <div class="relative">
    <input
      type="checkbox"
      {id}
      checked={on}
      aria-label={ariaLabel}
      class="absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0"
      disabled={isDisabled}
      onchange={handleChange}
      onclick={(event) => {
        event.stopPropagation();
      }}
    />
    <div
      data-class={"block bg-bgs4 rounded-full" +
        (size == Size.sm ? " w-7 h-4" : " w-[48px] h-6")}
      class={cn("block rounded-full", {
        "w-7 h-4": size == Size.sm,
        "w-[48px] h-6": size != Size.sm,
        "bg-bgs4": !on,
        "bg-aps1": on
      })}
    />
    <div
      class={cn("dot absolute bg-bgs1 rounded-full transition", {
        "w-3 h-3 left-0.5 top-0.5": size == Size.sm,
        "w-[22px] h-5 left-0.5 top-0.5": size != Size.sm
      })}
    />
  </div>
</label>

<style>
  input:checked + .block + .dot {
    transform: translateX(100%);
  }
</style>
