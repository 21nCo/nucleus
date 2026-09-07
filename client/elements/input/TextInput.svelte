<script lang="ts">
  import { tick, type Snippet } from "svelte";
  import { Size } from "@21n/elements/size.enum";
  import InlineMarkdownTextInput from "@nucleum/features/memory/markdown/content/InlineMarkdownTextInput.svelte";
  import Icon from "@21n/elements/Icon.svelte";
  import { InputStyle, type InputLabel } from "@21n/elements/input/input.type";
  import InputBaseElement from "@21n/elements/InputBaseElement.svelte";
  import { isValidHyperlink } from "@21n/shared-utils/utils";
  import Link from "@21n/elements/text/Link.svelte";
  import Button from "@21n/elements/button/Button.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import { debouncer } from "@21n/utils/utils";
  import KeyboardToolbar from "@21n/elements/keyboardToolbar/KeyboardToolbar.svelte";
  import { ButtonStyle } from "@21n/elements/button/button.type";
  import context from "@nucleum/stores/context.store";
  import { OperatingSystem } from "@nucleum/client/runtime/context.type";
  import { mount } from "@nucleum/actions/mount.action";

  type KeyboardEventDetail = KeyboardEvent & { event: KeyboardEvent };

  let {
    value = $bindable(),
    placeholder = undefined,
    label = undefined,
    style = InputStyle.BORDERED,
    size = Size.md,
    parentBackgroundIndex = 1,
    type = "text",
    id = "",
    width = undefined,
    numberInputParams = undefined,
    isExperimentalMdInput = false,
    icon = undefined,
    hasControls = false,
    isShowSaveControl = false,
    isShowClearControl = false,
    isPreventDefaultOnEnter = false,
    isRounded = false,
    height = undefined,
    isPreventKeyboardToolbar = false,
    isPreserveKeyboardToolbar = false,
    isAccentBackground = false,
    testId = undefined,
    isDisabled = false,
    children = undefined,
    onBlur = undefined,
    onCancel = undefined,
    onChange = undefined,
    onClear = undefined,
    onDebouncedChange = undefined,
    onEnter = undefined,
    onFocus = undefined,
    onInput = undefined,
    onKeydown = undefined,
    onKeyup = undefined,
    onMount = undefined,
    onPaste = undefined,
    onSave = undefined
  }: {
    value?: any;
    placeholder?: string | undefined;
    label?: InputLabel | undefined;
    style?: InputStyle;
    size?: Size;
    parentBackgroundIndex?: number;
    type?: string;
    id?: string;
    width?: string | undefined;
    numberInputParams?: { min: number; max: number; step: number } | undefined;
    isExperimentalMdInput?: boolean;
    icon?: string | undefined;
    hasControls?: boolean;
    isShowSaveControl?: boolean;
    isShowClearControl?: boolean;
    isPreventDefaultOnEnter?: boolean;
    isRounded?: boolean;
    height?: string | undefined;
    isPreventKeyboardToolbar?: boolean;
    isPreserveKeyboardToolbar?: boolean;
    isAccentBackground?: boolean;
    testId?: string | undefined;
    isDisabled?: boolean;
    children?: Snippet | undefined;
    onBlur?: ((event: CustomEvent<void>) => void) | undefined;
    onCancel?:
      ((event: CustomEvent<{ event?: MouseEvent }>) => void) | undefined;
    onChange?: ((event: CustomEvent<any>) => void) | undefined;
    onClear?: (() => void) | undefined;
    onDebouncedChange?: ((event: CustomEvent<any>) => void) | undefined;
    onEnter?:
      | ((event: CustomEvent<{ value?: any; event: KeyboardEvent }>) => void)
      | undefined;
    onFocus?: ((event: CustomEvent<void>) => void) | undefined;
    onInput?: ((event: CustomEvent<{ value: any }>) => void) | undefined;
    onKeydown?: ((event: CustomEvent<KeyboardEventDetail>) => void) | undefined;
    onKeyup?:
      | ((event: CustomEvent<{ value: any; event: KeyboardEvent }>) => void)
      | undefined;
    onMount?: ((event: CustomEvent<void>) => void) | undefined;
    onPaste?: ((event: ClipboardEvent | CustomEvent<any>) => void) | undefined;
    onSave?:
      | ((event: CustomEvent<{ event: MouseEvent; value: any }>) => void)
      | undefined;
  } = $props();

  let isFocused = $state(false);
  let inputRef = $state<any>();
  let isValidLink = $state(false);
  let onBlurCallback = onBlur;

  $effect(() => {
    onBlurCallback = onBlur;
  });

  export async function focus() {
    await tick();
    if (inputRef) inputRef.focus();
  }

  export function blur() {
    if (inputRef) inputRef.blur();
  }

  export function reset() {
    value = "";
  }

  const resolvedHeight = $derived(
    height ?? (style === InputStyle.PLAIN ? "" : "h-11")
  );
  const inputClasses = $derived.by(() => {
    let classes =
      "text-input w-full bg-transparent focus:outline-none focus:border-none";
    if (style != InputStyle.PLAIN) {
      classes += " text-fgs2";
    }
    return classes;
  });
  const isLinkType = $derived(
    type === "url" || type === "link" || type === "email"
  );

  $effect(() => {
    if (isLinkType) {
      isValidLink = isValidHyperlink(value);
      return;
    }
    isValidLink = false;
  });

  function emitInputChange() {
    const inputEvent = new CustomEvent<{ value: any }>("input", {
      detail: { value }
    });
    if (typeof onInput === "function") {
      onInput(inputEvent);
    }

    const changeEvent = new CustomEvent<any>("change", { detail: value });
    if (typeof onChange === "function") {
      onChange(changeEvent);
    }

    debouncedChangeEvent();
  }

  const debouncedChangeEvent = debouncer(() => {
    const debouncedChange = new CustomEvent<any>("debouncedChange", {
      detail: value
    });
    if (typeof onDebouncedChange === "function") {
      onDebouncedChange(debouncedChange);
    }
  }, 1000);

  function createKeyboardEventDetail(
    event: KeyboardEvent
  ): KeyboardEventDetail {
    return new Proxy(event as KeyboardEvent, {
      get(target, prop) {
        if (prop === "event") return target;
        const value = Reflect.get(target, prop, target);
        if (typeof value === "function") {
          return value.bind(target);
        }
        return value;
      }
    }) as KeyboardEventDetail;
  }

  function emitKeyDown(event: KeyboardEvent) {
    const keydownEvent = new CustomEvent<KeyboardEventDetail>("keydown", {
      detail: createKeyboardEventDetail(event)
    });
    if (typeof onKeydown === "function") {
      onKeydown(keydownEvent);
    }
  }

  function emitFocus() {
    const focusEvent = new CustomEvent<void>("focus");
    if (typeof onFocus === "function") {
      onFocus(focusEvent);
    }
  }

  function emitBlur() {
    const blurEvent = new CustomEvent<void>("blur");
    const callback = onBlurCallback;
    setTimeout(() => {
      if (typeof callback !== "function") return;
      callback(blurEvent);
    }, 0);
  }

  function emitSave(event: MouseEvent) {
    const saveEvent = new CustomEvent<{ event: MouseEvent; value: any }>(
      "save",
      {
        detail: { event, value }
      }
    );
    if (typeof onSave === "function") {
      onSave(saveEvent);
    }
  }

  function emitCancel(event?: MouseEvent) {
    const cancelEvent = new CustomEvent<{ event?: MouseEvent }>("cancel", {
      detail: { event }
    });
    if (typeof onCancel === "function") {
      onCancel(cancelEvent);
    }
  }

  function emitClear() {
    if (typeof onClear === "function") {
      onClear();
    }
  }

  function handleKeyUp(event: KeyboardEvent) {
    if (event.key === "Enter") {
      const enterEvent = new CustomEvent<{ value: any; event: KeyboardEvent }>(
        "enter",
        { detail: { value, event } }
      );
      if (typeof onEnter === "function") {
        onEnter(enterEvent);
      }
    } else if (event.key === "Escape") {
      inputRef?.blur();
      emitBlur();
    }
    const keyupEvent = new CustomEvent<{ value: any; event: KeyboardEvent }>(
      "keyup",
      { detail: { value, event } }
    );
    if (typeof onKeyup === "function") {
      onKeyup(keyupEvent);
    }
  }

  function onInputBlur(event: FocusEvent) {
    if (isLinkType) {
      isValidLink = isValidHyperlink(value);
    }
    if (
      isShowClearControl &&
      (event.relatedTarget as HTMLElement | null)?.id === "input-cancel-control"
    ) {
      return;
    }
    isFocused = false;
    emitBlur();
  }

  function blurActiveElement() {
    const activeElement = document.activeElement as HTMLElement | null;
    activeElement?.blur?.();
  }

  function focusInput() {
    isFocused = true;
    requestAnimationFrame(() => {
      inputRef?.focus();
    });
  }
