<svelte:options runes={true} />

<script lang="ts">
  import BoxButton from "@21n/elements/button/BoxButton.svelte";
  import { appStore } from "@nucleum/stores/app.store";
  import { Action } from "@21n/types/action.enum";
  let {
    isInThinMode = false,
    isRounded = false
  }: {
    isInThinMode?: boolean;
    isRounded?: boolean;
  } = $props();
  void isInThinMode;
  void isRounded;
</script>

<div class="w-full h-12">
  <BoxButton
    icon="question"
    tooltip="Help"
    parentBgIndex={2}
    onclick={async () => appStore.runAction(Action.HELP)}
  />
</div>
