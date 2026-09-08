<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import { LinkType } from "@nucleum/datafn/link.type";
  import { cn } from "@21n/utils/ui.utils";
  import { Size } from "@21n/elements/size.enum";
  import { tooltip } from "@nucleum/actions/popover.action";
  import { resolveLinkTypeConfig } from "@nucleum/features/memory/linking/link.utils";

  let {
    linkType,
    direction = undefined,
    onclick = undefined
  }: {
    linkType: LinkType;
    direction?: "incoming" | "outgoing" | undefined;
    onclick?: ((event: MouseEvent) => void) | undefined;
  } = $props();

  let linkConfig = $derived(resolveLinkTypeConfig(linkType, direction));
</script>

<button
  class={cn(
    "flex items-center justify-center gap-1 h-6 w-6 rounded-md border border-brs3 text-b4 font-medium hover:bg-bgs2"
  )}
  use:tooltip={{
    text: linkConfig.label
  }}
  {onclick}
>
  <Icon icon={linkConfig.icon} size={Size.sm} />
</button>
