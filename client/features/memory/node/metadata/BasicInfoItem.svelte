<script lang="ts">
  import { userPreferences } from "@nucleum/stores/preferences/user-preferences.store";
  import { formatDatetime } from "@21n/utils/time.utils";

  let {
    label,
    value = undefined,
    children
  }: {
    label: string;
    value?: string | string[] | number | undefined;
    children?: import("svelte").Snippet | undefined;
  } = $props();
  function valueFormatter(value: string | string[] | number) {
    if (typeof value === "number") {
      return value;
    }
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return formatDatetime($userPreferences, new Date(value));
    }
    return value;
  }
</script>

{#if label}
  <div class="flex justify-between gap-2 items-center w-full">
    <span class="text-fgs3 text-b3">{label}</span>
    {@render children?.()}
    {#if !children}
      {#if value}
        <span class="text-fgs1 text-b2 text-right">{valueFormatter(value)}</span
        >
      {/if}
    {/if}
  </div>
{/if}
