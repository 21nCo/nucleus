<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/elements/size.enum";
  import { UploadStatus } from "@nucleum/application/settings/import/uploadStatus.enum";
  import view from "@nucleum/stores/view.store";
  import { cn } from "@21n/utils/ui.utils";

  let {
    label,
    size,
    uploadProgress = 100,
    uploadStatus = UploadStatus.NOT_STARTED,
    onRemove
  }: {
    label: string;
    size: string;
    uploadProgress?: number;
    uploadStatus?: UploadStatus;
    onRemove?: () => void;
  } = $props();
</script>

<div
  class={`w-full flex items-center justify-center gap-4 ${
    $view.isPortrait ? `p-3` : `p-4`
  }`}
>
  <Icon
    class={cn({
      "stroke-aps1": uploadStatus != UploadStatus.NOT_STARTED
    })}
    icon="image"
  />
  <div class={`w-full flex flex-col  ${$view.isPortrait ? `gap-1` : `gap-2`}`}>
    <div class="flex text-b3 justify-between items-center w-full">
      <div class="text-fgs2">{label} ({size})</div>
      {#if uploadStatus === UploadStatus.NOT_STARTED}
        <Icon size={Size.sm} icon="cross" onclick={onRemove} />
      {:else if uploadStatus === UploadStatus.UPLOADING || uploadProgress !== 100}
        <span class="text-aps1">Uploading</span>
      {:else if uploadStatus === UploadStatus.UPLOADED && uploadProgress === 100}
        <span class="text-ags1">Uploaded</span>
      {/if}
    </div>

    {#if uploadStatus !== UploadStatus.NOT_STARTED}
      <div class="w-full h-[3px] relative rounded-full bg-fgs2">
        <div
          style={`width:${uploadProgress}%;`}
          class="bg-aps1 h-[3px] rounded-full"
        />
      </div>
    {/if}
  </div>
</div>
