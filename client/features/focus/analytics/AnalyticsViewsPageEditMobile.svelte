<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import { InputStyle } from "@21n/types/input.type";
  import { Size } from "@21n/types/size.enum";
  import { debouncer } from "@21n/utils/utils";
  import { analyticsConfigStore } from "@nucleum/features/focus/analytics/analytics.store";
  import {
    onAddPageClicked,
    onPagelabelChange,
    onRemovePageClicked
  } from "@nucleum/features/focus/analytics/analytics.utils";

  let pages = $derived(
    $analyticsConfigStore.pages.length > 0
      ? $analyticsConfigStore.pages?.map((page) => {
          return { label: page.label, value: page.id };
        })
      : []
  );
  let labelChangeEvent = new CustomEvent<{ value: string; label: string }>(
    "pageLabelChange",
    {
      detail: {
        value: "",
        label: ""
      }
    }
  );
  const debounceLabelChange = debouncer(
    () => onPagelabelChange(labelChangeEvent),
    500
  );
</script>

<div class="flex flex-col space-y-4 justify-center items-center">
  {#each pages as page}
    <div class="flex justify-center gap-1 border border-brs3 rounded-md w-full">
      <div class="flex-1 mr-2 px-4 py-2">
        <TextInput
          value={page.label}
          style={InputStyle.PLAIN}
          onChange={(e) => {
            labelChangeEvent.detail.label = e.detail.value;
            labelChangeEvent.detail.value = page.value;
            debounceLabelChange();
          }}
        />
      </div>
      <Button
        icon="cross"
        size={Size.sm}
        onclick={() => {
          const customEvt = new CustomEvent("pageRemove", {
            detail: page.value
          });
          onRemovePageClicked(customEvt);
        }}
      />
    </div>
  {/each}
  <Button
    icon="plus"
    size={Size.sm}
    onclick={onAddPageClicked}
    label="Add new"
  />
</div>
