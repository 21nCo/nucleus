<script lang="ts">
  import { onMount } from "svelte";
  import type { ICodeBlockBody } from "@nucleum/features/memory/markdown/md.type";
  import * as monaco from "monaco-editor";
  import DropDown from "@21n/elements/dropdown/DropDown.svelte";
  import { InputStyle } from "@21n/types/input.type";
  import { Size } from "@21n/types/size.enum";
  import Button from "@21n/elements/button/Button.svelte";
  import { copyToClipboard } from "@21n/utils/utils";
  import { ButtonStyle, ButtonVariant } from "@21n/types/button.type";
  import type { MdStoreType } from "@nucleum/features/memory/markdown/markdown.store";
  import { hoverable } from "@nucleum/actions/hover.action";
  let {
    mdStore,
    body,
    onUpdate = undefined,
    onDelete = undefined
  }: {
    mdStore: MdStoreType;
    body: ICodeBlockBody;
    onUpdate?: ((event: CustomEvent<any>) => void) | undefined;
    onDelete?: (() => void) | undefined;
  } = $props();

  let language = body?.language ?? "javascript";
  let code = body?.text ?? "";
  let element: HTMLElement;
  let editor: monaco.editor.IStandaloneCodeEditor | undefined;
  let isHovering: boolean = false;

  const languages = [
    { label: "ABAP", value: "abap" },
    { label: "Apex", value: "apex" },
    { label: "Azcli", value: "azcli" },
    { label: "Batch", value: "bat" },
    { label: "C", value: "c" },
    { label: "C#", value: "csharp" },
    { label: "C++", value: "cpp" },
    { label: "Clojure", value: "clojure" },
    { label: "COBOL", value: "cobol" },
    { label: "CoffeeScript", value: "coffeescript" },
    { label: "CSS", value: "css" },
    { label: "Dart", value: "dart" },
    { label: "Dockerfile", value: "dockerfile" },
    { label: "F#", value: "fsharp" },
    { label: "Go", value: "go" },
    { label: "GraphQL", value: "graphql" },
    { label: "Groovy", value: "groovy" },
    { label: "Handlebars", value: "handlebars" },
    { label: "HCL", value: "hcl" },
    { label: "HTML", value: "html" },
    { label: "INI", value: "ini" },
    { label: "Java", value: "java" },
    { label: "JavaScript", value: "javascript" },
    { label: "JSON", value: "json" },
    { label: "Julia", value: "julia" },
    { label: "Kotlin", value: "kotlin" },
    { label: "Less", value: "less" },
    { label: "Lua", value: "lua" },
    { label: "Markdown", value: "markdown" },
    { label: "MATLAB", value: "matlab" },
    { label: "MySQL", value: "mysql" },
    { label: "Objective-C", value: "objective-c" },
    { label: "Pascal", value: "pascal" },
    { label: "Perl", value: "perl" },
    { label: "PHP", value: "php" },
    { label: "PowerShell", value: "powershell" },
    { label: "Python", value: "python" },
    { label: "R", value: "r" },
    { label: "Ruby", value: "ruby" },
    { label: "Rust", value: "rust" },
    { label: "SASS", value: "scss" },
    { label: "Scala", value: "scala" },
    { label: "Scheme", value: "scheme" },
    { label: "Shell", value: "shell" },
    { label: "SQL", value: "sql" },
    { label: "Swift", value: "swift" },
    { label: "TypeScript", value: "typescript" },
    { label: "VB.Net", value: "vb" },
    { label: "XML", value: "xml" },
    { label: "YAML", value: "yaml" }
  ];

  const languagesWithSetup = [
    { label: "CSS", value: "css" },
    { label: "HTML", value: "html" },
    { label: "JavaScript", value: "javascript" },
    { label: "JSON", value: "json" },
    { label: "Plain Text", value: "plaintext" },
    { label: "TypeScript", value: "typescript" },
    { label: "Python", value: "python" },
    { label: "C", value: "c" },
    { label: "C++", value: "cpp" },
    { label: "Java", value: "java" },
    { label: "Shell", value: "shell" },
    { label: "SQL", value: "sql" }
  ];

  self.MonacoEnvironment = {
    getWorkerUrl: function (moduleId: string, label: string) {
      const basePath = "/monaco-editor/esm/vs";

      switch (label) {
        case "typescript":
        case "javascript":
          return `${basePath}/language/typescript/ts.worker.js`;
        case "json":
          return `${basePath}/language/json/json.worker.js`;
        case "css":
          return `${basePath}/language/css/css.worker.js`;
        case "html":
          return `${basePath}/language/html/html.worker.js`;
        default:
          return `${basePath}/editor/editor.worker.js`;
      }
    }
  };

  let onDarkModeChange: ((e: MediaQueryListEvent) => void) | null = null;
  onMount(() => {
    editor = monaco.editor.create(element, {
      value: code,
      language,
      theme: "vs-dark",
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      quickSuggestions: false,
      suggestOnTriggerCharacters: false,
      parameterHints: { enabled: false },
      formatOnType: false,
      formatOnPaste: false,
      codeLens: false,
      folding: false,
      links: false,
      readOnly: $mdStore.params?.isReadOnly
    });

    editor.getModel()?.onDidChangeContent(() => {
      code = editor!.getValue();
      onUpdate?.(new CustomEvent("update", { detail: { text: code } }));
    });

    const darkModeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );
    onDarkModeChange = (e: MediaQueryListEvent) => {
      editor?.updateOptions({ theme: e.matches ? "vs-dark" : "vs" });
    };
    darkModeMediaQuery.addEventListener("change", onDarkModeChange);

    return () => {
      if (onDarkModeChange) {
        darkModeMediaQuery.removeEventListener("change", onDarkModeChange);
      }
      editor?.dispose();
    };
  });

  function handleLanguageChange(_e: CustomEvent<string>) {
    if (editor) {
      monaco.editor.setModelLanguage(editor.getModel()!, language);
    }
    onUpdate?.(new CustomEvent("update", { detail: { language } }));
  }

  function handleCopyCode() {
    copyToClipboard(code ?? "");
  }

  function handleDeleteCode() {
    onDelete?.();
  }

  $effect(() => {
    if (!editor || $mdStore.params?.isReadOnly === undefined) return;
    editor.updateOptions({ readOnly: $mdStore.params.isReadOnly });
  });
