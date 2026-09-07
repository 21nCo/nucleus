// import { env, pipeline } from "@xenova/transformers";
import { env, pipeline } from "@huggingface/transformers";
import type { INodeCapture } from "@nucleum/features/memory/node/node.type";
import { generateResourceId } from "@nucleum/datafn/id.utils";
import { Resource } from "@nucleum/datafn/resource.enum";
import {
  TacoActions,
  TranscriptionModel
} from "@nucleum/application/taco/worker.type";

env.allowLocalModels = false;
// let call = 0;
onmessage = (e: any) => {
  // call++;
  // console.log("ts worker file", call, e.data);
  // postMessage(e.data);
  let action: TacoActions = e.data.action;

  switch (action) {
    case TacoActions.INITIALIZE_TRANSCRIBER:
      if (!Transcriber.built) {
        Transcriber.initAll();
      } else {
        postMessage({
          status: "ready"
        });
      }
      break;
    case TacoActions.RESET_TRANSCRIBER:
      Transcriber.built = false;
      break;
    case TacoActions.GET_TRANSCRIPTION:
      Transcriber.transcribe(e.data.params.audioData, e.data.params.model);
      break;
    case TacoActions.INITIALIZE_FEATURE_EXTRACTOR:
      if (!FeatureExtractor.built) {
        FeatureExtractor.init((progress: any) => {
          postMessage(progress);
        });
      } else {
        postMessage({
          status: "ready"
        });
      }
      break;
    case TacoActions.RESET_FEATURE_EXTRACTOR:
      FeatureExtractor.built = false;
      break;
    case TacoActions.GET_EMBEDDINGS:
      FeatureExtractor.generateVectorEmbeddings(
        e.data.params.text,
        e.data.params.eventId
      );
      break;
    case TacoActions.GEN_EMBEDDINGS_AND_RETURN_PROCESSED_DATA:
      FeatureExtractor.generateVectorEmbeddingsAndReturnProcessedData(
        e.data.params.nodes
      );
      break;
    case TacoActions.INITIALIZE_QUESTION_ANSWERER:
      QuestionAnswerer.init((progress: any) => {
        postMessage(progress);
      });
      break;
    case TacoActions.RESET_QUESTION_ANSWERER:
      QuestionAnswerer.built = false;
      break;
    case TacoActions.GET_ANSWER:
      QuestionAnswerer.getAnswer(e.data.params.question, e.data.params.context);
      break;
    case TacoActions.INITIALIZE_TEXT2TEXT_GENERATOR:
      Text2textGenerator.init((progress: any) => {
        postMessage(progress);
      });
      break;
    case TacoActions.RESET_TEXT2TEXT_GENERATOR:
      Text2textGenerator.built = false;
      break;
    case TacoActions.T2TGENERATE_TEXT:
      Text2textGenerator.t2TgenerateText(
        e.data.params.context,
        e.data.params.question
      );
      break;
    case TacoActions.INITIALIZE_TEXT_GENERATOR:
      // TextGenerator.initAll();
      TextGenerator.init((progress: any) => {
        postMessage(progress);
      });
      break;
    case TacoActions.RESET_TEXT_GENERATOR:
      TextGenerator.built = false;
      break;
    case TacoActions.GENERATE_TEXT:
      TextGenerator.generateText(e.data.params.context, e.data.params.question);
      break;
  }
};

env.allowLocalModels = false;

// const tokenizer = await AutoTokenizer.from_pretrained(
//   "Fuzail22/onnx-msmarco-distilbert-cos-v5"
// );
// const inputSequenceLength = tokenizer.model_max_length;
// postMessage("Input sequence length:", inputSequenceLength);

/**
 * Using Class for initializing the pipline only once, which was required to avoid range out of bounds error propbably causes due to more initializations of the pipeline.
 */
