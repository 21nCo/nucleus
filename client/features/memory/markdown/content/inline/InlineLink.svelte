<script lang="ts">
  import { appStore } from "@nucleum/stores/app.store";

  let {
    href,
    label
  }: {
    href: string;
    label: string;
  } = $props();
</script>

<a
  class="inline-link text-aps1 underline hover:bg-aps3 px-0.5 rounded-md cursor-pointer"
  data-label={label}
  {href}
  onclick={() => appStore.openLink(href)}
>
  {label ?? href}
</a>
