<svelte:options runes={true} />

<script lang="ts">
  import type { Snippet } from "svelte";
  import SubAtomLogo from "@21n/branding/SubAtomLogo.svelte";
  import { properCase } from "@21n/shared-utils/text.utils";
  import { appStore } from "@nucleum/stores/app.store";
  import { AppSearchParam } from "@nucleum/stores/appStore.type";
  import { page } from "$app/stores";

  let { children }: { children?: Snippet } = $props();
  const productName = $derived(properCase($appStore.product));
  const message = $derived.by(() => {
    const authError = $page.url.searchParams.get("auth_error");
    if (authError === "oauth_callback_failed") {
      const provider = $page.url.searchParams.get("auth_provider");
      return `${provider ? properCase(provider) : "OAuth"} sign-in failed. Please try again.`;
    }
    const messageParam = $page.url.searchParams.get(AppSearchParam.MSG);
    if (messageParam === "deleted") {
      return "Your account has been deleted.";
    } else if (messageParam === "signedout") {
      return "You have been signed out.";
    } else if (messageParam === "expired") {
      return "Your session has expired. Please login again.";
    } else if (messageParam === "unavailable") {
      return "Account service is unavailable. Please try again once it is running.";
    } else if (messageParam === "notfound") {
      return "User not found. Please login again.";
    }
    return undefined;
  });
</script>

<div class="flex flex-col w-full h-full justify-center cw:pt-8">
  <div
    class="w-full h-full grid landscape:grid-cols-2 portrait:grid-rows-[auto_1fr] justify-center items-center gap-12 portrait:gap-6"
  >
    <!-- <div class="flex flex-col items-center">
          <SubAtomLogo subatom="pointron" isDark={true} />
          <div class="font-medium text-h3 text-fgs2">
            {$appStore.appData.name}
          </div>
        </div> -->

    <div
      class="flex flex-col justify-center gap-6 h-full portrait:bg-bgs1 bg-bgs2"
    >
      <div
        class="w-full flex flex-col justify-center items-center cw:h-fit h-40"
      >
        <SubAtomLogo subatom={$appStore.product} />
        <div class="font-medium">
          {productName}
        </div>
      </div>
      {#if message}
        <div class="font-medium px-4 text-center text-ass1 text-b2 -mb-4">
          {message}
        </div>
      {/if}
    </div>
    {@render children?.()}
  </div>
</div>
