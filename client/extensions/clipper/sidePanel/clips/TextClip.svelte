<script lang="ts">
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import WebClipPreview from "@nucleum/features/memory/node/content/web/WebClipPreview.svelte";
  import type { ITextClip } from "@nucleum/features/memory/node/node.type";
  let {
    clip,
    id = "",
    onclick = undefined,
    onkeydown = undefined
  }: {
    clip: ITextClip;
    id?: string;
    onclick?: ((event: MouseEvent) => void) | undefined;
    onkeydown?: ((event: KeyboardEvent) => void) | undefined;
  } = $props();
</script>

<div
  {id}
  class="rounded-md text-b2"
  role="button"
  tabindex="0"
  {onclick}
  {onkeydown}
  style="cursor: pointer;"
>
  <WebClipPreview
    node={clip}
    truncateLength={200}
    accessPoint={ResourceAccessPoint.CLIPPER}
  />
</div>
