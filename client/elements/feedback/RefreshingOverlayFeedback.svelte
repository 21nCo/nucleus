<script lang="ts">
  import { fly } from "svelte/transition";
  import InlineLoadingAnimation from "@21n/elements/feedback/animations/InlineLoadingAnimation.svelte";
  import { Size } from "@21n/elements/size.enum";
  import Icon from "@21n/elements/Icon.svelte";
    let {
    loadingText = "Refreshing",
  }: {
    loadingText?: string;
  } = $props();

</script>

<div
  class="absolute top-1 inset-x-0 flex justify-center mx-auto h-7 min-h-[1.75rem] z-50"
  in:fly={{ y: -20, duration: 200 }}
  out:fly={{ y: -20, duration: 200 }}
>
  <span
    class="flex justify-center items-center shadow-md h-full min-h-full gap-2 px-3 bg-aps1 text-b3 rounded-full text-abg"
  >
    <!-- <InlineLoadingAnimation /> -->
    <Icon icon="svg-spinners:90-ring-with-bg" class="text-abg" size={Size.sm} />
    {loadingText}
  </span>
</div>
