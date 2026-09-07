<script lang="ts">
  import { logger } from "@nucleum/components/debug/logger.client";
  import modalEvent from "@nucleum/components/modal/modal.store";
  import { onMount } from "svelte";
  import { MAX_FILE_SIZE_MB } from "@nucleum/components/record/record.store";
  import { MemotronAction } from "@nucleum/products/memotron/memotronAction.enum";
  import { NodeType } from "@nucleum/features/memory/node/node.type";
  import { clipboard } from "@nucleum/features/memory/capture/capture.store";
  import type { IPasteCaptureData } from "@nucleum/features/memory/capture/capture.type";
  import { resolvePasteContents } from "@nucleum/features/memory/capture/capture.utils";
  import account from "@nucleum/stores/account.store";
  import { resourceAction } from "@nucleum/datafn/resource.utils";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import {
    AccessMode,
    ResourceActionType
  } from "@nucleum/datafn/resource.type";
  import { generateResourceId } from "@nucleum/datafn/id.utils";
  import { AppSearchParam } from "@21n/types/appStore.type";
  import { appStore } from "@nucleum/stores/app.store";
  import ShareContentSaver from "@nucleum/features/memory/capture/ShareContentSaver.svelte";

  let { event }: { event: ClipboardEvent } = $props();

  const id = generateResourceId(Resource.capture);
  let nodeType = $state<NodeType | undefined>(undefined);
  let error = $state<string | undefined>(undefined);
  let data = $state<IPasteCaptureData | undefined>(undefined);
  let saveAsNodeFilesCount = $state(0);
  let isOffline = $state(false);

  resolveV2(event);

  onMount(async () => {
    isOffline = account.isCloudUserAndOffline();
  });

  async function resolveV2(event: ClipboardEvent) {
    if (!event) return;
    data = await resolvePasteContents(event, {
      maxFileSizeInMb: MAX_FILE_SIZE_MB
    });
    if (!data || data.error) {
      error = data?.error ?? "An error occurred";
      return;
    }
    nodeType = data.contentType;
    if (data.multipleFiles && data.multipleFiles.files?.length > 0) {
      saveAsNodeFilesCount = data.multipleFiles?.files?.filter((file) => {
        return file.contentType !== NodeType.FILE;
      }).length;
    }
  }

  function handleInsertIntoMarkdown() {
    clipboard.set({
      ...data,
      contentType: data?.contentType ?? NodeType.SIMPLE_TEXT
    });
    modalEvent.hide(MemotronAction.PASTE_CONFIRMATION);
    appStore.runAction(
      resourceAction(Resource.node, ResourceActionType.CREATE),
      {
        searchParams: {
          [AppSearchParam.CLIPBOARD]: true
        },
        componentParams: {
          captureId: id
        }
      }
    );
  }

  function handleSaved() {
    // modalEvent.hide(MemotronAction.PASTE_CONFIRMATION);
  }

  function handleOpen({ nodeId }: { nodeId: string | undefined }) {
    if (nodeId) {
      appStore.openResource(nodeId, AccessMode.POP);
    }
    modalEvent.hide(MemotronAction.PASTE_CONFIRMATION);
  }

  function handleClose() {
    modalEvent.hide(MemotronAction.PASTE_CONFIRMATION);
  }
</script>

{#if data}
  <ShareContentSaver
    {data}
    nodeType={nodeType ?? NodeType.UNKNOWN}
    {error}
    {isOffline}
    {saveAsNodeFilesCount}
    isShowInsertIntoMarkdown={true}
    onSaved={handleSaved}
    onOpen={handleOpen}
    onClose={handleClose}
    onInsertIntoMarkdown={handleInsertIntoMarkdown}
  />
{/if}
