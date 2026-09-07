<script lang="ts">
  import { appStore } from "@nucleum/stores/app.store";
</script>

{#if $appStore?.appData?.urls?.changelogEmbed}
  <iframe
    src={$appStore.appData.urls.changelogEmbed}
    width="100%"
    height="100%"
    frameBorder="0"
  ></iframe>
{/if}
