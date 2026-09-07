<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import { ButtonStyle, ButtonVariant } from "@21n/elements/button/button.type";
  import { PlayActionState } from "@nucleum/stores/notifications/event.enum";
  import { TimeFormat } from "@21n/utils/time.type";
  import { formatSeconds } from "@21n/utils/time.utils";
  import WaveSurfer from "wavesurfer.js";
  import RecordPlugin from "wavesurfer.js/dist/plugins/record";
  import { retrieveCurrentColors } from "@21n/utils/theme.utils";
  import appearance from "@nucleum/stores/appearance.store";
  import view from "@nucleum/stores/view.store";
  import PlayerControl from "@21n/elements/player/controls/PlayerControl.svelte";
  import { onDestroy } from "svelte";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import type { IActiveCaptureStore } from "@nucleum/features/memory/capture/capture.store";
  import InlineErrorMessage from "@21n/elements/text/InlineErrorMessage.svelte";
  import { Size } from "@21n/elements/size.enum";
  import { confirmationNotification } from "@nucleum/stores/notification.store";
  import { cn } from "@21n/utils/ui.utils";

  let {
    captureStore,
    accessPoint = ResourceAccessPoint.CAPTURE,
    creationContext = undefined,
    onSaved = undefined,
    onClear = undefined
  }: {
    captureStore: IActiveCaptureStore;
    accessPoint?: ResourceAccessPoint;
    creationContext?: IRecordId | undefined;
    onSaved?: ((result: any) => void) | undefined;
    onClear?: (() => void) | undefined;
  } = $props();

  let recordingState = $state(PlayActionState.NOT_STARTED);
  let url: string;
  let recordingDuration = $state(0);
  let blobRefernce: any = undefined;
  let wavesurfer: WaveSurfer;
  let record: RecordPlugin;
  let isShowPreview = $state(false);
  let error = $state<string | undefined>(undefined);
  const currentColors: any = retrieveCurrentColors($appearance);

  onDestroy(() => {
    cleanup();
  });

  function startRecording() {
    isShowPreview = true;
    if (record?.isRecording()) {
      record.unAll();
      record.destroy();
      url = "";
      blobRefernce = null;
    }
    setTimeout(() => {
      createWaveSurferForLiveVisualizer();
      record.startRecording().then(() => {
        recordingState = PlayActionState.RUNNING;
      });
    }, 10);
  }
  function toggleRecording() {
    if (record.isPaused()) {
      record.resumeRecording();
      recordingState = PlayActionState.RUNNING;
      return;
    }
    recordingState = PlayActionState.PAUSED;
    record.pauseRecording();
  }
  function stopRecording() {
    if (record.isRecording() || record.isPaused()) {
      record.stopRecording();
    }
  }

  function cleanup() {
    if (record) {
      if (record.isRecording() || record.isPaused()) {
        record.stopRecording();
      }
      record.unAll();
      record.destroy();
    }
    if (wavesurfer) {
      wavesurfer.destroy();
    }
    recordingState = PlayActionState.NOT_STARTED;
    url = "";
    blobRefernce = null;
    isShowPreview = false;
  }

  function createWaveSurferForLiveVisualizer() {
    if (wavesurfer) {
      wavesurfer.destroy();
    }

    wavesurfer = WaveSurfer.create({
      container: "#audioCaptureLiveVisualizer",
      waveColor: currentColors["aps1"],
      progressColor: currentColors["aps1"],
      cursorColor: currentColors["aps1"],
      barWidth: 1,
      barGap: 2,
      height: "auto"
    });

    record = wavesurfer.registerPlugin(
      RecordPlugin.create({
        scrollingWaveform: true,
        renderRecordedAudio: false,
        scrollingWaveformWindow: 5
      })
    );

    record.on("record-progress", (time: number) => {
      recordingDuration = time / 1000; //time recieved in milliseconds
    });

    record.on("record-end", (blob: Blob) => {
      blobRefernce = blob;
      onFinish();
    });
  }

  async function onFinish() {
    const waveformBlob = await resolveWaveFormBlob();
    const result = await captureStore.saveAudioRecording(
      blobRefernce,
      recordingDuration,
      {
        isEmbedContext: accessPoint === ResourceAccessPoint.MARKDOWN_EMBED,
        creationContext,
        thumbnailBlob: waveformBlob
      }
    );
    onSaved?.(result);
  }

  async function resolveWaveFormBlob() {
    try {
      const blob = await wavesurfer.exportImage("image/jpeg", 0.5, "blob");
      return blob[1] ?? blob[0];
    } catch (error) {
      console.error("Failed to generate waveform:", error);
      return undefined;
    }
  }

  function onGoBack() {
    if (recordingState !== PlayActionState.NOT_STARTED) {
      confirmationNotification.notify({
        title: "Are you sure you want to go back?",
        message: "You will lose your recording.",
        confirmAction: {
          label: "Go back",
          callback: async () => {
            proceedToGoBack();
          }
        }
      });
    } else {
      proceedToGoBack();
    }
  }

  function proceedToGoBack() {
    cleanup();
    onClear?.();
  }
