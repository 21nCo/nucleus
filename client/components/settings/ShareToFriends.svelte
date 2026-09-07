<script>
  import CopyableText from "@21n/elements/text/CopyableText.svelte";
  import { appStore } from "@nucleum/stores/app.store";
  import account from "@nucleum/stores/account.store";
</script>

<div class="w-full h-full flex justify-center">
  <div class="flex flex-col gap-4 bg-bgs2 rounded-md p-6 w-[27rem] h-40">
    <div>Copy the URL to share with your friends</div>
    <div>
      <CopyableText
        parentBackgroundIndex={2}
        text={($appStore.appData?.urls?.landing ?? window.location.origin) +
          "?referral=" +
          ($account.userId
            ? $account.userId
            : ($account.userInfo?.id ?? "appuser"))}
      />
    </div>
  </div>
</div>
