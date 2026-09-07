<script lang="ts">
  import { Resource } from "@nucleum/datafn/resource.enum";
  import Icon from "@21n/elements/Icon.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import { tacoWorker } from "@nucleum/products/memotron/memotron.utils";

  import { onMount, onDestroy } from "svelte";
  import { TacoActions } from "@nucleum/client/runtime/inference/worker.type";
  import { datafn } from "@nucleum/datafn/datafn.store";

  let isLoading: boolean = false;
  let type = "";
  let index = 0;
  let question: string = "";
  let answer: string = "";

  function resetLoadingState() {
    isLoading = false;
    index = 0;
  }
  async function onQuestion() {
    if (!question.trim()) return;
    isLoading = true;
    typeWriter();
    answer = "";
    const result = await datafn.search({
      query: question,
      resources: [Resource.node],
      fields: ["label", "text", "notes"],
      limit: 1,
      limitPerResource: 1,
      source: "local",
      fuzzy: 0.2
    });
    const node = result.results?.map((entry: any) => entry.data) ?? [];
    if (node.length == 0) {
      answer = "No relevant information found";
      resetLoadingState();
      return;
    }
    //TODO- implement actual chat using text generator rather than using just QA
    // tacoWorker.postMessage({
    //   action: TacoActions.GENERATE_TEXT,
    //   params: {
    //     context: node[0].mdText,
    //     question: question
    //   }
    // });
    tacoWorker.postMessage({
      action: TacoActions.GET_ANSWER,
      params: {
        question: question,
        context: node[0].text
      }
    });
    answer = await new Promise((resolve, reject) => {
      tacoWorker.onmessage = (e: MessageEvent) => {
        resolve(e.data);
      };
    });
    resetLoadingState();
  }

  function typeWriter() {
    if (index < 3) {
      type += " .";
    } else {
      type = "";
      index = -1;
    }
    setTimeout(() => {
      index++;
      if (isLoading) typeWriter();
    }, 300);
  }

  onDestroy(() => {
    isLoading = false;
  });
  onMount(() => typeWriter());
</script>

<div class="w-[393px] h-[500px] bg-bgs2 flex flex-col justify-end gap-4 p-4">
  <div class="flex flex-col gap-4">
    {#if isLoading}
      <p>Thinking{type}</p>
    {:else}
      <p>{answer}</p>
    {/if}
    <div class="relative h-fit">
      <TextInput
        bind:value={question}
        placeholder="Ask question on any markdown"
        onEnter={onQuestion}
      />
      <span class="absolute right-2 top-[10px]">
        <Icon icon="proicons:send" onclick={onQuestion} /></span
      >
    </div>
  </div>
</div>
