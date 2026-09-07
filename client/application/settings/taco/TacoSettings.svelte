<script lang="ts">
  import ProgressBar from "@21n/elements/ProgressBar.svelte";
  import SwitchInput from "@21n/elements/toggle/SwitchInput.svelte";
  import { tacoWorker } from "@nucleum/products/memotron/memotron.utils";
  import { Size } from "@21n/types/size.enum";
  import { userPreferences } from "@nucleum/stores/preferences/user-preferences.store";
  import Button from "@21n/elements/button/Button.svelte";
  import InlineInfoBanner from "@21n/elements/text/InlineInfoBanner.svelte";
  import { InfoTextType } from "@21n/types/text.type";
  import {
    TacoActions,
    TacoLocalAIOptions
  } from "@nucleum/products/memotron/taco/taco.types";
  import { runVectorGeneration } from "@nucleum/products/memotron/taco/taco.store";
  import { appStore } from "@nucleum/stores/app.store";
  import { deleteItemsFromCache } from "@nucleum/products/memotron/taco/taco.utils";
  import DropDown from "@21n/elements/dropdown/DropDown.svelte";
  import { Orientation } from "@21n/types/direction.enum";
  import Text from "@21n/elements/text/Text.svelte";
  import { TextStyle } from "@21n/types/text.enum";
  import context from "@nucleum/stores/context.store";
  import { preferences } from "@nucleum/stores/preferences/preferences.store";
  import { Preference } from "@nucleum/stores/preferences/preferences.type";
  import { Taco } from "@nucleum/application/taco/taco";
  import { embedBridge } from "@nucleum/application/embed/embed.store";
  import { EmbedMessage } from "@21n/types/embedMessage.enum";
  import Icon from "@21n/elements/Icon.svelte";

  let progress = 0;
  let label: string;
  let isDisabled: boolean = false;
  let transcriptionModelDownloadId: string;

  let transcriptionMethod =
    $preferences?.[Preference.TRANSCRIPTION_METHOD] || "local";
  let transcriptionModel =
    $preferences?.[Preference.TRANSCRIPTION_MODEL] || "tiny";
  let autoTranscribe = $preferences?.[Preference.AUTO_TRANSCRIBE] || false;
  let lastTranscriptionMethod = $state(transcriptionMethod);
  let lastTranscriptionModel = $state(transcriptionModel);
  let lastAutoTranscribe = $state(autoTranscribe);

  function onTranscriptionMethodChange(e: CustomEvent) {
    preferences.save(Preference.TRANSCRIPTION_METHOD, e.detail);
  }

  async function onTranscriptionModelChange(e: CustomEvent) {
    preferences.save(Preference.TRANSCRIPTION_MODEL, e.detail);
    const taco = Taco.getInstance();
    transcriptionModelDownloadId = await taco.downloadModel(
      "transcription",
      e.detail
    );
  }

  function onAutoTranscribeChange(e: CustomEvent) {
    preferences.save(Preference.AUTO_TRANSCRIBE, e.detail);
  }

  function progressUpdate(e: any, currentToggle: TacoLocalAIOptions) {
    if (e.data.progress) progress = e.data.progress;
    if (e.data.file) label = e.data.file;
    if (e.data.status == "ready") {
      isDisabled = false;
      if (currentToggle == TacoLocalAIOptions.SEMANTIC_SEARCH) {
        userPreferences.setLocalAI({ vectorGenerationInProgress: true });
        runVectorGeneration();
      }
    }
  }
  async function onSemanticSearchToggle(e: any) {
    if (e.detail) {
      isDisabled = true;
      tacoWorker.postMessage({
        action: TacoActions.INITIALIZE_FEATURE_EXTRACTOR
      });
      tacoWorker.onmessage = (e) => {
        progressUpdate(e, TacoLocalAIOptions.SEMANTIC_SEARCH);
      };
    } else {
      await deleteItemsFromCache("onnx-msmarco");
      tacoWorker.postMessage({
        action: TacoActions.RESET_FEATURE_EXTRACTOR
      });
    }
  }

  async function onAudioTranscriptionToggle(e: any) {
    if (e.detail) {
      isDisabled = true;
      tacoWorker.postMessage({
        action: TacoActions.INITIALIZE_TRANSCRIBER
      });
      tacoWorker.onmessage = (e) => {
        progressUpdate(e, TacoLocalAIOptions.AUDIO_TRANSCRIPTION);
      };
    } else {
      await deleteItemsFromCache("whisper");
      tacoWorker.postMessage({
        action: TacoActions.RESET_TRANSCRIBER
      });
    }
  }

  async function onQuestionAnsweringToggle(e: any) {
    if (e.detail) {
      isDisabled = true;
      tacoWorker.postMessage({
        action: TacoActions.INITIALIZE_QUESTION_ANSWERER
      });
      tacoWorker.onmessage = (e) => {
        progressUpdate(e, TacoLocalAIOptions.MARKDOWN_QA);
      };
    } else {
      await deleteItemsFromCache("onnx-roberta-");
      await deleteItemsFromCache("Xenova/distilbert-base");
      tacoWorker.postMessage({
        action: TacoActions.RESET_QUESTION_ANSWERER
      });
    }
  }

  function resolveMethodOptions(type: string) {
    // const noneOption = { label: "None", value: "none" };
    const localOption = (size: string) => ({
      label: `On-device AI (${size})`,
      value: "local"
    });
    const customModelOption = {
      label: `Custom - using API key`,
      value: "custom",
      badge: "soon",
      isDisabled: true
    };
    const managedOption = {
      label: "Managed AI - using credits",
      value: "cloud",
      badge: "soon",
      isDisabled: true
    };
    switch (type) {
      case "audio-transcription":
        return [
          localOption("~ 100 - 500 MB"),
          managedOption,
          customModelOption
        ];
      case "summarizers":
        return [localOption("~ 2 GB"), customModelOption, managedOption];
      case "agent":
        return [customModelOption];
      default:
        return [];
    }
  }

  $effect(() => {
    if (transcriptionMethod === lastTranscriptionMethod) return;
    lastTranscriptionMethod = transcriptionMethod;
    preferences.save(Preference.TRANSCRIPTION_METHOD, transcriptionMethod);
  });

  $effect(() => {
    if (transcriptionModel === lastTranscriptionModel) return;
    lastTranscriptionModel = transcriptionModel;
    void onTranscriptionModelChange(
      new CustomEvent("select", { detail: transcriptionModel })
    );
  });

  $effect(() => {
    if (autoTranscribe === lastAutoTranscribe) return;
    lastAutoTranscribe = autoTranscribe;
    preferences.save(Preference.AUTO_TRANSCRIBE, autoTranscribe);
  });
