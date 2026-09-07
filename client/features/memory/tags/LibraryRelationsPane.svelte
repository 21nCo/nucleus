<script lang="ts">
  import ComingSoonView from "@21n/elements/ComingSoonView.svelte";
  import Icon from "@21n/elements/Icon.svelte";
  import OptionSelector from "@21n/elements/select/OptionSelector.svelte";
  import FormLabelTooltip from "@21n/elements/text/formLabel/FormLabelTooltip.svelte";
  import Text from "@21n/elements/text/Text.svelte";
  import LinkTagsControlPanel from "@nucleum/features/memory/linking/LinkTagsControlPanel.svelte";
  import { Size } from "@21n/types/size.enum";
  import { TextStyle } from "@21n/types/text.enum";
  import { cn } from "@21n/utils/ui.utils";
  import { Resource } from "@nucleum/datafn/resource.enum";

  let {
    isLibraryNavContext = false,
    onBack = undefined
  }: {
    isLibraryNavContext?: boolean;
    onBack?: (() => void) | undefined;
  } = $props();
  let selectedSubType: Resource = Resource.linkTag;
</script>

<div class="flex flex-col gap-5 w-full h-full px-4 py-2">
  <button class="flex items-center justify-between gap-2">
    <button
      class={cn("flex items-center gap-2 rounded-md", {
        "notouch:hover:bg-bgs2 active:bg-bgs2": isLibraryNavContext
      })}
      onclick={onBack}
    >
      {#if isLibraryNavContext}
        <Icon icon="chevron-left" class="text-fgs3" />
      {/if}
      <Text content="Relations" style={TextStyle.PAGE_HEADING_SUBTLE} />
    </button>
    <FormLabelTooltip
      icon="question"
      info={{
        body: "Use relations to maintain relationship information between nodes.",
        size: Size.lg
      }}
    />
  </button>
  <div class="flex flex-col gap-3 flex-grow">
    {#if selectedSubType === Resource.linkTag || selectedSubType === Resource.relation}
      <LinkTagsControlPanel />
    {:else}
      <ComingSoonView />
    {/if}
  </div>
</div>
