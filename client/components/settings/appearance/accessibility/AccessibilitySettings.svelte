<script lang="ts">
  import SizeFactorSetting from "@nucleum/components/settings/appearance/accessibility/sizeFactor/SizeFactorSetting.svelte";
  let { parentBackgroundIndex = 1 }: { parentBackgroundIndex?: number } =
    $props();
</script>

<SizeFactorSetting {parentBackgroundIndex} />
