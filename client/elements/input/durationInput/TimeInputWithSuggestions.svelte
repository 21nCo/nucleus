<script lang="ts">
  import { TimeUnit } from "@21n/utils/time.type";
  import { cn } from "@21n/utils/ui.utils";
  import TextSearchInput from "@21n/elements/input/TextSearchInput.svelte";
  import { InputStyle } from "@21n/elements/input/input.type";

  let {
    units,
    duration = $bindable(0),
    currentUnit = $bindable(TimeUnit.MINUTES),
    hoursLimit = undefined,
    isSuggestionsDisabled = true,
    onChange = undefined
  }: {
    units: TimeUnit[];
    duration?: number;
    currentUnit?: TimeUnit;
    hoursLimit?: number | undefined;
    isSuggestionsDisabled?: boolean;
    onChange?:
      | ((event: CustomEvent<{ value: number; unit: TimeUnit }>) => void)
      | undefined;
  } = $props();
  let isFocusing = $state(false);
  let value = $state("");
  $effect(() => {
    if (currentUnit === TimeUnit.HOURS) {
      value = `${duration / 3600}`;
    } else if (currentUnit === TimeUnit.MINUTES) {
      value = `${duration / 60}`;
    } else {
      value = `${duration}`;
    }
  });

  function generateSuggestions(searchQuery: string) {
    const input = parseFloat(searchQuery);
    let suggestions: any[] = [];
    const hasLetter = /[a-z]/i.test(searchQuery);

    if (
      units.includes(TimeUnit.HOURS) &&
      ((hoursLimit && input <= hoursLimit) || !hoursLimit) &&
      (!hasLetter || /h(o(u(r)?)?)?.*/i.test(searchQuery.toLowerCase()))
    ) {
      const hours = Math.floor(input);
      const minutes = Math.round((input - hours) * 60);
      let suggestion = `${hours} hour${hours !== 1 ? "s" : ""}`;
      if (minutes !== 0) {
        suggestion += ` ${minutes} minute${minutes !== 1 ? "s" : ""}`;
      }
      const valueInSeconds = hours * 3600 + minutes * 60;
      suggestions.push({
        label: suggestion,
        value: valueInSeconds,
        unit: TimeUnit.HOURS
      });
    }
    if (
      units.includes(TimeUnit.MINUTES) &&
      (!hasLetter ||
        /m(i(n(u(t(e(s)?)?)?)?)?)?.*/i.test(searchQuery.toLowerCase()))
    ) {
      const minutes = Math.floor(input);
      const seconds = Math.round((input - minutes) * 60);
      let suggestion = `${minutes} minute${minutes !== 1 ? "s" : ""}`;
      if (seconds !== 0) {
        suggestion += ` ${seconds} second${seconds !== 1 ? "s" : ""}`;
      }
      const valueInSeconds = minutes * 60 + seconds;
      suggestions.push({
        label: suggestion,
        value: valueInSeconds,
        unit: TimeUnit.MINUTES
      });
    }
    return suggestions;
  }
  function onsearch(searchQuery: string) {
    let suggestions: { label: string; value: number; unit: TimeUnit }[] = [];
    if (searchQuery.length > 0 && !isSuggestionsDisabled) {
      suggestions = generateSuggestions(searchQuery);
    }
    return suggestions;
  }
  function onselect(
    event: CustomEvent<{
      item: { label: string; value: number; unit: TimeUnit };
    }>
  ) {
    duration = event.detail.item.value;
    currentUnit = event.detail.item.unit;
    propagateChange();
  }
  function onkeyup(
    x: CustomEvent<{
      value: string;
      event: KeyboardEvent;
      isShowSearchResults: boolean;
    }>
  ) {
    const event = x.detail.event;
    if (x.detail.isShowSearchResults) return;
    if (!/^\d+$/.test(x.detail.value)) return;
    if (event.key === "ArrowDown") {
      value = (+value - 1).toString();
    } else if (event.key === "ArrowUp") {
      value = (+value + 1).toString();
    }
    duration =
      +value *
      (currentUnit === TimeUnit.HOURS
        ? 3600
        : currentUnit === TimeUnit.MINUTES
          ? 60
          : 1);
    propagateChange();
    event.preventDefault();
  }
  function handleChange(event: any) {
    if (!event.detail?.value) return;
    if (!/^\d+$/.test(value)) return;
    duration =
      +value *
      (currentUnit === TimeUnit.HOURS
        ? 3600
        : currentUnit === TimeUnit.MINUTES
          ? 60
          : 1);
    propagateChange();
  }

  function propagateChange() {
    const changeEvent = new CustomEvent("change", {
      detail: { value: duration, unit: currentUnit }
    });
    onChange?.(changeEvent);
  }
</script>

<div
  class={cn("flex w-full rounded-l-md border p-2", {
    "border-brs3": !isFocusing,
    "border-aps1": isFocusing
  })}
>
  <TextSearchInput
    bind:value
    onKeyup={onkeyup}
    onFocus={() => (isFocusing = true)}
    onBlur={() => (isFocusing = false)}
    onChange={handleChange}
    style={InputStyle.PLAIN}
    placeholder="Duration"
    searchCallback={isSuggestionsDisabled ? undefined : onsearch}
    onSelect={onselect}
    popoverOptions={{ offsetInPx: 10 }}
  />
</div>
