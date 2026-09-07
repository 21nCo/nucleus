<script lang="ts">
  import { CaptureMethod } from "@nucleum/features/memory/capture/capture.type";
  import AudioCapture from "@nucleum/features/memory/capture/AudioCapture.svelte";
  import NodularMarkdown from "@nucleum/features/memory/markdown/NodularMarkdown.svelte";
  import { logger } from "@nucleum/client/runtime/logging/logger";

  import { setContext } from "svelte";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import CameraCapture from "@nucleum/features/memory/capture/CameraCapture.svelte";
  import context from "@nucleum/stores/context.store";
  import type { IActiveCaptureStore } from "@nucleum/features/memory/capture/capture.store";
  import { fly } from "svelte/transition";
  import PlayerControl from "@21n/elements/player/controls/PlayerControl.svelte";
  import { Size } from "@21n/elements/size.enum";
  import { ButtonStyle } from "@21n/elements/button/button.type";
  import { Context } from "@nucleum/stores/appStore.type";

  let {
    captureStore,
    onChange = undefined,
    onClear = undefined
  }: {
    captureStore: IActiveCaptureStore;
    onChange?: ((event: CustomEvent) => void) | undefined;
    onClear?: (() => void) | undefined;
  } = $props();
  let mdRef: NodularMarkdown | undefined = undefined;

  function handleEvent(event: string, data: any) {
    logger.log({
      at: "capture handleEvent",
      event,
      data
    });
    if (event === "mention") {
      if (!data?.item || !data?.location) return;
      captureStore.addMentionLink("root", data.item, {
        location: data.location
      });
    } else if (event === "unmention") {
      if (!data?.id || !data?.location) return;
      captureStore.removeMentionLink("root", data.id);
    }
  }

  const contentContext = {
    resolveDynamicParams: (isFirstAndEmpty?: boolean) => {
      return {
        placeholder:
          isFirstAndEmpty || $captureStore.isEmpty
            ? "Start typing to capture..."
            : undefined
      };
    },
    publish: handleEvent
  };

  setContext(Context.CONTENT, contentContext);

  export function focus(id?: IRecordId) {
    mdRef?.focusBlock(id);
  }

  let isShowTOC: boolean = false;
</script>

<div
  class="flex w-full max-h-full h-full justify-between transition-all duration-250"
>
  {#if $captureStore.method === CaptureMethod.AUDIO}
    <div
      class="w-full h-full flex items-center justify-center"
      in:fly={{ y: 50, duration: 250 }}
    >
      <AudioCapture {captureStore} onClear={onClear} />
    </div>
  {:else if $captureStore.method === CaptureMethod.CAMERA}
    <div class="w-full h-full flex items-center justify-center">
      <CameraCapture {captureStore} onClear={onClear} />
    </div>
  {:else if $captureStore.body && "blocks" in $captureStore.body}
    <div class="overflow-auto h-full w-full dp:px--10" data-testid="capture-editor">
      <NodularMarkdown
        isNodular={true}
        mdId={$captureStore.id}
        bind:md={$captureStore.body}
        bind:childrenWithStructure={$captureStore.childrenWithStructure}
        bind:rootStructure={$captureStore.rootStructure}
        bind:this={mdRef}
        params={{ isPreventFocusOnLoad: $context.isTouchDevice }}
        onChange={(e) => {
          onChange?.(e);
        }}
        onAction={(e) => {
          onChange?.(e);
        }}
        onRestructure={(e) => {
          onChange?.(e);
        }}
      />
    </div>
    {#if isShowTOC}
      <aside class="w-72 flex flex-col h-full py-6 rounded-md items-center">
        <div class="flex flex-col flex-grow justify-center">
          <div class="text-fgs3 text-b3">
            <div class="text-b2">No headings.</div>
            Start typing to create one.
          </div>
        </div>
      </aside>
    {/if}
  {:else}
    <div class="pb-8">
      <PlayerControl
        onclick={() => {
          onClear?.();
        }}
        icon="back"
        tooltip="Go back"
        size={Size.sm}
        style={ButtonStyle.OUTLINED}
      />
    </div>
  {/if}
</div>
