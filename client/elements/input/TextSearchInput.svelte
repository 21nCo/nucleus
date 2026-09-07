<script lang="ts">
  import type { Snippet } from "svelte";
  import SearchResultsPopover from "@21n/elements/input/SearchResultsPopover.svelte";
  import InputBaseElement from "@21n/elements/InputBaseElement.svelte";
  import {
    InputStyle,
    type InputLabel,
    type PopoverInputOptions
  } from "@21n/types/input.type";
  import Icon from "@21n/elements/Icon.svelte";
  import { Placement } from "@21n/types/direction.enum";
  import { Size } from "@21n/types/size.enum";
  import { mount } from "@nucleum/actions/mount.action";
  import Tag from "@21n/elements/text/Tag.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import { isExtensionEnvironment } from "@21n/utils/browser.utils";
  import TextInput from "@21n/elements/input/TextInput.svelte";

  let {
    id = "",
    placeholder = undefined,
    value = $bindable(),
    isDisabled = false,
    icon = undefined,
    style = InputStyle.BORDERED,
    label = undefined,
    popoverOptions = undefined,
    searchStoreId = undefined,
    searchCallback = undefined,
    searchResultComponent = undefined,
    searchResultComponentProps = {},
    emptyStateLabel = undefined,
    isChipsMode = false,
    isInline = false,
    width = undefined,
    bottomMessage = undefined,
    popover: popoverSnippet = undefined,
    isShowPopoverOnFocus = false,
    isShowDefaultResultsOnMount = false,
    onBlur = undefined,
    onChange = undefined,
    onEmptyEnter = undefined,
    onFocus = undefined,
    onHide = undefined,
    onKeydown = undefined,
    onKeyup = undefined,
    onReset = undefined,
    onSelect = undefined
  }: {
    id?: string;
    placeholder?: string | undefined;
    value?: any;
    isDisabled?: boolean;
    icon?: string | undefined;
    style?: InputStyle;
    label?: InputLabel | undefined;
    popoverOptions?: PopoverInputOptions | undefined;
    searchStoreId?: string | undefined;
    searchCallback?: Function | undefined;
    searchResultComponent?: any;
    searchResultComponentProps?: Record<string, unknown>;
    emptyStateLabel?:
      string | { mainText?: string; subText?: string } | undefined;
    isChipsMode?: boolean;
    isInline?: boolean;
    width?: string | undefined;
    bottomMessage?: string | undefined;
    popover?: Snippet | undefined;
    isShowPopoverOnFocus?: boolean;
    isShowDefaultResultsOnMount?: boolean;
    onBlur?: ((event: CustomEvent<void>) => void) | undefined;
    onChange?: ((event: CustomEvent<{ value: any }>) => void) | undefined;
    onEmptyEnter?:
      | ((event: CustomEvent<{ event: KeyboardEvent; value: any }>) => void)
      | undefined;
    onFocus?: ((event: CustomEvent<void>) => void) | undefined;
    onHide?: ((event: CustomEvent<void>) => void) | undefined;
    onKeydown?: ((event: KeyboardEvent) => void) | undefined;
    onKeyup?:
      | ((
          event: CustomEvent<{
            value: any;
            event: KeyboardEvent;
            isShowSearchResults: boolean;
          }>
        ) => void)
      | undefined;
    onReset?: ((event: CustomEvent<void>) => void) | undefined;
    onSelect?: ((event: CustomEvent<any>) => void) | undefined;
  } = $props();

  let isFocused = $state(false);
  let chips = $state<any[]>([]);
  let inputRef = $state<any>();
  let popoverRef = $state<any>();
  let searchResultsPopover = $state<SearchResultsPopover | undefined>(
    undefined
  );

  export function focus() {
    if (inputRef) inputRef.focus();
  }

  export function blur() {
    if (inputRef) inputRef.blur();
  }

  function show() {
    popoverRef?.showPopover();
  }

  function emitHide() {
    const hideEvent = new CustomEvent<void>("hide");
    onHide?.(hideEvent);
  }

  function hide() {
    popoverRef?.hidePopover();
    emitHide();
  }

  export function showDefaultResults() {
    show();
    searchResultsPopover?.search();
  }

  function resolveKeyboardEvent(
    event: CustomEvent<{ event?: KeyboardEvent } | KeyboardEvent>
  ) {
    if (event.detail instanceof KeyboardEvent) return event.detail;
    if (event.detail?.event instanceof KeyboardEvent) return event.detail.event;
    return event as unknown as KeyboardEvent;
  }

  function emitKeyup(event: KeyboardEvent) {
    const keyupEvent = new CustomEvent<{
      value: any;
      event: KeyboardEvent;
      isShowSearchResults: boolean;
    }>("keyup", {
      detail: {
        value,
        event,
        isShowSearchResults: !!searchCallback || !!searchStoreId
      }
    });
    if (typeof onKeyup === "function") {
      onKeyup(keyupEvent);
    }
  }

  function onInlineKeyup(
    event: CustomEvent<{ event?: KeyboardEvent } | KeyboardEvent>
  ) {
    const keyboardEvent = resolveKeyboardEvent(event);
    if (!keyboardEvent) return;
    searchResultsPopover?.keyup(keyboardEvent);
    emitKeyup(keyboardEvent);
  }

  function onInlineKeydown(
    event: CustomEvent<{ event?: KeyboardEvent } | KeyboardEvent>
  ) {
    const keyboardEvent = resolveKeyboardEvent(event);
    if (!keyboardEvent) return;
    searchResultsPopover?.keydown(keyboardEvent);
    onKeydown?.(keyboardEvent);
  }

  function onInputKeyup(event: KeyboardEvent) {
    if (!searchCallback && !searchStoreId) {
      hide();
    } else {
      show();
    }
    searchResultsPopover?.keyup(event);
    emitKeyup(event);
  }

  function onInputValueChange() {
    if (!searchCallback && !searchStoreId) {
      hide();
    } else {
      show();
      searchResultsPopover?.queueSearch(value);
    }
    const changeEvent = new CustomEvent<{ value: any }>("change", {
      detail: { value }
    });
    if (typeof onChange === "function") {
      onChange(changeEvent);
    }
  }

  export function reset() {
    onResetInput();
    searchResultsPopover?.reset();
  }

  function onInputBlur(event: FocusEvent) {
    isFocused = false;
    const blurEvent = new CustomEvent<void>("blur");
    if (typeof onBlur === "function") {
      onBlur(blurEvent);
    }
    if (isShowPopoverOnFocus) {
      const target = event.target as HTMLElement | null;
      if (!target?.classList?.contains("text-input")) {
        hide();
      }
    }
  }

  function onResetInput() {
    value = "";
    hide();
    const resetEvent = new CustomEvent<void>("reset");
    if (typeof onReset === "function") {
      onReset(resetEvent);
    }
  }

  function onSelectInput(event: CustomEvent) {
    if (!isChipsMode) {
      if (typeof onSelect === "function") {
        onSelect(event);
      }
    }
    chips = [...chips, event.detail.item];
    value = "";
  }