</script>

<div class="grid grid-rows-2 h-full w-full">
  <div class="flex w-full">
    {#if isShowPreview}
      <div
        class:hidden={recordingState === PlayActionState.STOPPED ||
          recordingState === PlayActionState.PREVIEWING}
        class="flex flex-col items-center justify-center gap-4 w-full flex-1"
      >
        <div class="flex w-full h-7/10 max-h-96">
          <div
            id="audioCaptureLiveVisualizer"
            class="w-6/12 mt-4"
            style={recordingState !== PlayActionState.RUNNING &&
            recordingState !== PlayActionState.PAUSED
              ? ""
              : "border-right:2px solid " + currentColors["aps1"]}
          ></div>
        </div>
        <p class="text-h1 font-medium text-fgs2 text-center">
          {formatSeconds(recordingDuration, TimeFormat.CLOCK)}
        </p>
      </div>
    {/if}
  </div>
  {#if $view.isConstrainedWidth || recordingState === PlayActionState.NOT_STARTED}
    <div class="flex flex-col w-full justify-center">
      <div
        class={cn("flex w-full justify-center gap-6 mb-auto", {
          "flex-col-reverse": recordingState === PlayActionState.NOT_STARTED
        })}
      >
        <PlayerControl
          onclick={onGoBack}
          icon="back"
          label={recordingState === PlayActionState.NOT_STARTED
            ? undefined
            : "Go back"}
          tooltip={recordingState === PlayActionState.NOT_STARTED
            ? "Go back"
            : undefined}
          style={ButtonStyle.PLAIN}
        />
        {#if recordingState === PlayActionState.NOT_STARTED}
          <PlayerControl
            onclick={startRecording}
            icon="microphone"
            type={ButtonVariant.PRIMARY}
            label="Start"
            size={Size.lg}
          />
        {:else if recordingState === PlayActionState.RUNNING}
          <PlayerControl
            onclick={toggleRecording}
            style={ButtonStyle.OUTLINED}
            icon="pause"
            label="Pause"
          />
          <PlayerControl
            onclick={stopRecording}
            type={ButtonVariant.PRIMARY}
            icon="stop"
            label="Finish"
          />
        {:else if recordingState === PlayActionState.PAUSED}
          <PlayerControl onclick={toggleRecording} icon="play" label="Resume" />
          <PlayerControl
            onclick={stopRecording}
            type={ButtonVariant.PRIMARY}
            icon="stop"
            label="Finish"
          />
        {/if}
      </div>
    </div>
  {:else}
    <div class="flex w-full justify-center gap-6">
      <Button
        onclick={onGoBack}
        icon="back"
        style={ButtonStyle.OUTLINED}
        label="Go back"
      />
      {#if recordingState === PlayActionState.RUNNING}
        <Button
          onclick={toggleRecording}
          icon="pause"
          style={ButtonStyle.OUTLINED}
          label="Pause"
        />
        <Button
          onclick={stopRecording}
          type={ButtonVariant.PRIMARY}
          icon="stop"
          label="Finish"
        />
      {:else if recordingState === PlayActionState.PAUSED}
        <Button onclick={toggleRecording} icon="play" label="Resume" />
        <Button
          onclick={stopRecording}
          type={ButtonVariant.PRIMARY}
          icon="stop"
          label="Finish"
        />
      {/if}
    </div>
  {/if}
  {#if error}
    <InlineErrorMessage bind:error />
  {/if}
</div>
