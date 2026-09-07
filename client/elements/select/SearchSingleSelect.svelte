<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import TextSearchInput from "@21n/elements/input/TextSearchInput.svelte";
  import { type InputLabel, InputStyle } from "@21n/elements/input/input.type";
  import FormControlLabelWrapper from "@21n/elements/text/formLabel/FormControlLabelWrapper.svelte";
  import { Size } from "@21n/elements/size.enum";
  let {
    selected = $bindable(),
    placeholder = "Start typing to select",
    searchStoreId = undefined,
    searchCallback = undefined,
    label = undefined,
    size = Size.md,
    onBlur = undefined,
    onFocus = undefined,
    onSelect = undefined
  }: {
    selected?: any;
    placeholder?: string;
    searchStoreId?: string | undefined;
    searchCallback?: Function | undefined;
    label?: InputLabel | undefined;
    size?: Size.md | Size.sm;
    onBlur?: ((event: CustomEvent<void>) => void) | undefined;
    onFocus?: ((event: CustomEvent<void>) => void) | undefined;
    onSelect?: ((event: CustomEvent<any>) => void) | undefined;
  } = $props();
  let inputRef = $state<TextSearchInput | undefined>(undefined);
  let value = $state("");

  function emitFocus() {
    const focusEvent = new CustomEvent<void>("focus");
    onFocus?.(focusEvent);
  }

  function emitBlur() {
    const blurEvent = new CustomEvent<void>("blur");
    onBlur?.(blurEvent);
  }

  function emitSelect(item: any) {
    const selectEvent = new CustomEvent<any>("select", { detail: item });
    onSelect?.(selectEvent);
  }
</script>

<FormControlLabelWrapper props={label} {size}>
  {#if selected}
    <div
      class="flex justify-start w-full py-2 border border-bgs4 px-2 rounded-md"
    >
      <button
        class="flex justify-between items-center w-full"
        onclick={() => {
          selected = undefined;
          setTimeout(() => {
            inputRef.focus();
          }, 100);
        }}
      >
        {selected.label}
        <Icon icon="chevron-down" />
      </button>
    </div>
  {:else}
    <TextSearchInput
      bind:this={inputRef}
      onFocus={emitFocus}
      onBlur={emitBlur}
      onSelect={(e) => {
        selected = e?.detail?.item;
        value = "";
        emitSelect(selected);
      }}
      bind:value
      style={InputStyle.BORDERED}
      {placeholder}
      {searchStoreId}
      {searchCallback}
    />
  {/if}
</FormControlLabelWrapper>
