<script lang="ts">
  import account from "@nucleum/stores/account.store";
  import { isValidString } from "@21n/shared-utils/text.utils";
  import { onMount } from "svelte";
  import { logger } from "@nucleum/components/debug/logger.client";
  import { cn } from "@21n/utils/ui.utils";
  import Icon from "@21n/elements/Icon.svelte";
  import FileView from "@nucleum/features/files/FileView.svelte";
  import type { IRecordId } from "@21n/types/data.type";
  import { userPreferences } from "@nucleum/components/settings/userPreferences.store";
  import { appStore } from "@nucleum/stores/app.store";
  import { Product } from "@nucleum/products/product.type";
  let {
    context = "cp-profile",
    fileId: providedFileId = undefined,
    isEditing = false,
    isLoading = false
  }: {
    context?:
      | "cmd-page"
      | "cp-profile"
      | "account-settings"
      | "topbar"
      | "mobile-topbar";
    fileId?: IRecordId | undefined;
    isEditing?: boolean;
    isLoading?: boolean;
  } = $props();
  let fileId = $state<IRecordId | undefined>(undefined);
  let initials = $state<string | undefined>(undefined);
  let profilePictureUrl = $state<string | undefined>(undefined);
  const Emojis: string[] = ["🚀", "😁", "✌️", "👓", "⭐️", "🔥", "⚽️", "🛵"];
  const renderFileBasedProfilePicture = $derived(
    $appStore.product === Product.MEMOTRON ||
      $appStore.product === Product.NUCLEUM
  );

  function pickRandomEmoji() {
    return Emojis[Math.floor(Math.random() * Emojis.length)];
  }

  $effect(() => {
    fileId = providedFileId;
  });

  onMount(() => {
    void refresh($account);
    const unsubscribeAccount = account.subscribe((x) => {
      void refresh(x);
    });
    const unsubscribeUserPreferences = userPreferences.subscribe((x) => {
      if (x.profilePicture) fileId = x.profilePicture ?? fileId;
    });
    return () => {
      if (unsubscribeAccount) unsubscribeAccount();
      if (unsubscribeUserPreferences) unsubscribeUserPreferences();
    };
  });

  async function refresh(x: any) {
    if (fileId && renderFileBasedProfilePicture) return;
    if (
      isValidString(x.userInfo?.profilePictureUrl) &&
      !import.meta.env.DEV &&
      x.userInfo?.profilePictureUrl.startsWith("https://")
    ) {
      try {
        let response = await fetch(x.userInfo?.profilePictureUrl!, {
          method: "GET"
        });
        logger.log({ context: "profilepic", response });
        if (response.status === 200) {
          profilePictureUrl = x.userInfo?.profilePictureUrl;
          return;
        }
      } catch (e) {
        logger.error({ context: "profilepic error", e });
      }
      // profilePictureUrl = x.userInfo?.profilePictureUrl;
      // return;
    }
    if (x.userInfo?.nickName) {
      initials =
        x.userInfo.nickName.charAt(0).toLocaleUpperCase() +
        x.userInfo.nickName.charAt(1).toLocaleUpperCase();
    } else {
      initials = pickRandomEmoji();
    }
  }
</script>

<button
  class={cn(" flex justify-center items-center bg-bgs3", {
    "rounded-full w-7 h-7 lp:w-6 lp:h-6": context === "topbar",
    "rounded-full w-16 h-16": context === "cp-profile",
    "rounded-md w-20 h-20": context === "cmd-page",
    "rounded-full w-10 h-10": context === "mobile-topbar",
    "rounded-md w-full border-4": context === "account-settings",
    "border-transparent": context === "account-settings" && !isEditing,
    "outline-2 outline-dashed outline-fgs3 border-bgs1":
      context === "account-settings" && isEditing
  })}
>
  {#if isLoading}
    <Icon icon="svg-spinners:90-ring-with-bg" />
  {:else if fileId && renderFileBasedProfilePicture}
    <FileView
      id={fileId}
      isLazyLoad={false}
      class={cn("object-cover w-full h-full", {
        "rounded-md": context === "cmd-page" || context === "account-settings",
        "rounded-full":
          context === "cp-profile" ||
          context === "topbar" ||
          context === "mobile-topbar"
      })}
    />
  {:else if initials}
    <div
      class={cn("text-fgs3 min-h-24 flex items-center justify-center", {
        "text-h3": context !== "topbar",
        "text-b2": context === "topbar"
      })}
    >
      {initials}
    </div>
  {:else if profilePictureUrl}
    <img
      class={cn("w-full h-full", {
        "rounded-md": context === "cmd-page",
        "rounded-full":
          context === "cp-profile" ||
          context === "account-settings" ||
          context === "mobile-topbar"
      })}
      src={$account.userInfo?.profilePictureUrl}
      alt="Profile"
    />
  {/if}
</button>
