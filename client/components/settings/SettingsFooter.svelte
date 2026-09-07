<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import account from "@nucleum/stores/account.store";
  import { UserDataMode } from "@21n/types/account.type";
  import { ButtonStyle } from "@21n/types/button.type";
  import ProductInfoFooter from "@nucleum/components/settings/about/ProductInfoFooter.svelte";
  let { parentBgIndex = 1 }: { parentBgIndex?: number } = $props();
  const isSignedIn = $derived(
    $account.dataMode === UserDataMode.CLOUD ||
      Boolean($account.token) ||
      Boolean($account.userInfo?.id)
  );
</script>

<div class="flex w-full justify-center">
  {#if isSignedIn}
    <span class="flex justify-center w-3/5">
      <Button
        icon="log-out"
        label="Sign out"
        style={ButtonStyle.OUTLINED}
        testId="settings-footer-sign-out"
        {parentBgIndex}
        onclick={async () => {
          await account.signOut();
        }}
      />
    </span>
  {/if}
</div>
<ProductInfoFooter />
