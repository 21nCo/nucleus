<script lang="ts">
  import { popover } from "@nucleum/actions/popover.action";
  import { TimeUnit } from "@21n/types/time.type";
  import TimeUnitDropdownPopover from "@21n/elements/input/durationInput/TimeUnitDropdownPopover.svelte";

  let {
    units,
    currentTimeUnit = $bindable(TimeUnit.MINUTES),
    onChange = undefined,
    onKeyDown = undefined
  }: {
    units: TimeUnit[];
    currentTimeUnit?: TimeUnit;
    onChange?:
      | ((event: CustomEvent<{ unit: { new: TimeUnit; old: TimeUnit } }>) => void)
      | undefined;
    onKeyDown?: ((event: KeyboardEvent) => void) | undefined;
  } = $props();

  let isUnitDropdownOpen = $state(false);
  let selectedIndex = $state(-1);
  const unitClasses: string =
    "border rounded-r-md py-2 px-4 min-w-[90px] cursor-pointer flex justify-center relative select-none border-brs3";
  const containerId = "units-dropdown-container";
  let popoverRef: HTMLElement;

  function closeUnitDropdown() {
    isUnitDropdownOpen = false;
    selectedIndex = -1;
    popoverRef?.dispatchEvent(new CustomEvent("hide"));
  }

  function handleTimeUnitItemClick(unit: TimeUnit) {
    timeUnitSelection(unit);
  }

  function onPopoverChange(event: Event) {
    const detail = (event as CustomEvent<{ open?: boolean }>).detail;
    isUnitDropdownOpen = detail?.open ?? false;
    if (isUnitDropdownOpen) selectedIndex = units.indexOf(currentTimeUnit);
  }

  function timeUnitSelection(item: TimeUnit) {
    if (currentTimeUnit !== item) {
      const changeEvent = new CustomEvent("change", {
        detail: {
          unit: {
            new: item,
            old: currentTimeUnit
          }
        }
      });
      onChange?.(changeEvent);
      currentTimeUnit = item;
    }
    closeUnitDropdown();
  }

  function handleKeyDownInDropdown(event: KeyboardEvent) {
    onKeyDown?.(event);
    if (!isUnitDropdownOpen) return;
    if (event.key === "Enter") {
      timeUnitSelection(units[selectedIndex]);
    } else if (event.key === "ArrowDown") {
      selectedIndex = Math.min(selectedIndex + 1, units.length - 1);
    } else if (event.key === "ArrowUp") {
      selectedIndex = Math.max(selectedIndex - 1, -1);
    } else if (event.key === "Escape") {
      closeUnitDropdown();
    }
  }
</script>

<button
  id={containerId}
  tabindex="0"
  bind:this={popoverRef}
  use:popover={{
    content: TimeUnitDropdownPopover,
    id: "time-unit-dropdown-popover",
    componentProps: {
      units,
      currentTimeUnit,
      isUnitDropdownOpen,
      selectedIndex,
      handleTimeUnitItemClick
    }
  }}
  onchange={onPopoverChange}
  onkeydown={handleKeyDownInDropdown}
  class={unitClasses}
>
  <div class="current-unit flex items-center gap-1">
    <span class="flex justify-center items-center h-6">{currentTimeUnit}</span>
    <div
      class={`drop-down-indicator transition-all duration-300 ease-out w-[0.5rem] h-[0.375rem] bg-fgs2 ${
        isUnitDropdownOpen ? `rotate-180` : `rotate-0`
      }`}
    />
  </div>
</button>

<style>
  .drop-down-indicator {
    clip-path: polygon(50% 100%, 0% 0, 100% 0);
  }
</style>
