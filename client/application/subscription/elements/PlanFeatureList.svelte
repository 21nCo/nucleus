<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import { renderMdAsHtml } from "@nucleum/features/memory/markdown/markdown.utils";
  let {
    features = [],
    moreLink = undefined
  }: {
    features?: {
      icon: string;
      label: string;
    }[];
    moreLink?: string | undefined;
  } = $props();
</script>

<ul class="space-y-3.5">
  {#each features as feature}
    <li class="flex items--start gap-3 text-b2 text-fgs2">
      <Icon icon={feature.icon} class="shrink-0" />
      <span>
        {@html renderMdAsHtml(feature.label)}
      </span>
    </li>
  {/each}
  {#if moreLink}
    <li class="flex items-center gap-2 text-sm text-fgs2 py-3">
      <Icon icon="proceed" class="text-aps1 shrink-0" />
      <a href={moreLink} class="text-aps1">Learn more</a>
    </li>
  {/if}
</ul>