class FeatureExtractor {
  static built = false;
  static extractor: any;
  static isInternalCall: boolean = false;
  static async init(progress_callback?: (progress: any) => void) {
    if (!FeatureExtractor.built) {
      // postMessage("initializing feature extractor");
      FeatureExtractor.extractor = await pipeline(
        "feature-extraction",
        "Fuzail22/onnx-msmarco-distilbert-cos-v5",
        {
          // quantized: false,
          dtype: "fp32",
          progress_callback
        }
      );
      FeatureExtractor.built = true;
    }
  }
  static async generateVectorEmbeddingsAndReturnProcessedData(
    nodes: INodeCapture[]
  ) {
    try {
      FeatureExtractor.isInternalCall = true;
      let vectorRecords: any[] = [];
      for (let node of nodes) {
        const data = (node?.label ? node.label + " " : "") + node?.mdText;
        let vector = await FeatureExtractor.generateVectorEmbeddings(data);
        const vecotrId = generateResourceId(Resource.vector, {
          isAsString: true
        });
        vectorRecords.push({
          embedding: vector,
          resourceId: resolveNodeId(node.id),
          resource: Resource.node,
          id: vecotrId,
          metadata: {
            source: "taco"
          }
        });
      }
      postMessage({
        params: {
          vectorRecords
        }
      });
    } catch (error) {
      console.error("Error during vector embedding generation:", error);
      throw error;
    } finally {
      FeatureExtractor.isInternalCall = false;
    }
  }
  static async generateVectorEmbeddings(
    text: string,
    eventId: string = "message"
  ) {
    try {
      // let startTime = Date.now();
      if (!FeatureExtractor.built) await FeatureExtractor.init();
      const output = await FeatureExtractor.extractor(text, {
        pooling: "mean",
        normalize: true
      });
      let arr = output.tolist();
      arr = arr[0].map((value: string) => {
        return value;
      });
      // let endTime = Date.now();
      // console.log(
      //   "extraction time in seconds:",
      //   (endTime - startTime) / 1000,
      //   text,
      //   arr[0]
      // );
      if (FeatureExtractor.isInternalCall) return arr;
      else postMessage({ eventId, data: arr });
    } catch (error) {
      console.error("Error during extraction:", error);
      throw error;
    }
  }
}

function resolveNodeId(id: unknown) {
  if (typeof id === "string") return id;
  if (
    id &&
    typeof id === "object" &&
    "tb" in id &&
    "id" in id &&
    typeof (id as { tb?: unknown }).tb === "string"
  ) {
    return `${(id as { tb: string }).tb}:${(id as { id: unknown }).id}`;
  }
  return id?.toString() ?? "";
}

class QuestionAnswerer {
  static built = false;
  static qa: any;
  static models = [
    "Fuzail22/onnx-roberta-base-squad2",
    "Xenova/distilbert-base-cased-distilled-squad"
  ];
  static async init(progress_callback?: (progress: any) => void) {
    if (!QuestionAnswerer.built) {
      QuestionAnswerer.qa = await pipeline(
        "question-answering",
        QuestionAnswerer.models[1],
        {
          // quantized: false,
          dtype: "fp32",
          progress_callback
        }
      );
      QuestionAnswerer.built = true;
    }
  }

  static async getAnswer(question: string, context: string) {
    try {
      const startTime = Date.now();
      if (!QuestionAnswerer.built) await QuestionAnswerer.init();
      const output = await QuestionAnswerer.qa(question, context, {
        top_k: 1,
        top_p: 0.9,
        max_seq_length: 512,
        temperature: 0.5,
        do_sample: true,
        num_return_sequences: 1,
        return_full_text: true
      });
      const endTime = Date.now();
      // postMessage("answering time in seconds:", (endTime - startTime) / 1000);
      // postMessage("output FOR qa", output);
      postMessage(output.answer);
      // return output.answer;
    } catch (error) {
      console.error("Error during extraction:", error);
      throw error;
    }
  }
}

