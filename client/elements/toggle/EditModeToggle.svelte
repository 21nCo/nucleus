<script lang="ts">
  import { isInEditMode } from "@nucleum/stores/app.store";
  import { Size } from "@21n/types/size.enum";
  import Button from "@21n/elements/button/Button.svelte";
  import Switch from "@21n/elements/toggle/Switch.svelte";
  let {
    isReadModeVariant = false
  }: {
    isReadModeVariant?: boolean;
  } = $props();
</script>

{#if isReadModeVariant}
  <Button
    tooltip="Toggle read mode"
    icon="book-open"
    size={Size.sm}
    onclick={() => isInEditMode.toggle()}
  />
{:else}
  <div class="rounded-full flex items-center gap-2 px-3 py-1">
    <span class="text-fgs3 text-b2"> edit: </span>
    <Switch
      on={$isInEditMode}
      size={Size.sm}
      ariaLabel="Edit mode"
      onChange={(event) => isInEditMode.toggle(event.detail)}
    />
  </div>
{/if}
