<script lang="ts">
  import view from "@nucleum/stores/view.store";
  import { InputStyle, type InputLabel } from "@21n/types/input.type";
  import InputBaseElement from "@21n/elements/InputBaseElement.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import { Size } from "@21n/types/size.enum";
  import { debouncer } from "@21n/utils/utils";
  let {
    size = Size.md,
    value = $bindable(),
    placeholder = undefined,
    label = undefined,
    style = InputStyle.BORDERED,
    rows = 5,
    resizable = true,
    changeCallback = () => {},
    debouncedChangeCallback = () => {},
    width = "w-full",
    isDisabled = false
  }: {
    size?: Size;
    value?: any;
    placeholder?: string | undefined;
    label?: InputLabel | undefined;
    style?: InputStyle;
    rows?: number;
    resizable?: boolean;
    changeCallback?: (value: string) => void;
    debouncedChangeCallback?: (value: string) => void;
    width?: string;
    isDisabled?: boolean;
  } = $props();
  let isFocused = $state(false);
  export function focus() {
    if (inputRef) inputRef.focus();
  }
  export function blur() {
    if (inputRef) inputRef.blur();
  }
  export function reset() {
    value = "";
  }
  let inputRef: any;
  let inputClasses: string =
    "text-input bg-transparent focus:outline-none focus:border-none";

  function stopPropagation(event: Event) {
    event.stopPropagation();
  }

  function onChange() {
    changeCallback(value);
    debouncedChange();
  }

  const debouncedChange = debouncer(() => {
    debouncedChangeCallback(value);
  }, 1000);
</script>

<InputBaseElement {style} {label} {isFocused}>
  <textarea
    style="max-width:unset;"
    class={cn(width, inputClasses, {
      "resize-none": !resizable,
      "max-w-[unset]": $view.isPortrait,
      "text-b2": size === Size.sm
    })}
    {rows}
    bind:value
    onchange={stopPropagation}
    onkeydown={stopPropagation}
    onkeyup={stopPropagation}
    onblur={() => {
      isFocused = false;
    }}
    onfocus={() => {
      isFocused = true;
    }}
    oninput={(event) => {
      stopPropagation(event);
      onChange();
    }}
    onpaste={stopPropagation}
    {placeholder}
    disabled={isDisabled}
    bind:this={inputRef}
  />
</InputBaseElement>
