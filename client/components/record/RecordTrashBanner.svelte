<script lang="ts">
  import InlineInfoBanner from "@21n/elements/text/InlineInfoBanner.svelte";
  import { InfoTextType } from "@21n/types/text.type";
  import { formatDatetime } from "@21n/utils/time.utils";
  import { userPreferences } from "@nucleum/components/settings/userPreferences.store";

  let {
    deletedAt,
    onRestore = undefined
  }: {
    deletedAt: string;
    onRestore?: ((event: CustomEvent<void>) => void) | undefined;
  } = $props();

  function emitRestore() {
    const restoreEvent = new CustomEvent<void>("restore");
    onRestore?.(restoreEvent);
  }
</script>

<InlineInfoBanner
  type={InfoTextType.ERROR}
  icon="trash"
  content={"This resource was moved to trash on: *" +
    formatDatetime($userPreferences, new Date(deletedAt)) +
    "*"}
  action={{
    label: "Restore",
    callback: async () => {
      emitRestore();
    }
  }}
/>
