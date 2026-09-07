<script lang="ts">
  import { pointronPreferences } from "@nucleum/products/pointron/pointron.store";
  import {
    BreakCompositionType,
    type SessionComposition
  } from "@21n/types/pointron/sessionComposition.type";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import DurationInput from "@21n/elements/input/durationInput/DurationInput.svelte";
  import OptionSelector from "@21n/elements/select/OptionSelector.svelte";
  import { Orientation } from "@21n/types/direction.enum";
  import { OptionSelectorStyle } from "@21n/types/select.type";
  import { deepCopy } from "@21n/shared-utils/obj.utils";
  let {
    composition = $bindable(),
    isDisablePredefined = false,
    reminderOnly = false,
    onChange = undefined
  }: {
    composition: SessionComposition;
    isDisablePredefined?: boolean;
    reminderOnly?: boolean;
    onChange?: ((event: CustomEvent<SessionComposition>) => void) | undefined;
  } = $props();
  const labelProps = { orientation: Orientation.Vertical };

  function ensureCompositionDefaults() {
    const next = {
      ...composition,
      breakType: reminderOnly
        ? BreakCompositionType.REMINDER
        : composition.breakType,
      breakReminder:
        !composition.breakReminder || composition.breakReminder == 0
          ? $pointronPreferences.breakReminder
          : composition.breakReminder,
      breakDuration:
        !composition.breakDuration || composition.breakDuration == 0
          ? 5 * 60
          : composition.breakDuration,
      numberOfBreaks:
        !composition.numberOfBreaks || composition.numberOfBreaks == 0
          ? 2
          : composition.numberOfBreaks
    };
    if (
      next.breakType !== composition.breakType ||
      next.breakReminder !== composition.breakReminder ||
      next.breakDuration !== composition.breakDuration ||
      next.numberOfBreaks !== composition.numberOfBreaks
    ) {
      composition = next;
    }
  }

  ensureCompositionDefaults();
  let breakReminder = $state(composition.breakReminder);
  let breakDuration = $state(composition.breakDuration);
  let numberOfBreaks = $state(composition.numberOfBreaks);

  $effect(() => {
    ensureCompositionDefaults();
    breakReminder = composition.breakReminder;
    breakDuration = composition.breakDuration;
    numberOfBreaks = composition.numberOfBreaks;
  });

  function normalizeNumber(value: unknown) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  function updateNumberOfBreaks(event: CustomEvent<unknown>) {
    numberOfBreaks = normalizeNumber(event.detail);
    const nextComposition = { ...composition, numberOfBreaks };
    composition = nextComposition;
    emitChange(nextComposition);
  }

  function updateBreakDuration(event: CustomEvent<{ value: number }>) {
    breakDuration = normalizeNumber(event.detail?.value);
    const nextComposition = { ...composition, breakDuration };
    composition = nextComposition;
    emitChange(nextComposition);
  }

  function updateBreakReminder(event: CustomEvent<{ value: number }>) {
    breakReminder = normalizeNumber(event.detail?.value);
    const nextComposition = { ...composition, breakReminder };
    composition = nextComposition;
    emitChange(nextComposition);
  }

  function emitChange(nextComposition: SessionComposition = composition) {
    const changeEvent = new CustomEvent<SessionComposition>("change", {
      detail: deepCopy(nextComposition)
    });
    onChange?.(changeEvent);
  }
</script>

<div class="flex flex-col w-full gap-2 items-start">
  <div class="flex flex-col w-full gap-6 items-center">
    {#if !reminderOnly}
      <OptionSelector
        options={[
          { value: BreakCompositionType.REMINDER },
          {
            value: BreakCompositionType.PREDEFINED,
            isDisabled: isDisablePredefined
          }
        ]}
        labelProps={{
          ...labelProps,
          label: "Break type",
          tooltip: {
            body: `Choose **Reminder** to recieve a break notification every certain time, or **Predefined** to have a fixed number of breaks with a fixed duration.`
          }
        }}
        onSelect={(e) => {
          const nextComposition = { ...composition, breakType: e.detail };
          composition = nextComposition;
          emitChange(nextComposition);
        }}
        style={OptionSelectorStyle.CHECK_CIRCLE}
        selected={composition.breakType}
      />
    {/if}
    {#if !reminderOnly && composition.breakType == BreakCompositionType.PREDEFINED}
      <TextInput
        bind:value={numberOfBreaks}
        placeholder="No. of breaks"
        onChange={updateNumberOfBreaks}
        label={{ ...labelProps, label: "No. of breaks" }}
        testId="advanced-focus-number-of-breaks"
        type="number"
      />
      <DurationInput
        bind:value={breakDuration}
        onChange={updateBreakDuration}
        label={{ ...labelProps, label: "Break duration" }}
        testId="advanced-focus-break-duration"
      />
    {:else}
      <DurationInput
        bind:value={breakReminder}
        onChange={updateBreakReminder}
        label={{ ...labelProps, label: "Remind every" }}
        testId="advanced-focus-break-reminder"
      />
    {/if}
  </div>
</div>
