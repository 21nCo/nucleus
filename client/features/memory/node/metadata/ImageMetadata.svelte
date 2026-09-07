<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/types/size.enum";
  import type { IImageMetadata } from "@nucleum/features/memory/node/node.type";
  import BasicInfoItem from "@nucleum/features/memory/node/metadata/BasicInfoItem.svelte";
  let {
    metadata = undefined,
    renderingDetails = undefined
  }: {
    metadata?: IImageMetadata | undefined;
    renderingDetails?: any;
  } = $props();

  function isDeviceInfoIsPresent(deviceInfo: any) {
    return deviceInfo?.make || deviceInfo?.model || deviceInfo?.deviceLabel;
  }
</script>

<div class="flex flex-col gap-3 rounded-md mo:p-2 p-4 w-full bg-bgs2">
  {#if metadata?.deviceInfo && isDeviceInfoIsPresent(metadata?.deviceInfo)}
    <BasicInfoItem label="Device">
      <span class="flex text-b2 gap-1">
        {#if ["iPhone"].some((m) => metadata?.deviceInfo?.model?.includes(m))}
          <Icon icon="device-mobile" size={Size.sm} />
        {:else if ["iPad"].some( (m) => metadata?.deviceInfo?.model?.includes(m) )}
          <Icon icon="device-tablet" size={Size.sm} />
        {:else if ["Mac"].some((m) => metadata?.deviceInfo?.model?.includes(m))}
          <Icon icon="desktop" size={Size.sm} />
        {/if}
        <span>
          {metadata?.deviceInfo?.make ?? ""}
          {metadata?.deviceInfo?.model ?? ""}
          {metadata?.deviceInfo?.deviceLabel
            ? " - " + metadata?.deviceInfo?.deviceLabel
            : ""}
        </span>
      </span>
    </BasicInfoItem>
  {/if}
  {#if metadata?.cameraSettings}
    {#if metadata?.cameraSettings?.aperture}
      <BasicInfoItem label="Aperture">
        <span class="flex gap-1">
          <Icon icon="aperture" size={Size.sm} />
          {metadata?.cameraSettings?.aperture}
        </span>
      </BasicInfoItem>
    {/if}
    {#if metadata?.cameraSettings?.focalLength}
      <BasicInfoItem
        label="Focal Length"
        value={metadata?.cameraSettings?.focalLength}
      />
    {/if}
    {#if metadata?.cameraSettings?.iso}
      <BasicInfoItem label="ISO" value={metadata?.cameraSettings?.iso} />
    {/if}
  {/if}
  {#if metadata?.imageDetails}
    {#if metadata?.imageDetails?.dateTime}
      <BasicInfoItem
        label="Captured time"
        value={metadata?.imageDetails?.dateTime}
      />
    {/if}
  {/if}
  {#if renderingDetails}
    <BasicInfoItem
      label="Original resolution"
      value={renderingDetails?.originalHeight
        ? renderingDetails?.originalHeight +
          " x " +
          renderingDetails?.originalWidth
        : "NA"}
    />
    <BasicInfoItem
      label="Rendered resolution"
      value={renderingDetails?.renderedHeight
        ? renderingDetails?.renderedHeight +
          " x " +
          renderingDetails?.renderedWidth
        : "NA"}
    />
  {/if}
</div>