class TextGenerator {
  static built = false;
  static generator: any;
  static models = [
    "Xenova/tiny-random-PhiForCausalLM",
    "Xenova/Qwen1.5-0.5B-Chat"
    // "Xenova/TinyLlama-1.1B-Chat-v1.0"
    // "Xenova/tiny-random-Phi3ForCausalLM",
    // "Xenova/tiny-random-Phi3ForCausalLM-optimized",
    // "Xenova/Phi-3-mini-4k-instruct",
    // "Xenova/Phi-3-mini-4k-instruct-hf",
    // "Xenova/Phi-3-mini-4k-instruct_fp16",
    //"Xenova/gpt2-large-conversational", no chat template and hallucinates
    //"Xenova/TinyLLama-v0",no chat template and hallucinates
  ];
  static model = TextGenerator.models[1];
  static async initAll() {
    for (let model of TextGenerator.models) {
      TextGenerator.built = false;
      TextGenerator.model = model;
      TextGenerator.init((progress: any) => {
        console.log(progress);
      });
    }
  }
  static async init(progress_callback?: (progress: any) => void) {
    if (!TextGenerator.built) {
      TextGenerator.generator = await pipeline(
        "text-generation",
        TextGenerator.model,
        {
          quantized: true,
          progress_callback: progress_callback
        }
      );
      TextGenerator.built = true;
    }
  }

  static async generateText(context: string, question: string) {
    try {
      console.log("generateText", context, question);
      const messages = [
        {
          role: "system",
          content:
            "You are a friendly answering assitant, answering question based on the user given context alone. If context is not relevant or sufficient, respond I didn't find enough context. Don't answer or respond anything outside of given context"
        },
        {
          role: "user",
          content: `/context-start/ ${context} /context-end/ /question-start/ ${question} /question-end/`
        }
      ];
      if (!TextGenerator.built) await TextGenerator.init();
      console.log(
        "chat template",
        TextGenerator.generator.tokenizer.chat_template
      );
      const prompt = TextGenerator.generator.tokenizer.apply_chat_template(
        messages,
        {
          tokenize: false,
          add_generation_prompt: true
        }
      );
      console.log("prompt", prompt);
      const startTime = Date.now();
      const output = await TextGenerator.generator(prompt, {
        max_new_tokens: 128,
        do_sample: false,
        return_full_text: false
      });
      const endTime = Date.now();
      console.log("time taken", (endTime - startTime) / 1000, "seconds");
      console.log("output", output[0].generated_text);
      postMessage(output[0].generated_text);
      // return output.answer;
    } catch (error) {
      console.error("Error during extraction:", error);
      throw error;
    }
  }
}

class Text2textGenerator {
  static built = false;
  static generator: any;
  static async init(progress_callback?: (progress: any) => void) {
    if (!Text2textGenerator.built) {
      Text2textGenerator.generator = await pipeline(
        "text2text-generation",
        "Xenova/LaMini-Flan-T5-783M",
        {
          // quantized: true,
          progress_callback
        }
      );
      Text2textGenerator.built = true;
    }
  }
  static async t2TgenerateText(context: string, question: string) {
    try {
      console.log(
        "extracting text:",
        context.split(" ").length,
        context,
        question
      );
      if (!Text2textGenerator.built) await Text2textGenerator.init();
      let prompt = JSON.stringify({
        context: context,
        question: question,
        instruction:
          "Please answer only based on the given context and question. Respond Sorry I don't have enought context for it if in case the provided context is not related or not sufficient."
      });
      console.log("prompt", prompt);
      const startTime = Date.now();
      const output = await Text2textGenerator.generator(prompt, {
        max_length: 512,
        temperature: 0.5,
        do_sample: true,
        num_return_sequences: 1,
        return_full_text: true
      });
      const endTime = Date.now();
      console.log(
        "output FOR T2T",
        (endTime - startTime) / 1000,
        "secs ",
        output
      );
      postMessage(output[0].generated_text);
      // return output.generated_text;
    } catch (error) {
      console.error("Error during extraction:", error);
      throw error;
    }
  }
}

