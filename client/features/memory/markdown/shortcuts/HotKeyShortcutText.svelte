<script lang="ts">
  import ShortcutText from "@21n/elements/text/ShortcutText.svelte";

  let { row }: { row: any } = $props();
</script>

<ShortcutText shortcut={row.shortcut} isPlainText={true} />