</script>

<div class="flex flex-col h-full w-full gap-8">
  <div class="flex flex-col gap-8">
    <div class="flex flex-col gap-4 bg-bgs2 rounded-md p-3 pb-6">
      <Text content="Audio transcription" style={TextStyle.SECTION_HEADING} />
      <DropDown
        items={resolveMethodOptions("audio-transcription")}
        size={Size.md}
        label={{
          label: "Transcription method",
          orientation: Orientation.Vertical,
          tooltip: {
            body: "Choose the method you want to use for generating audio transcriptions."
          }
        }}
        isDisableSearch={true}
        bind:value={transcriptionMethod}
      />
      <DropDown
        items={[
          {
            value: "tiny",
            label: "Tiny ~100MB (fastest)"
          },
          {
            value: "base",
            label: "Base ~200MB"
          },
          {
            value: "small",
            label: "Small ~500 MB"
          }
        ]}
        label={{
          label: "Model for audio transcription (On-device)",
          orientation: Orientation.Vertical,
          tooltip: {
            body: "Choose the model you want to use for generating audio transcriptions. Our implementation uses Whisper model from OpenAI via whisper.cpp library."
          }
        }}
        isDisableSearch={true}
        bind:value={transcriptionModel}
      />
      <div data-testid="auto-transcribe-toggle">
        <SwitchInput
          label={{
            label: "Auto transcribe on audio record/upload",
            tooltip: {
              body: "If enabled, the app will automatically transcribe the audio when you record or upload an audio file. This is useful if mostly you are transcribing audio files without having to manually transcribe it."
            }
          }}
          isExpanded={true}
          bind:checked={autoTranscribe}
        />
      </div>
      {#if !$context.isEmbed}
        <InlineInfoBanner
          content="On-device AI is only available on iOS and macOS apps."
          type={InfoTextType.INFO}
          size={Size.sm}
        />
      {/if}
      {#if transcriptionModelDownloadId}
        {#if $embedBridge[transcriptionModelDownloadId] && $embedBridge[transcriptionModelDownloadId].type === EmbedMessage.DOWNLOAD_MODEL && $embedBridge[transcriptionModelDownloadId].data}
          {#if $embedBridge[transcriptionModelDownloadId].data.progress && $embedBridge[transcriptionModelDownloadId].data.progress === 1}
            <span class="text-fgs3 text-b2 flex items-center gap-1">
              <Icon icon="check-circle" size={Size.sm} />
              Model downloaded successfully.
            </span>
          {:else}
            <ProgressBar
              percentage={$embedBridge[transcriptionModelDownloadId].data
                .progress}
              label={"Downloading model..."}
            />
          {/if}
        {/if}
      {/if}
    </div>

    <!-- <DropDown
      items={resolveMethodOptions("summarizers")}
      label={{
        label: "Summarizers",
        tooltip: {
          body: "Choose the method you want to use for summarizing text."
        }
      }}
      isDisableSearch={true}
    />
    <DropDown
      items={resolveMethodOptions("agent")}
      label={{
        label: "Agent mode",
        tooltip: {
          body: "Choose the method you want to use for summarizing text."
        }
      }}
      isDisableSearch={true}
    /> -->
    {#if isDisabled}
      <span class="text-fgs3 text-b2">
        Please wait... Download in progress...
      </span>
      <!-- TODO - reenable after making it smooth with flickering effect -->
      <!-- <ProgressBar {progress} size={Size.lg} {label} /> -->
    {/if}
  </div>
  <footer class="flex flex-col items-center gap-4 pb-8 mo:pb-20">
    {#if $appStore.env == "dev" && $userPreferences.localAI.semanticSearch}
      <Button
        label="Regenerate-Vectors-For-All-MDs"
        onclick={() => {
          userPreferences.setLocalAI({ vectorGenerationInProgress: true });
          runVectorGeneration(true);
        }}
      />
    {/if}
    <!-- {#if isCmdBarLaunch}
      <p class="text-fgs2 text-b2 text-left">
        Note: You won't be able to Dismiss or perform any other action while the
        model download is in progress.
      </p>
      <div>
        <Button
          size={Size.md}
          label="Dismiss"
          type={ButtonVariant.PRIMARY}
          {isDisabled}
          onclick={() => {
            modalEvent.hide(Action.LOCAL_AI_SETTINGS);
          }}
        />
      </div>
    {:else}
      <InlineInfoBanner
        content="Please do not close this popup while the model download is in progress."
        type={InfoTextType.WARNING}
      />
    {/if} -->
  </footer>
</div>
