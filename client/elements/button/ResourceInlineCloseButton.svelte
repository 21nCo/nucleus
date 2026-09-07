<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import { ButtonStyle, ButtonVariant } from "@21n/types/button.type";
  import { appStore } from "@nucleum/stores/app.store";
  import { AccessMode } from "@nucleum/datafn/resource.type";
  import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";
  import { Size } from "@21n/types/size.enum";
  let {
    id,
    accessMode,
    parentBgIndex = 1,
    additionalAccessModes = []
  }: {
    id: string;
    accessMode: AccessMode;
    parentBgIndex?: number;
    additionalAccessModes?: AccessMode[];
  } = $props();
  const elementIdSuffix = generateSimpleRandomId();
  const elementId = $derived(`${id}-closeButton-${elementIdSuffix}`);
  const tooltip = $derived(
    accessMode === AccessMode.FULL ? "Close full screen" : "Close"
  );
</script>

{#if accessMode === AccessMode.SPLIT || accessMode === AccessMode.FULL || accessMode === AccessMode.FSPLIT || accessMode === AccessMode.SHEET || additionalAccessModes.includes(accessMode)}
  <div
    class="flex justify-center items-center"
    id={elementId}
    data-accessMode={accessMode}
  >
    <Button
      icon="cross"
      ariaLabel="Close"
      {tooltip}
      style={ButtonStyle.OUTLINED}
      type={ButtonVariant.DANGER}
      {parentBgIndex}
      size={Size.sm}
      onclick={() => {
        if (accessMode === AccessMode.FULL) {
          appStore.toggleFullScreen(accessMode, id);
        } else {
          appStore.closeResource({ id, accessMode });
        }
      }}
    />
  </div>
{/if}
