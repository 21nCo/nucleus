<script lang="ts">
  import type { ISelectItem, ISelectValue } from "@21n/elements/select/select.type";
  import Icon from "../Icon.svelte";
  import { bg, cn } from "@21n/utils/ui.utils";
  import { Size } from "@21n/elements/size.enum";
  import { onMount } from "svelte";
  import { tooltip } from "@nucleum/actions/popover.action";

  let {
    options,
    selected = $bindable<ISelectValue | undefined>(undefined),
    isTablist = false,
    isIconOnlyMode = false,
    isExpandOnActiveForIcon = false,
    parentBgIndex = 1,
    isAccentColor = false,
    size = Size.sm,
    isActiveIndicatorOnTop = false,
    onSelect = undefined
  }: {
    options: ISelectItem[];
    selected?: ISelectValue | undefined;
    isTablist?: boolean;
    isIconOnlyMode?: boolean;
    isExpandOnActiveForIcon?: boolean;
    parentBgIndex?: number;
    isAccentColor?: boolean;
    size?: Size.sm | Size.md;
    isActiveIndicatorOnTop?: boolean;
    onSelect?: ((event: CustomEvent<any>) => void) | undefined;
  } = $props();
  $effect(() => {
    if (selected === undefined) selected = options[0]?.value;
  });

  let containerWidth = $state(0);
  let containerEl = $state<HTMLDivElement | undefined>();

  function emitSelect(nextSelected: ISelectValue) {
    const selectEvent = new CustomEvent<any>("select", {
      detail: nextSelected
    });
    onSelect?.(selectEvent);
  }

  onMount(() => {
    if (isExpandOnActiveForIcon && containerEl) {
      const tempDiv = document.createElement("div");
      tempDiv.style.cssText =
        "position:absolute;visibility:hidden;white-space:nowrap";
      tempDiv.className = "text-b2";
      document.body.appendChild(tempDiv);

      const iconWidth = size === Size.sm ? 20 : 24;
      const padding = size === Size.sm ? 24 : 32;
      const iconOnlyWidth = iconWidth + padding;
      const inactiveCount = options.length - 1;

      let maxLabelWidth = 0;
      options.forEach((opt) => {
        if (opt.label) {
          tempDiv.textContent = opt.label;
          maxLabelWidth = Math.max(maxLabelWidth, tempDiv.offsetWidth);
        }
      });

      containerWidth =
        inactiveCount * iconOnlyWidth +
        (iconWidth + maxLabelWidth + padding + 4);
      document.body.removeChild(tempDiv);
    }
  });
</script>

<div
  role={isTablist ? "tablist" : undefined}
  bind:this={containerEl}
  class={cn("grid grid-flow-col h-full", {
    "auto-cols-max w-full": !isExpandOnActiveForIcon || isIconOnlyMode
  })}
  style:width={!isIconOnlyMode && isExpandOnActiveForIcon && containerWidth > 0
    ? `${containerWidth}px`
    : undefined}
  style:grid-template-columns={isExpandOnActiveForIcon
    ? options.map((opt) => (opt.value === selected ? "1fr" : "auto")).join(" ")
    : undefined}
>
  {#each options as option (option.value)}
    {@const isSelected = selected === option.value}
    <button
      type="button"
      role={isTablist ? "tab" : undefined}
      aria-selected={isTablist ? isSelected : undefined}
      aria-label={option.label}
      class={cn(
        "flex items-center justify-center gap-1 h-full text-b2 transition-all duration-300",
        {
          "border-t": isActiveIndicatorOnTop,
          "border-b": !isActiveIndicatorOnTop,
          "px-3": size === Size.sm,
          "px-4": size === Size.md,
          "border-transparent hover:border-brs3 text-fgs3": !isSelected,
          "border-fgs2": isSelected && !isAccentColor,
          "border-aps1 text-aps1": isSelected && isAccentColor,
          [`${bg(parentBgIndex)}`]: isSelected,
          [`hover:${bg(parentBgIndex)}-striped`]: !isSelected
        }
      )}
      onclick={() => {
        selected = option.value;
        emitSelect(option.value);
      }}
      use:tooltip={{
        text: option.label,
        delay: isSelected || !isExpandOnActiveForIcon ? 1000 : 200
      }}
    >
      {#if option.icon && typeof option.icon === "string"}
        <Icon
          icon={option.icon}
          {size}
          isFilled={isSelected}
          class={cn({
            "text-fgs1": isSelected && !isAccentColor,
            "text-aps1": isSelected && isAccentColor,
            "text-fgs2": !isSelected
          })}
        />
      {/if}
      {#if !isIconOnlyMode && option.label && (!isExpandOnActiveForIcon || selected === option.value)}
        <span class="whitespace-nowrap">
          {option.label}
        </span>
      {/if}
    </button>
  {/each}
</div>
