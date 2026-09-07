<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/types/size.enum";
  import { parseAndFormatDate } from "@21n/utils/time.utils";
  import { InputStyle, type InputLabel } from "@21n/types/input.type";
  import FormElement from "@21n/elements/FormElement.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import { popover } from "@nucleum/actions/popover.action";
  import AbsoluteTimeRangePopoverV2 from "@21n/elements/datetime/absolute/AbsoluteTimeRangePopoverV2.svelte";
  let {
    parentBackgroundIndex = 1,
    date = $bindable(),
    style = InputStyle.BORDERED,
    label = undefined,
    placeholder = "Select a date",
    variant = "wide",
    id = "",
    size = Size.md,
    onChange = undefined,
    onOpened = undefined,
    onClosed = undefined
  }: {
    parentBackgroundIndex?: number;
    date?: Date | undefined;
    style?: InputStyle;
    label?: InputLabel | undefined;
    placeholder?: string;
    variant?:
      | "wide"
      | "wide-center"
      | "inline"
      | "icon-only"
      | "inline-with-icon"
      | "use-time-period-picker";
    id?: string;
    size?: Size.sm | Size.md | Size.lg;
    onChange?: ((event: CustomEvent<Date>) => void) | undefined;
    onOpened?: ((event: CustomEvent<void>) => void) | undefined;
    onClosed?: ((event: CustomEvent<void>) => void) | undefined;
  } = $props();
  let ref = $state<HTMLElement>();
  let isPopoverActive = $state(false);
  let isPopoverVisible = $state(false);
  let dateInput = $state<HTMLInputElement>();
  let _date = $state<Date>(date ?? new Date());

  $effect(() => {
    if (date) {
      _date = date;
    }
  });

  function emitChange(nextDate: Date) {
    const changeEvent = new CustomEvent<Date>("change", {
      detail: nextDate
    });
    onChange?.(changeEvent);
  }

  function emitOpened() {
    const openedEvent = new CustomEvent<void>("opened");
    onOpened?.(openedEvent);
  }

  function emitClosed() {
    const closedEvent = new CustomEvent<void>("closed");
    onClosed?.(closedEvent);
  }

  function updateDate(e: any) {
    const newDate = new Date(e.target.value);
    date = newDate;
    _date = newDate;
    emitChange(newDate);
  }

  function hidePopover() {
    ref?.dispatchEvent(new CustomEvent("hide"));
  }

  function onDateChange(val: Date) {
    date = val;
    _date = val;
    emitChange(val);
    hidePopover();
  }

  function onPopoverChange(e: Event) {
    const detail = (e as CustomEvent<{ open?: boolean }>).detail;
    isPopoverVisible = detail?.open ?? false;
    if (isPopoverVisible) {
      emitOpened();
    } else {
      emitClosed();
    }
  }
</script>

{#if variant == "wide" || variant == "wide-center"}
  <FormElement
    {style}
    {label}
    isFocused={isPopoverVisible}
    parentBgIndex={parentBackgroundIndex}
  >
    <button
      class={cn("flex items-center gap-2 p-2 w-full number-grid-size", {
        "justify-center": variant == "wide-center",
        "justify-start": variant == "wide"
      })}
      bind:this={ref}
      use:popover={{
        content: AbsoluteTimeRangePopoverV2,
        id: "date-picker-popover" + id,
        isRenderAsModalForCW: true,
        componentProps: {
          isDatePickerMode: true,
          selectedDate: _date,
          onDateChange
        }
      }}
      onchange={onPopoverChange}
    >
      <Icon icon="calendar" size={Size.md} />
      {#if date}
        <span class="text-fgs2 text-base">
          {parseAndFormatDate(date)}
        </span>
      {:else}
        <span class="text-fgs2 text-b2">{placeholder}</span>
      {/if}
    </button>
  </FormElement>
{:else if variant == "inline" || variant == "icon-only" || variant === "inline-with-icon"}
  <button
    class={cn(
      "relative flex items-center gap-1 justify-center number-grid-size",
      {
        "flex items-center justify-center border border-brs3 rounded-md hover:bg-bgs2":
          variant === "icon-only",
        "p-1": variant === "icon-only" && size === Size.sm,
        "p-1.5": variant === "icon-only" && size !== Size.sm,
        "underline-dotted": variant === "inline",
        "h-full px-3": variant === "inline-with-icon"
      }
    )}
    bind:this={ref}
    use:popover={{
      content: AbsoluteTimeRangePopoverV2,
      id: "date-picker-popover",
      isRenderAsModalForCW: true,
        componentProps: {
          isDatePickerMode: true,
          selectedDate: _date,
          onDateChange
        }
      }}
      onchange={onPopoverChange}
    >
    {#if variant === "icon-only" || variant === "inline-with-icon"}
      <Icon icon="calendar-blank" />
    {/if}
    {#if variant === "inline" || variant === "inline-with-icon"}
      {date ? parseAndFormatDate(date) : placeholder}
    {/if}
  </button>
{:else}
  <div class="relative">
    <input
      bind:this={dateInput}
      bind:value={date}
      oninput={updateDate}
      type="date"
      class="absolute w-full h-full opacity-0 cursor-pointer bg-bgs3"
    />
    <button
      class="flex items-center rounded-md p-2"
      onclick={(e) => {
        console.log("clicked", e, isPopoverActive);
        if (!dateInput) return;
        if (isPopoverActive) {
          dateInput.blur();
          isPopoverActive = false;
        } else {
          dateInput.focus();
          dateInput.click();
          isPopoverActive = true;
        }
      }}
    >
      <Icon icon="calendar" size={Size.lg} />
      <!-- {#if variant === "inline"}
        <span class="ml-2 text-fgs2">{formatDate(date)}</span>
      {/if} -->
      <!-- {formatDate(date)} -->
    </button>
  </div>
{/if}

<style>
  input::-webkit-calendar-picker-indicator {
    /* Change the default appearance of the calendar icon */

    background-size: contain;
    background-repeat: no-repeat;
    filter: invert(60%);
  }

  input[type="date"] {
    margin-top: 1px;
  }

  ::-webkit-datetime-edit-text {
    /* Change the font style and color of the date value */
    font-size: 14px;
    font-family: sans-serif;
  }

  ::-webkit-datetime-edit-fields-wrapper {
    /* Change the padding of the date value fields */
    padding: 0.25rem;
  }

  ::-webkit-calendar-picker-popup {
    /* Change the background color and border of the calendar popover */
    background-color: rgba(var(--colors-bgs2));
    border: 1px solid #e5e7eb;
  }
</style>
