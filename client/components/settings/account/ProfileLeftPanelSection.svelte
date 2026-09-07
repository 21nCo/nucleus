<script lang="ts">
  import account from "@nucleum/stores/account.store";
  import { isValidString } from "@21n/shared-utils/text.utils";
  import { userPreferences } from "@nucleum/components/settings/userPreferences.store";
  import ProfilePicture from "@nucleum/components/settings/account/ProfilePicture.svelte";
</script>

<div class="flex flex-col items-center gap-1">
  <ProfilePicture />
  <div class="text-b2">
    {isValidString($userPreferences.name) ||
      isValidString($account.userInfo?.nickName) ||
      "App user"}
  </div>
</div>
