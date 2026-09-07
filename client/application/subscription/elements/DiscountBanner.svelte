<script lang="ts">
  import account from "@nucleum/stores/account.store";
  import { resolveDiscountLabel } from "@nucleum/application/subscription/userPlan.utils";
  let {
    isPreventDiscounting = false
  }: {
    isPreventDiscounting?: boolean;
  } = $props();
</script>

{#if $account.plan?.discount && !isPreventDiscounting}
  <div class="text-left rounded-md px-2 text-b2 text-ags1">
    🎉 {resolveDiscountLabel($account.plan)}
  </div>
{/if}