</script>

<div
  class="flex flex-col gap-3 w-full p-2 border border-brs3 rounded-md bg-[#1e1e1e]"
  use:hoverable={{
    onHover: (e) => {
      isHovering = e;
    }
  }}
>
  {#if $mdStore.params?.isReadOnly}
    <span class="text-fgs3 text-b3 px-3">
      {languages.find((l) => l.value === language)?.label ?? "Code"}
    </span>
  {:else}
    <div class="flex items-center gap-3 justify-between w-full h-8">
      <div class="w-32 text-fgs3 px-3">
        <DropDown
          items={languages}
          style={InputStyle.PLAIN}
          size={Size.sm}
          popoverWidth="w-60"
          bind:value={language}
          onSelect={handleLanguageChange}
        />
      </div>
      {#if isHovering}
        <div class="flex gap-2 items-center text-fgs3">
          <Button
            icon="copy"
            size={Size.sm}
            tooltip="Copy code"
            style={ButtonStyle.OUTLINED}
            onclick={handleCopyCode}
          />
          <Button
            icon="trash"
            size={Size.sm}
            type={ButtonVariant.DANGER}
            style={ButtonStyle.OUTLINED}
            tooltip="Delete block"
            onclick={handleDeleteCode}
          />
        </div>
      {/if}
    </div>
  {/if}
  <div
    bind:this={element}
    style="height: 300px"
    class="rounded-md overflow-hidden"
  />
</div>
