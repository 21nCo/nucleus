<script lang="ts">
  import { cn, bg } from "@21n/utils/ui.utils";
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/elements/size.enum";
  import type { Dayjs } from "dayjs";

  let {
    parentBgIndex = 0,
    isActive = false,
    selectedDate = null,
    label,
    onInputChange,
    onClear,
    onBoxClick
  }: any = $props();
  const selectedDateFormatted = $derived(
    selectedDate?.format("YYYY-MM-DD") || ""
  );
  let inputValue = $state("");
  $effect(() => {
    inputValue = selectedDateFormatted;
  });

  function handleClick(e?: MouseEvent) {
    inputValue = selectedDate?.format("YYYY-MM-DD") || "";
    if (!isActive) {
      isActive = true;
    }
    if (e) {
      onBoxClick(e);
    }
  }

  function handleBlur() {
    isActive = false;
    inputValue = selectedDate?.format("YYYY-MM-DD") || "";
  }

  function handleInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    inputValue = value;
    onInputChange(value);
    if (!isActive) {
      isActive = true;
    }
  }

  function handleClear(e: MouseEvent) {
    inputValue = "";
    isActive = true;
    onClear(e);
  }
</script>

<div class="flex flex-col items-start gap-1 flex-1">
  <div class="text-b2">{label}</div>
  <div
    class={cn(
      "w-full text-b2 text-fgs3 px-2 py-1 rounded-md cursor-pointer flex items-center justify-between",
      {
        [bg(parentBgIndex + 1)]: true,
        "ring-2 ring-aps1": isActive
      }
    )}
    role="button"
    tabindex="0"
    onclick={handleClick}
    onkeydown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleClick();
      }
    }}
  >
    {#if selectedDate && !isActive}
      <span class="truncate">{selectedDate.format("YYYY-MM-DD")}</span>
    {:else}
      <input
        type="text"
        class="bg-transparent outline-none w-full"
        placeholder="yyyy-mm-dd"
        bind:value={inputValue}
        oninput={handleInput}
        onblur={handleBlur}
      />
    {/if}
    {#if selectedDate}
      <button
        type="button"
        class="flex-shrink-0 p-1 flex items-center justify-center hover:bg-bgs3 rounded-md"
        onclick={handleClear}
      >
        <Icon icon="x-circle" size={Size.xs} class="stroke-ars1" />
      </button>
    {/if}
  </div>
</div>
