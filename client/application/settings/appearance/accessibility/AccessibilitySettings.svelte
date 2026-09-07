<script lang="ts">
  import SizeFactorSetting from "@nucleum/application/settings/appearance/accessibility/sizeFactor/SizeFactorSetting.svelte";
  let { parentBackgroundIndex = 1 }: { parentBackgroundIndex?: number } =
    $props();
</script>

<SizeFactorSetting {parentBackgroundIndex} />
