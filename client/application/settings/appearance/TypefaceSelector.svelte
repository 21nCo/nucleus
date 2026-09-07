<script lang="ts">
  import { Orientation, Placement } from "@21n/elements/direction.enum";
  import { Size } from "@21n/elements/size.enum";
  import Icon from "@21n/elements/Icon.svelte";
  import { popover, TriggerMethod } from "@nucleum/actions/popover.action";
  import { cn } from "@21n/utils/ui.utils";
  import TypefaceDropdown from "@nucleum/application/settings/appearance/TypefaceDropdown.svelte";
  import FormControlLabel from "@21n/elements/text/formLabel/FormControlLabel.svelte";

  let {
    value,
    label,
    parentBackgroundIndex = 1,
    size = Size.sm,
    onSelect = undefined
  }: {
    value: string;
    label: { label: string; orientation: Orientation };
    parentBackgroundIndex?: number;
    size?: Size.md | Size.sm;
    onSelect?: ((event: CustomEvent<string>) => void) | undefined;
  } = $props();
  void parentBackgroundIndex;

  type FontOption = {
    label: string;
    value: string;
    badge?: string;
  };

  const fontOptions: FontOption[] = [
    { label: "Albert Sans", value: "Albert Sans" },
    { label: "AR One Sans", value: "AR One Sans" },
    { label: "Arvo", value: "Arvo" },
    { label: "Cabin", value: "Cabin" },
    { label: "Comic Neue", value: "Comic Neue" },
    { label: "Didact Gothic", value: "Didact Gothic" },
    { label: "DM Sans", value: "DM Sans" },
    { label: "Figtree", value: "Figtree" },
    { label: "Fredoka", value: "Fredoka" },
    { label: "Funnel Sans", value: "Funnel Sans" },
    { label: "Geist", value: "Geist" },
    { label: "Hanken Grotesk", value: "Hanken Grotesk" },
    { label: "Host Grotesk", value: "Host Grotesk" },
    { label: "IBM Plex Sans", value: "IBM Plex Sans" },
    { label: "Inter", value: "Inter" },
    { label: "Lexend", value: "Lexend" },
    { label: "Manrope", value: "Manrope" },
    { label: "Maven Pro", value: "Maven Pro" },
    { label: "Montserrat", value: "Montserrat" },
    { label: "Noto Sans", value: "Noto Sans" },
    { label: "Nunito", value: "Nunito" },
    { label: "Onest", value: "Onest" },
    { label: "Outfit", value: "Outfit" },
    { label: "Oxygen", value: "Oxygen" },
    { label: "Parkinsans", value: "Parkinsans" },
    { label: "Plus Jakarta Sans", value: "Plus Jakarta Sans" },
    { label: "Poppins", value: "Poppins" },
    { label: "Quicksand", value: "Quicksand" },
    { label: "Questrial", value: "Questrial" },
    { label: "Recursive", value: "Recursive" },
    { label: "Red Hat Text", value: "Red Hat Text" },
    { label: "Rubik", value: "Rubik" },
    { label: "Sen", value: "Sen" },
    { label: "Sora", value: "Sora" },
    { label: "Space Grotesk", value: "Space Grotesk" },
    { label: "Teachers", value: "Teachers" },
    {
      label: "Twenty One Native",
      value: "Twenty One Native",
      badge: "Default"
    },
    { label: "Varela", value: "Varela" },
    { label: "Varela Round", value: "Varela Round" }
  ];

  let isOpen = $state(false);
  let triggerRef: HTMLButtonElement;
  let selectedFont = $state(
    fontOptions.find((font) => font.value === value) ||
      fontOptions.find((font) => font.badge === "Default") ||
      fontOptions[0]
  );

  function handleFontSelect(selectedValue: string) {
    const font = fontOptions.find((f) => f.value === selectedValue);
    if (font) {
      selectedFont = font;
      const selectEvent = new CustomEvent<string>("select", {
        detail: font.value
      });
      onSelect?.(selectEvent);
    }
  }

  $effect(() => {
    selectedFont =
      fontOptions.find((font) => font.value === value) ||
      fontOptions.find((font) => font.badge === "Default") ||
      fontOptions[0];
  });

  /**
   * Handle change event from popover action
   * popover.action.ts dispatches a change event with detail.open when the popover visibility changes
   */
  function handleChange(event: Event) {
    // Access detail property safely with type assertion
    const customEvent = event as { detail?: { open: boolean } };
    if (customEvent.detail) {
      isOpen = customEvent.detail.open;
    }
  }
</script>

<div class="relative flex flex-col gap-1">
  {#if label?.label}
    <FormControlLabel props={label} />
  {/if}
  <button
    bind:this={triggerRef}
    class={cn(
      "relative flex justify-between items-center bg-bgs1 border border-brs3 rounded-md px-3 py-2 text-fgs1 w-full",
      {
        "text-sm": size === Size.sm
      }
    )}
    use:popover={{
      content: TypefaceDropdown,
      placement: Placement.BottomCenter,
      isSpanToTriggerWidth: true,
      id: "typeface-selector-popover",
      componentProps: {
        fontOptions,
        selectedValue: selectedFont.value,
        size,
        onSelect: handleFontSelect
      }
    }}
    onchange={handleChange}
    aria-haspopup="listbox"
    aria-expanded={isOpen}
  >
    <span style="font-family: '{selectedFont.value}'">
      {selectedFont.label}
    </span>
    <Icon icon={isOpen ? "chevron-up" : "chevron-down"} size={Size.sm} />
  </button>
</div>
