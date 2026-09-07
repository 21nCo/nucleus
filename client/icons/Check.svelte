<script lang="ts">
  import type { HTMLButtonAttributes } from "svelte/elements";
  import { Size } from "@21n/elements/size.enum";

  let {
    isChecked = false,
    isAccentBgActive = false,
    isRounded = false,
    size = Size.md,
    onclick = undefined,
    ...buttonProps
  }: {
    isChecked?: boolean;
    isAccentBgActive?: boolean;
    isRounded?: boolean;
    size?: Size.sm | Size.md | Size.lg;
    onclick?:
      | ((event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => void)
      | undefined;
  } & HTMLButtonAttributes = $props();

  const width = $derived(size === Size.sm ? 15 : size === Size.md ? 18 : 20);
</script>

<button
  {...buttonProps}
  {onclick}
  onmousedown={(e) => e.preventDefault()}
>
  {#if isChecked}
    <svg
      {width}
      height={width}
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="0.5"
        y="0.5"
        width="14"
        height="14"
        rx={isRounded ? "20" : "2.5"}
        class="fill-fgs1"
      />
      <path
        d="M5.90595 10.7484C5.65047 10.7485 5.40546 10.647 5.22497 10.4662L3.16615 8.40814C2.94462 8.18654 2.94462 7.82732 3.16615 7.60572C3.38775 7.38419 3.74696 7.38419 3.96857 7.60572L5.90595 9.5431L11.0314 4.41761C11.253 4.19608 11.6123 4.19608 11.8339 4.41761C12.0554 4.63921 12.0554 4.99843 11.8339 5.22003L6.58692 10.4662C6.40643 10.647 6.16142 10.7485 5.90595 10.7484Z"
        class="fill-bgs1"
      />
      <rect
        x="0.5"
        y="0.5"
        width="14"
        height="14"
        rx={isRounded ? "20" : "2.5"}
        class="stroke-fgs1"
      />
    </svg>
  {:else}
    <svg
      {width}
      height={width}
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="0.5"
        y="0.5"
        width="14"
        height="14"
        rx={isRounded ? "20" : "2.5"}
        class={isAccentBgActive ? "custom-stroke" : "stroke-fgs1"}
      />
    </svg>
  {/if}
</button>

<style>
  .custom-stroke {
    stroke: var(--fgwhencustombg, rgba(var(--colors-fgs1), 1));
  }
</style>
