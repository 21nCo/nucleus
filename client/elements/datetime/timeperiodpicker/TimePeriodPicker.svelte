<script lang="ts">
  import { popover } from "@nucleum/actions/popover.action";
  import { InputStyle } from "@21n/elements/input/input.type";
  import type { TimePeriod } from "@21n/utils/time.type";
  import { timePeriodLabel } from "@21n/utils/time.utils";
  import FormElement from "@21n/elements/FormElement.svelte";
  import Icon from "@21n/elements/Icon.svelte";
  import TimePeriodPopover from "@21n/elements/datetime/timeperiodpicker/TimePeriodPopover.svelte";

  let { period = $bindable(), parentBgIndex = 1, onChange = undefined }: any = $props();
  void parentBgIndex;
  let isActive = $state(false);
  const label = $derived(timePeriodLabel(period));

  function emitChange(nextPeriod: TimePeriod) {
    const changeEvent = new CustomEvent<TimePeriod>("change", {
      detail: nextPeriod
    });
    onChange?.(changeEvent);
  }

  function onTimePeriodChange(val: TimePeriod) {
    period = val;
    emitChange(val);
  }

  function onPopoverChange(e: Event) {
    isActive = (e as CustomEvent<{ open?: boolean }>).detail?.open ?? false;
  }
</script>

<FormElement style={InputStyle.BORDERED} isFocused={isActive}>
  <div
    class="flex items-center justify-between w-full p-2"
    use:popover={{
      content: TimePeriodPopover,
      id: "time-period-popover",
      isRenderAsModalForCW: true,
      componentProps: {
        period,
        onChange: onTimePeriodChange
      }
    }}
    onchange={onPopoverChange}
  >
    <span class="text-wrap">
      {label}
    </span>
    <Icon icon={isActive ? "chevron-up" : "chevron-down"} />
  </div>
</FormElement>