</script>

{#if isExperimentalMdInput}
  <div class={inputClasses} data-testid={testId}>
    <InlineMarkdownTextInput
      {id}
      bind:content={value}
      {placeholder}
      onKeydown={(event) => {
        const keyboardEvent = event.detail;
        if (isPreventDefaultOnEnter && keyboardEvent.key === "Enter") {
          keyboardEvent.preventDefault();
          const enterEvent = new CustomEvent<{ event: KeyboardEvent }>(
            "enter",
            {
              detail: { event: keyboardEvent }
            }
          );
          onEnter?.(enterEvent);
        } else {
          const keydownEvent = new CustomEvent<KeyboardEventDetail>("keydown", {
            detail: createKeyboardEventDetail(keyboardEvent)
          });
          onKeydown?.(keydownEvent);
        }
      }}
      onKeyup={(event) => {
        onKeyup?.(event);
      }}
      onFocus={() => {
        emitFocus();
      }}
      onBlur={() => {
        emitBlur();
      }}
      onChange={(event) => {
        onChange?.(event);
      }}
      onDebouncedChange={(event) => {
        onDebouncedChange?.(event);
      }}
      onEnter={(event: CustomEvent<any>) => {
        onEnter?.(event);
      }}
      onPaste={(event) => {
        onPaste?.(event);
      }}
    />
  </div>
{:else}
  <InputBaseElement
    {style}
    parentBgIndex={parentBackgroundIndex}
    {isFocused}
    {label}
    class={cn(resolvedHeight, { "!rounded-full": isRounded })}
  >
    {#if type === "password"}
      <input
        {id}
        data-testid={testId}
        class={inputClasses}
        bind:value
        onchange={(event) => event.stopPropagation()}
        onkeydown={(event) => {
          event.stopPropagation();
          emitKeyDown(event);
        }}
        onkeyup={(event) => event.stopPropagation()}
        onpaste={(event) => {
          event.stopPropagation();
          onPaste?.(event);
        }}
        oninput={(event) => {
          event.stopPropagation();
          emitInputChange();
        }}
        type="password"
        onblur={() => {
          isFocused = false;
          emitBlur();
        }}
        onfocus={() => {
          isFocused = true;
          emitFocus();
        }}
        {placeholder}
        disabled={isDisabled}
        bind:this={inputRef}
        autocomplete="off"
      />
    {:else if type === "number"}
      <input
        {id}
        data-testid={testId}
        class={inputClasses}
        bind:value
        onchange={(event) => event.stopPropagation()}
        onkeydown={(event) => {
          event.stopPropagation();
          emitKeyDown(event);
        }}
        onkeyup={(event) => event.stopPropagation()}
        onpaste={(event) => {
          event.stopPropagation();
          onPaste?.(event);
        }}
        onblur={() => {
          isFocused = false;
          emitBlur();
        }}
        onfocus={() => {
          isFocused = true;
          emitFocus();
        }}
        oninput={(event) => {
          event.stopPropagation();
          emitInputChange();
        }}
        type="number"
        min={numberInputParams?.min}
        max={numberInputParams?.max}
        step={numberInputParams?.step}
        {placeholder}
        disabled={isDisabled}
        bind:this={inputRef}
      />
    {:else}
      {#if !isFocused && isLinkType && value}
        <div class="w-full truncate">
          <div
            class="text-fgs3 h-6 w-full flex gap-2 items-center justify-start"
            onclick={focusInput}
            role="button"
            tabindex="0"
            onkeydown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                focusInput();
              }
            }}
          >
            {#if isValidLink}
              <Icon
                icon={type === "email" ? "at" : "link"}
                size={Size.sm}
                class="stroke-fgs3"
              />
              <span
                class="min-w-0 w-3/4 max-w-fit truncate flex justify-start"
                role="presentation"
                onmousedown={(event) => event.stopPropagation()}
              >
                <Link
                  href={value}
                  label={value}
                  isEnforeHttpIfMatchPattern={true}
                />
              </span>
            {:else}
              {value}
            {/if}
          </div>
        </div>
      {:else}
        {#if icon}
          <Icon {icon} size={Size.sm} class="stroke-fgs3" />
        {/if}
        <input
          {id}
          data-testid={testId}
          class={cn(inputClasses, {
            "h-7": hasControls,
            "h-12 text-h3": size === Size.lg,
            "placeholder:text-bgs3 placeholder:opacity-70": isAccentBackground
          })}
          bind:value
          onpaste={(event) => {
            event.stopPropagation();
            onPaste?.(event);
          }}
          onchange={(event) => event.stopPropagation()}
          onkeydown={emitKeyDown}
          onkeyup={(event) => {
            event.stopPropagation();
            handleKeyUp(event);
          }}
          onblur={onInputBlur}
          onfocus={() => {
            isFocused = true;
            emitFocus();
          }}
          oninput={(event) => {
            event.stopPropagation();
            emitInputChange();
          }}
          {placeholder}
          disabled={isDisabled}
          bind:this={inputRef}
          autocomplete="off"
          tabindex={isDisabled ? -1 : 0}
          {...type ? { type } : {}}
          use:mount={() => {
            const mountEvent = new CustomEvent<void>("mount");
            if (typeof onMount === "function") {
              onMount(mountEvent);
            }
          }}
        />
      {/if}
      {#if isShowSaveControl || isShowClearControl}
        <div class="flex items-center gap-1">
          {#if isShowSaveControl}
            <button
              type="button"
              id="input-save-control"
              onclick={(event) => emitSave(event)}
            >
              <Icon icon="check" />
            </button>
          {/if}
          {#if isShowSaveControl || isShowClearControl}
            <button
              type="button"
              id="input-cancel-control"
              onclick={(event) => {
                event.stopPropagation();
                if (isShowClearControl) emitClear();
                emitCancel(event);
              }}
            >
              <Icon icon="cross" />
            </button>
          {/if}
        </div>
      {/if}
    {/if}
    {@render children?.()}
  </InputBaseElement>
{/if}
{#if isPreserveKeyboardToolbar || (!isPreventKeyboardToolbar && isFocused)}
  <KeyboardToolbar class="bg-bgs2 h-14 px-4 flex items-center justify-between">
    <div class="flex items-center justify-center gap-2"></div>
    <div class="flex items-center justify-center gap-2">
      <Button
        icon="cross"
        label="clear"
        parentBgIndex={2}
        size={Size.sm}
        style={ButtonStyle.DEFAULT}
        isPreventMinWidth={true}
        onclick={() => {
          value = "";
          emitClear();
          emitCancel();
        }}
        onmousedown={(event) => event.preventDefault()}
      />
      <Button
        icon="chevron-down"
        label="close"
        parentBgIndex={2}
        size={Size.sm}
        style={ButtonStyle.DEFAULT}
        isPreventMinWidth={true}
        onclick={blurActiveElement}
      />
    </div>
  </KeyboardToolbar>
{/if}
