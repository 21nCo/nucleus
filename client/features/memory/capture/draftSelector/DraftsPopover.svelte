<script lang="ts">
  import Text from "@21n/elements/text/Text.svelte";
  import type { IRecordId } from "@21n/types/data.type";
  import { TextStyle } from "@21n/types/text.enum";
  import type { ICapture } from "@nucleum/features/memory/capture/capture.type";
  import DraftItem from "@nucleum/features/memory/capture/draftSelector/DraftItem.svelte";
  import { isSameResource } from "@nucleum/datafn/resource.utils";
  import EdgeButton from "@21n/elements/button/EdgeButton.svelte";

  let {
    drafts: initialDrafts = [],
    onClose,
    onSelect,
    onDelete
  }: {
    drafts?: ICapture[];
    onClose: () => void;
    onSelect: (draft: ICapture) => void;
    onDelete: (id: IRecordId) => void;
  } = $props();

  let drafts = $state(initialDrafts);

  async function deleteDraft(draft: ICapture) {
    if (!draft?.id) return;
    onDelete(draft.id);
    drafts = drafts.filter((item) => !isSameResource(item, draft.id));
  }
</script>

<div
  class="flex flex-col gap-2 w-full bg-bgs1 rounded-md dp:w-[32rem] dp:min-w-[32rem]"
>
  <div class="cw:px-2 py-4 px-4">
    <div class="px-2">
      <Text content="Drafts" style={TextStyle.SECTION_HEADING} />
    </div>
    <div class="flex flex-col gap-1 max-h-[20rem] overflow-y-auto">
      {#each drafts as draft (draft.id.toString())}
        <DraftItem
          {draft}
          onSelect={() => onSelect(draft)}
          onDelete={deleteDraft}
        />
      {/each}
    </div>
  </div>
  <div class="flex justify-center w-full mt-3">
    <EdgeButton
      icon="cross"
      tooltip="Close"
      label="Close"
      onclick={() => onClose()}
    />
  </div>
</div>
