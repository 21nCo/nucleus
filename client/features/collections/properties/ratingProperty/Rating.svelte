<script lang="ts">
  import { InputStyle, type InputLabel } from "@21n/types/input.type";
  import { cn } from "@21n/utils/ui.utils";
  import InputBaseElement from "@21n/elements/InputBaseElement.svelte";
  import Icon from "@21n/elements/Icon.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  let {
    avatar = "star",
    count = $bindable(5),
    value = $bindable(0),
    style = InputStyle.BORDERED,
    label = undefined,
    isReadOnlyMode = false,
    parentBgIndex = 1,
    onChange = undefined
  }: {
    avatar?: string;
    count?: number;
    value?: number;
    style?: InputStyle;
    label?: InputLabel | undefined;
    isReadOnlyMode?: boolean;
    parentBgIndex?: number;
    onChange?: ((event: CustomEvent<number>) => void) | undefined;
  } = $props();
  const resolvedAvatar = $derived(typeof avatar === "string" ? avatar : "star");

  function emitChange(nextValue: number) {
    onChange?.(
      new CustomEvent("change", {
        detail: nextValue
      })
    );
  }
</script>

{#if isReadOnlyMode}
  {#if count <= 6}
    <div class={cn("flex gap-1")}>
      {#each Array(count) as _, item}
        {@const _icon = +item + 1 <= value ? resolvedAvatar + "-fill" : resolvedAvatar}
        <Icon icon={`ph:${_icon}`} />
      {/each}
    </div>
  {:else}
    <span class="flex items-center gap-1">
      <Icon icon={`ph:${resolvedAvatar}-fill`} />
      <span>{value} / {count}</span>
    </span>
  {/if}
{:else}
  <InputBaseElement {style} {label} {parentBgIndex}>
    {#if typeof count === "number" && count <= 6}
      <div class={cn("flex gap-2")}>
        {#each Array(count) as _, item}
          {@const _icon = +item + 1 <= value ? resolvedAvatar + "-fill" : resolvedAvatar}
          <button
            onclick={() => {
              value = +item + 1;
              emitChange(value);
            }}
            class="flex items-center h-full"
          >
            <Icon icon={`ph:${_icon}`} />
          </button>
        {/each}
      </div>
    {:else}
      <div class="flex items-center justify-between gap-1 w-full">
        <div class="flex items-center gap-1">
          <Icon icon={`ph:${resolvedAvatar}-fill`} />
          <TextInput
            {value}
            type="number"
            onChange={(e) => {
              if (e.detail) value = e.detail;
            }}
            onDebouncedChange={() => {
              emitChange(value);
            }}
            style={InputStyle.PLAIN}
            numberInputParams={{ min: 1, max: count, step: 1 }}
          />
        </div>
        <span>/{count}</span>
      </div>
    {/if}
  </InputBaseElement>
{/if}
