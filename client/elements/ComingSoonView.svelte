<script lang="ts">
  import RocketLaunch from "@21n/illustrations/RocketLaunch.svelte";
  import { Size } from "@21n/elements/size.enum";
  import view from "@nucleum/stores/view.store";
  import Link from "@21n/elements/text/Link.svelte";
  import { Action } from "@nucleum/application/commandBar/action.enum";
  import ComingSoon from "@21n/illustrations/pixelsmarket/ComingSoon.svelte";
    let {
    mainText = undefined,
    subText = undefined,
    size = Size.md,
    isHideRoadmap = false,
    style = 1,
  }: {
    mainText?: string | undefined;
    subText?: string | undefined;
    size?: Size;
    isHideRoadmap?: boolean;
    style?: 1 | 2;
  } = $props();

  
  
  
  
  if (!mainText && !subText) {
    mainText = "Coming Soon";
    subText = "We are working on this feature. Stay tuned!";
  }
</script>

<div class="flex flex-col w-full h-full justify-center items-center gap-2">
  <div class="flex flex-col gap-1 items-center">
    {#if size === Size.sm || $view.isPortrait}
      <RocketLaunch width={120} />
    {:else if style === 1}
      <RocketLaunch width={200} />
    {:else if style === 2}
      <ComingSoon width={200} />
    {/if}
    <div class="text-center">{mainText ?? ""}</div>
  </div>
  <div class="text-fgs3 text-center text-b3">
    {subText ?? ""}
  </div>
  {#if !isHideRoadmap}
    <div class="text-b3 text-fgs2">
      <Link href={Action.ROADMAP} label="See roadmap" />
    </div>
  {/if}
</div>