</script>

{#if isInline}
  <div
    class={cn(
      "flex flex-col gap-1 bg-bgs1 p-2 rounded-md border border-brs2",
      width && width,
      {
        "mo:w-full w-[30rem] max-w-full": !width
      }
    )}
  >
    <TextInput
      bind:value
      bind:this={inputRef}
      {placeholder}
      {style}
      onKeyup={onInlineKeyup}
      onKeydown={onInlineKeydown}
    />
    <SearchResultsPopover
      bind:this={searchResultsPopover}
      {searchStoreId}
      {searchCallback}
      {emptyStateLabel}
      {searchResultComponent}
      {searchResultComponentProps}
      {bottomMessage}
      onSelect={onSelectInput}
      onEmptyEnter={(event) => {
        onEmptyEnter?.(event);
      }}
      onReset={(event: CustomEvent<void>) => onReset?.(event)}
      onHide={(event) => {
        if (typeof onHide === "function") {
          onHide(event);
        }
      }}
    />
  </div>
{:else}
  <InputBaseElement
    bind:this={popoverRef}
    popoverOptions={{
      class: "flex flex-col justify-between gap-1 items-start",
      isSpanToTriggerWidth: true,
      isPreventDefault: true,
      placement: Placement.BottomCenter,
      isUseAbsolutePositioning: isExtensionEnvironment(),
      ...popoverOptions
    }}
    {label}
    {style}
    {isFocused}
    class={cn("w-full flex gap-2", {
      "flex-wrap": isChipsMode
    })}
  >
    {#if icon}
      <Icon {icon} class="stroke-fgs3" size={Size.sm} />
    {/if}
    {#if isChipsMode && chips.length > 0}
      <div class="flex gap-2 flex-wrap">
        {#each chips as chip}
          <Tag
            label={chip.label}
            size={Size.sm}
            onRemove={() => {
              chips = chips.filter((c) => c.id !== chip.id);
            }}
          />
        {/each}
      </div>
    {/if}
    <input
      {id}
      use:mount={isShowDefaultResultsOnMount ? showDefaultResults : () => {}}
      class={cn(
        "text-input bg-transparent focus:outline-none focus:border-none placeholder:font-light placeholder:text-fgs3 placeholder:text-b2",
        {
          "w-full": !isChipsMode,
          "min-w-10 flex-1": isChipsMode
        }
      )}
      tabindex="0"
      bind:value
      onchange={(event) => {
        event.stopPropagation();
      }}
      onkeydown={(event) => {
        searchResultsPopover?.keydown(event);
        if (typeof onKeydown === "function") {
          onKeydown(event);
        }
      }}
      onkeyup={(event) => {
        event.stopPropagation();
        onInputKeyup(event);
      }}
      oninput={(event) => {
        event.stopPropagation();
        onInputValueChange();
      }}
      onclick={(event) => {
        event.stopPropagation();
      }}
      onmouseup={(event) => {
        event.stopPropagation();
      }}
      onblur={onInputBlur}
      onfocus={() => {
        isFocused = true;
        const focusEvent = new CustomEvent<void>("focus");
        if (typeof onFocus === "function") {
          onFocus(focusEvent);
        }
        if (isShowPopoverOnFocus) {
          show();
          showDefaultResults();
        }
      }}
      type="text"
      {placeholder}
      disabled={isDisabled}
      bind:this={inputRef}
      autocomplete="off"
    />
    {#snippet popover()}
      {#if popoverSnippet}
        {@render popoverSnippet()}
      {:else}
        <SearchResultsPopover
          bind:this={searchResultsPopover}
          onHide={hide}
          {searchStoreId}
          {searchCallback}
          {emptyStateLabel}
          {searchResultComponent}
          {searchResultComponentProps}
          {bottomMessage}
          onSelect={onSelectInput}
          onEmptyEnter={(event) => {
            if (typeof onEmptyEnter === "function") {
              onEmptyEnter(event);
            }
          }}
          onReset={onResetInput}
        />
      {/if}
    {/snippet}
  </InputBaseElement>
{/if}
