<script lang="ts">
  import { Orientation } from "@21n/elements/direction.enum";
  import { TimeUnit } from "@21n/utils/time.type";
  import FormControlLabelWrapper from "@21n/elements/text/formLabel/FormControlLabelWrapper.svelte";
  import TimeInputWithSuggestions from "@21n/elements/input/durationInput/TimeInputWithSuggestions.svelte";
  import TimeUnitDropdown from "@21n/elements/input/durationInput/TimeUnitDropdown.svelte";
  import type { InputLabel } from "@21n/elements/input/input.type";
  import { debouncer } from "@21n/utils/utils";

  let {
    parentBackgroundIndex = 1,
    value = $bindable(0),
    label = undefined,
    placeholder = undefined,
    isExpanded = false,
    testId = undefined,
    onChange = undefined,
    onDebouncedChange = undefined
  }: {
    parentBackgroundIndex?: number;
    value?: number;
    label?: InputLabel | undefined;
    placeholder?: string | undefined;
    isExpanded?: boolean;
    testId?: string | undefined;
    onChange?: ((event: CustomEvent<{ value: number }>) => void) | undefined;
    onDebouncedChange?:
      | ((event: CustomEvent<{ value: number }>) => void)
      | undefined;
  } = $props();
  void parentBackgroundIndex;
  void placeholder;
  let inputRef: any;

  const units: TimeUnit[] = [TimeUnit.MINUTES, TimeUnit.HOURS];
  let currentUnit = $state(
    value != undefined && value < 3600 ? TimeUnit.MINUTES : TimeUnit.HOURS
  );

  export function focus() {
    if (inputRef) inputRef.focus();
  }

  function handleUnitChanged({
    detail: {
      unit: { new: newTimeUnit, old: oldTimeUnit }
    }
  }: {
    detail: {
      unit: {
        new: TimeUnit;
        old: TimeUnit;
      };
    };
  }) {
    if (
      (newTimeUnit === TimeUnit.HOURS && oldTimeUnit === TimeUnit.MINUTES) ||
      (newTimeUnit === TimeUnit.MINUTES && oldTimeUnit === TimeUnit.SECONDS)
    )
      value = value * 60;
    else if (
      (newTimeUnit === TimeUnit.MINUTES && oldTimeUnit === TimeUnit.HOURS) ||
      (newTimeUnit === TimeUnit.SECONDS && oldTimeUnit === TimeUnit.MINUTES)
    )
      value = value / 60;
    else if (newTimeUnit === TimeUnit.HOURS && oldTimeUnit === TimeUnit.SECONDS)
      value = value * 3600;
    else if (newTimeUnit === TimeUnit.SECONDS && oldTimeUnit === TimeUnit.HOURS)
      value = value / 3600;
    propagateChange(value);
    debouncedChange(value);
  }

  const debouncedChange = debouncer(onDebouncedValueChange, 1000);

  function propagateChange(value: number) {
    const changeEvent = new CustomEvent("change", { detail: { value } });
    onChange?.(changeEvent);
  }

  function onDebouncedValueChange(value: number) {
    if (typeof onDebouncedChange !== "function") {
      return;
    }
    const debouncedChangeEvent = new CustomEvent("debouncedChange", {
      detail: { value }
    });
    onDebouncedChange(debouncedChangeEvent);
  }
</script>

<FormControlLabelWrapper props={label}>
  <div
    data-testid={testId}
    class={label?.orientation === Orientation.Vertical
      ? "max-w--md"
      : isExpanded
        ? "w-full"
        : "max-w-[16rem]"}
  >
    <div class="text-center text-base self-center w-full">
      <div class="flex flex-col gap-1 w-full">
        <div class="relative flex items-center w-full">
          <TimeInputWithSuggestions
            {units}
            bind:duration={value}
            bind:currentUnit
            onChange={(event) => {
              const detail = event.detail;
              value = detail.value;
              propagateChange(detail.value);
            }}
          />
          <TimeUnitDropdown
            onChange={handleUnitChanged}
            {units}
            bind:currentTimeUnit={currentUnit}
          />
        </div>
      </div>
    </div>
  </div>
</FormControlLabelWrapper>
