<script>
  // import PropertiesEditor from "$lib/client/products/memotron/curation/collection/properties/PropertiesEditor.svelte";
  import RiveAnimatedIcon from "@21n/icons/RiveAnimatedIcon.svelte";
  import CaretPlay from "@nucleum/client/routes/play/CaretPlay.svelte";
  import Button from "@21n/elements/button/Button.svelte";
  import { ButtonVariant } from "@21n/elements/button/button.type";
</script>

<div class="flex w-full h-full justify-center items-start p-8">
  <!-- <CaretPlay /> -->
  <!-- <PropertiesEditor /> -->
  <Button isLoading={true} label="something" type={ButtonVariant.SECONDARY} />
  <!-- <RiveAnimatedIcon /> -->
</div>
