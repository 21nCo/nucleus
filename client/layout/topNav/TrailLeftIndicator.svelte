<svelte:options runes={true} />

<script lang="ts">
  import { cn } from "@21n/utils/ui.utils";
  import { appStore } from "@nucleum/stores/app.store";
  import { Action } from "@21n/types/action.enum";
  import account from "@nucleum/stores/account.store";
  import { PlanType } from "@21n/shared-types/subscription.type";
  import { resolveTrialDaysLeft } from "@nucleum/application/subscription/userPlan.utils";
  import { AppSearchParam } from "@21n/types/appStore.type";
  import { Orientation } from "@21n/types/direction.enum";
  let {
    orientation = Orientation.Horizontal
  }: {
    orientation?: Orientation;
  } = $props();

  let trialDaysLeft = $derived(
    $account.plan?.plan === PlanType.TRIAL
      ? resolveTrialDaysLeft($account.plan)
      : undefined
  );
</script>

{#if trialDaysLeft !== undefined && trialDaysLeft !== null && trialDaysLeft < 15}
  {@const isTrialExpired = trialDaysLeft <= 0}
  <button
    class={cn(
      "flex gap-1 justify-center items-center border border-dashed rounded-md  mx-1.5 whitespace-nowrap",
      {
        "flex-col p-1.5": orientation === Orientation.Vertical,
        "px-1.5 py-0.5": orientation === Orientation.Horizontal,
        "bg-ars2 border-ars1": isTrialExpired,
        "hover:bg-ass2/10 border-ass1/50 text-ass1": !isTrialExpired
      }
    )}
    onclick={() =>
      appStore.runAction(Action.SETTINGS, {
        searchParams: {
          [AppSearchParam.SETTING]: Action.USER_BILLING
        }
      })}
  >
    {#if orientation === Orientation.Vertical}
      <span class="text-b2"> Trial </span>
    {/if}
    <span
      class={cn({
        "text-b4": orientation == Orientation.Vertical,
        "text-b3": orientation == Orientation.Horizontal
      })}
    >
      {#if !isTrialExpired}
        {trialDaysLeft}
        {trialDaysLeft === 1 ? "day" : "days"}
        {orientation === Orientation.Horizontal ? "trial" : ""} left
      {:else}
        Trial expired
      {/if}
    </span>
  </button>
{/if}
