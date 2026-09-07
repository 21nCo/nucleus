<script lang="ts">
  import OAuthRedirect from "@nucleum/components/oauth/OAuthRedirect.svelte";
  import { appStore } from "@nucleum/stores/app.store";
  appStore.toggleMenuVisibility(true);
</script>

<OAuthRedirect />
