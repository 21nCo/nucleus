<script>
  import Autocomplete from "@21n/elements/autocomplete/Autocomplete.svelte";
  import Button from "@21n/elements/button/Button.svelte";
  import PanelSwitcher from "@21n/elements/switcher/PanelSwitcher.svelte";
  import Text from "@21n/elements/text/Text.svelte";
  import NodeThumbnail from "@nucleum/features/memory/node/thumbnail/NodeThumbnail.svelte";
  import { appStore } from "@nucleum/stores/app.store";
  import { ButtonVariant } from "@21n/types/button.type";
  import { Size } from "@21n/types/size.enum";
  import { PanelSwitcherStyle } from "@21n/types/switcher.enum";
  import { TextStyle } from "@21n/types/text.enum";
  import { isValidArrayWithData } from "@21n/shared-utils/obj.utils";
  import { docStore } from "$local/client/products/gathery/docs.store";
  import { GatheryEvent } from "@21n/types/gathery/gatheryEvent.enum";
  let { searchInput = $bindable("") }: { searchInput?: string } = $props();
  docStore.refresh();
</script>

<div class="flex flex-col w-full h-full pt-4 px-8 pb-4 gap-6">
  <div class="flex w-full items-center justify-between">
    <Text content="Docs" style={TextStyle.PAGE_HEADING} />
    <!-- <TextInput
      bind:value={searchInput}
      style={TextInputStyle.OUTLINED}
      width="max-w-fit"
      size={Size.xs}
      placeholder="search docs..."
    /> -->
    <Autocomplete
      inputClassList="rounded-full"
      wrapperClassList="w-[28rem]"
      bind:inputValue={searchInput}
      placeholder="search docs"
      hideResetIcon={true}
      onSearch={() => {}}
      onReset={() => {
        // isShowSearchBar = false;
      }}
    />
    <Button
      label="Create new doc"
      size={Size.sm}
      type={ButtonVariant.PRIMARY}
      onclick={() => {
        appStore.runAction(GatheryEvent.NEW_DOC);
      }}
    />
  </div>
  <div class="flex flex-col gap-4 w-full flex-grow">
    <div class="flex justify-center w-full">
      <PanelSwitcher
        items={["All", "Starred"]}
        style={PanelSwitcherStyle.TRAIN}
        size={Size.sm}
      />
    </div>
    <div class="flex flex-col h-full gap-2 overflow-auto">
      {#if isValidArrayWithData($docStore.docs)}
        {#each $docStore.docs as doc}
          <NodeThumbnail
            item={doc}
            onClick={() => {
              appStore.toggleSearchParam({ doc: doc.id });
              appStore.runAction(GatheryEvent.OPEN_DOC, doc);
            }}
          />
        {/each}
      {/if}
    </div>
  </div>
</div>
