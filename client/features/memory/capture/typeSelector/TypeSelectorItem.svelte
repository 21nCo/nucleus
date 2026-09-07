<script lang="ts">
  import AvatarRenderer from "@21n/elements/avatarPicker/AvatarRenderer.svelte";
  import Icon from "@21n/elements/Icon.svelte";
  import context from "@nucleum/stores/context.store";
  import { OperatingSystem } from "@nucleum/client/runtime/context.type";
  import type { ISelectItem } from "@21n/elements/select/select.type";
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import { enumToString } from "@21n/shared-utils/text.utils";
  import { fade } from "svelte/transition";
  import { CaptureMethod } from "@nucleum/features/memory/capture/capture.type";
  import view from "@nucleum/stores/view.store";
  import { uiState } from "@nucleum/stores/uiState/uiState.store";
  import { UIState } from "@nucleum/stores/uiState/uiState.type";
  import {
    isSameResource,
    removeDuplicatesFilter,
    resourceInList
  } from "@nucleum/datafn/resource.utils";
  let {
    item,
    isBoxed = false,
    isActive = false,
    onSelect = undefined,
    onCapture = undefined,
    onCancel = undefined
  }: {
    item: ISelectItem & { isShortcut?: boolean };
    isBoxed?: boolean;
    isActive?: boolean;
    onSelect?: ((value: string) => void) | undefined;
    onCapture?: ((event: Event) => void) | undefined;
    onCancel?: (() => void) | undefined;
  } = $props();

  let inputRef: HTMLInputElement;
  const size = $derived(
    isBoxed && $view.isConstrainedWidth
      ? Size.lg
      : $view.isConstrainedWidth
        ? Size.sm
        : Size.md
  );

  function handleCapture(e: Event) {
    onCapture?.(e);
  }

  function handleClick(e: MouseEvent) {
    if (
      item.value === CaptureMethod.UPLOAD &&
      $context.isEmbed &&
      $context.os === OperatingSystem.IOS
    ) {
      inputRef?.click();
      return;
    }
    const val = item.value;
    if (typeof val !== "string") return;
    let recents = uiState.getState(UIState.captureShortcutRecents);
    if (recents && recents.some(resourceInList(val))) {
      recents = recents.filter((x: string) => !isSameResource(x, val));
      recents.unshift(val);
    } else if (recents) {
      recents.unshift(val);
    } else {
      recents = [val];
    }
    recents = recents.filter(removeDuplicatesFilter);
    uiState.setState(UIState.captureShortcutRecents, recents);
    onSelect?.(val);
  }
</script>

<button
  class={cn(
    "flex gap-1 dp:gap-2 items-center justify-center",
    {
      "bg-bgs2 text-aps1": isActive,
      "flex flex-col items-center justify-center gap-2 w-full h-24 dp:h-20 px-1.5":
        isBoxed,
      "notouch:hover:bg-bgs1-striped active:bg-bgs2 bg-bgs1":
        isBoxed && !isActive,
      "px-3 dp:px-5 h-14 dp:h-16 rounded-md border": !isBoxed
    },
    !isBoxed && {
      "border-brs3 notouch:hover:bg-bgs2 active:bg-bgs2": !isActive,
      "bg-bgs2 bg-opacity-50 notouch:hover:bg-opacity-100 active:bg-opacity-100":
        item.isShortcut && !isActive
    }
  )}
  data-value={item.value}
  onclick={handleClick}
  in:fade
>
  {#if item.value === CaptureMethod.UPLOAD && $context.isEmbed && $context.os === OperatingSystem.IOS}
    <input
      bind:this={inputRef}
      type="file"
      accept="*"
      onchange={handleCapture}
      oncancel={() => onCancel?.()}
      id="nativeFileInput"
      class="hidden"
    />
  {/if}
  {#if item.icon && typeof item.icon === "object"}
    <AvatarRenderer avatar={item.icon} {size} />
  {:else if (item.icon && typeof item.icon === "string") || isBoxed}
    <Icon
      icon={item.icon ?? "cube"}
      {size}
      class={cn(
        {
          "text-fgs1": isBoxed && !isActive && !item.isDisabled,
          "text-aps1": isActive && !item.isDisabled,
          "text-fgs3": item.isDisabled
        },
        !isBoxed && {}
      )}
    />
  {/if}
  <div
    class={cn("whitespace-nowrap truncate userdata", {
      "text-b3 w-full": isBoxed,
      "text-b2 dp:text-base": !isBoxed,
      "text-fgs1": isBoxed && !isActive && !item.isDisabled,
      "text-aps1 font-medium": isActive && !item.isDisabled,
      "text-fgs3": item.isDisabled
    })}
  >
    {item.label ?? enumToString(item.value)}
  </div>
</button>