class Transcriber {
  static built = false;
  static transcriber: any;
  static models = [
    "distil-whisper/distil-small.en"
    // "Xenova/whisper-tiny.en",
    // "Xenova/whisper-small.en",
    // "Xenova/whisper-base.en",
    // "Xenova/whisper-medium.en"
  ];
  static model = Transcriber.models[0];
  static async initAll() {
    for (let model of Transcriber.models) {
      Transcriber.built = false;
      Transcriber.model = model;
      Transcriber.init((progress: any) => {
        postMessage(progress);
      });
    }
  }
  static async init(progress_callback?: (progress: any) => void) {
    if (!Transcriber.built) {
      Transcriber.transcriber = await pipeline(
        "automatic-speech-recognition",
        Transcriber.model,
        {
          progress_callback
        }
      );
    }
  }

  static async transcribe(audioData: any, model: TranscriptionModel) {
    try {
      // console.log("Transcriber.transcribe", audioData, model);
      if (Transcriber.model != model && Transcriber.built) {
        const index = Transcriber.models.findIndex((model) =>
          model.includes(model)
        );
        if (index >= 0) {
          Transcriber.model = Transcriber.models[index];
          Transcriber.built = false;
          delete Transcriber.transcriber;
        }
      }
      if (!Transcriber.built) await Transcriber.init();
      // const startTime = Date.now();
      const output = await Transcriber.transcriber(
        audioData,
        { chunk_length_s: 30, stride_length_s: 5 }
        // {return_timestamps: true }
      );
      // const endTime = Date.now();
      // console.log(
      //   "Transcriber time",
      //   (endTime - startTime) / 1000,
      //   "secs ",
      //   output
      // );
      postMessage(output.text);
      // return output.text;
    } catch (error) {
      console.error("Error during extraction:", error);
      throw error;
    }
  }

  static async transcribev2(
    audioData: Float32Array | Int16Array,
    model: TranscriptionModel
  ) {
    try {
      if (!audioData) {
        throw new Error("No audio data provided");
      }

      let processedAudio: Float32Array;
      if (audioData instanceof Int16Array) {
        processedAudio = new Float32Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          processedAudio[i] = audioData[i] / 32768.0;
        }
      } else if (audioData instanceof Float32Array) {
        processedAudio = audioData;
      } else {
        throw new Error("Invalid audio data format");
      }
      if (Transcriber.model !== model || !Transcriber.built) {
        Transcriber.model = model;
        Transcriber.built = false;
        delete Transcriber.transcriber;
        await Transcriber.init();
      }

      const processingConfig = {
        chunk_length_s: 15,
        stride_length_s: 3,
        return_timestamps: false,
        sampling_rate: 16000,
        max_new_tokens: 128,
        num_threads: 1,
        num_beams: 1,
        do_sample: false
      };

      console.log("Processing audio:", {
        dataLength: processedAudio.length,
        config: processingConfig,
        modelName: Transcriber.model
      });

      const sampleRate = processingConfig.sampling_rate;
      const chunkLengthSamples = processingConfig.chunk_length_s * sampleRate;
      const strideLengthSamples = processingConfig.stride_length_s * sampleRate;

      let transcribedText = "";
      let start = 0;
      while (start < processedAudio.length) {
        const end = Math.min(start + chunkLengthSamples, processedAudio.length);
        const audioChunk = processedAudio.slice(start, end);

        const output = await Transcriber.transcriber(
          audioChunk,
          processingConfig
        );
        if (output?.text) {
          transcribedText += output.text + " ";
        } else {
          console.error(
            "No transcription output for chunk starting at sample:",
            start
          );
        }

        start += chunkLengthSamples - strideLengthSamples;
      }

      postMessage(transcribedText.trim());
    } catch (error) {
      console.error("Transcription error:", error);
      postMessage({
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "Unknown transcription error",
        details: {
          modelName: Transcriber.model,
          errorType: typeof error,
          errorValue: String(error),
          audioLength: audioData?.length
        }
      });
    }
  }
}
