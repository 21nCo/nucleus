<script lang="ts">
  import { cn } from "@21n/utils/ui.utils";
  import Button from "@21n/elements/button/Button.svelte";
  import { Size } from "@21n/types/size.enum";
  import { ButtonStyle, ButtonVariant } from "@21n/types/button.type";
  import PlanFeatureList from "@nucleum/components/subscription/elements/PlanFeatureList.svelte";
  import type { IPlan } from "@nucleum/components/subscription/userPlan.type";
  import {
    BillingCycle,
    PlanType
  } from "@nucleum/components/subscription/userPlan.type";
  import account from "@nucleum/stores/account.store";
  import PlanIcon from "@nucleum/components/subscription/elements/PlanIcon.svelte";
  import Divider from "@21n/elements/Divider.svelte";
  import { PlanStatus, type IUserPlan } from "@21n/types/account.type";
  import { appStore } from "@nucleum/stores/app.store";
  import { properCase } from "@21n/shared-utils/text.utils";
  import view from "@nucleum/stores/view.store";
  let {
    plans,
    plan,
    period,
    currentPlan = undefined,
    isCurrentPage = false,
    isPreventDiscounting = false,
    onCancel = undefined,
    onChoose = undefined,
    onSwitch = undefined
  }: {
    plans: IPlan[];
    plan: IPlan;
    period: BillingCycle;
    currentPlan?: IUserPlan | undefined;
    isCurrentPage?: boolean;
    isPreventDiscounting?: boolean;
    onCancel?: ((event: CustomEvent<void>) => void) | undefined;
    onChoose?: ((event: CustomEvent<void>) => void) | undefined;
    onSwitch?: ((event: CustomEvent<void>) => void) | undefined;
  } = $props();
  const isCurrentPlan = $derived(currentPlan?.plan === plan.type);
  let progressState = $state<
    | "initiating"
    | "upgrading"
    | "downgrading"
    | "switching"
    | "cancelling"
    | null
  >(null);
  const actualPrice = $derived(
    period === BillingCycle.YEARLY
      ? plan.price[BillingCycle.YEARLY] / 12
      : plan.price[period]
  );
  const discountedPrice = $derived(
    !isPreventDiscounting && $account.plan?.discount
      ? resolveDiscountedPrice(actualPrice, $account.plan?.discount)
      : null
  );

  $effect(() => {
    if (period) {
      resetLoadingState(period);
    }
  });

  function resetLoadingState(period: BillingCycle) {
    progressState = null;
  }

  function resolveDiscountedPrice(price: number, discount: any) {
    if (discount.first && period !== BillingCycle.MONTHLY) {
      return (price * (1 - discount.first / 100)).toFixed(2);
    }
    return null;
  }

  function isUpgrade(plan: IPlan) {
    if (
      !currentPlan ||
      currentPlan.plan === PlanType.TRIAL ||
      currentPlan.status !== PlanStatus.ACTIVE
    )
      return false;
    const currentIndex = plans.findIndex((p) => p.type === currentPlan.plan);
    const newIndex = plans.findIndex((p) => p.type === plan.type);
    return newIndex > currentIndex;
  }

  function isDowngrade(plan: IPlan) {
    if (
      !currentPlan ||
      currentPlan.plan === PlanType.TRIAL ||
      currentPlan.status !== PlanStatus.ACTIVE
    )
      return false;
    const currentIndex = plans.findIndex((p) => p.type === currentPlan.plan);
    const newIndex = plans.findIndex((p) => p.type === plan.type);
    return newIndex < currentIndex;
  }

  function emitCancel() {
    const cancelEvent = new CustomEvent<void>("cancel");
    onCancel?.(cancelEvent);
  }

  function emitChoose() {
    const chooseEvent = new CustomEvent<void>("choose");
    onChoose?.(chooseEvent);
  }

  function emitSwitch() {
    const switchEvent = new CustomEvent<void>("switch");
    onSwitch?.(switchEvent);
  }
</script>

<div
  class={cn(
    "flex flex-col flex-1 max-h-[48rem] p-6 rounded-lg border relative default-typeface",
    {
      "border-2 border-aps1 hover:bg-aps3/30": plan.isPopular,
      "border-brs3 hover:bg-bgs2": !plan.isPopular,
      "md:col-span-2 max-w-3xl mx-auto w-full": isCurrentPage
    }
  )}
>
  {#if plan.isPopular}
    <div class="absolute top-0 right-0">
      <span
        class="px-3 py-1 text-sm rounded-bl-md rounded-tr-md bg-aps1 text-abg"
        >Recommended</span
      >
    </div>
  {/if}

  {#if isCurrentPlan}
    <div class="absolute -top-3 left-4">
      <span class="px-3 py-1 text-sm rounded-full bg-ags1 text-abg">
        Current Plan • {currentPlan?.cycle?.toLowerCase()}
      </span>
    </div>
  {/if}

  <div class="flex flex-col h-full">
    <div class="space-y-4">
      <div class="flex flex-col gap-4">
        <PlanIcon type={plan.type} product={$appStore.product} />
        <div>
          <h3 class="cw:text-h3 text-3xl font-semibold text-fgs1">
            {#if plan.type === PlanType.CLOUD_SYNC}
              {properCase($appStore.product)}
            {/if}
            {plan.name}
          </h3>
          <p class="mt-2 text-b2 text-fgs1">
            {plan.description}
            {#if plan.type === PlanType.CLOUD_SYNC}
              for {properCase($appStore.product)}
            {/if}
          </p>
        </div>
      </div>

      <div>
        <div class="flex items-baseline gap-2">
          {#if discountedPrice}
            <span class="cw:text-h1 text-h1 font-semibold text-ags1">
              {#if period === BillingCycle.YEARLY}
                ${discountedPrice * 12}
              {:else}
                ${discountedPrice}
              {/if}
            </span>
          {/if}
          <span
            class={cn("cw:text-h1 font-semibold", {
              "line-through text-fgs3 text-h3": discountedPrice,
              "text-fgs1 text-h1": !discountedPrice
            })}
          >
            {#if period === BillingCycle.YEARLY}
              ${actualPrice * 12}
            {:else}
              ${actualPrice}
            {/if}
          </span>
          <span class="text-sm text-fgs2">
            {period === BillingCycle.LIFETIME
              ? "one-time"
              : period === BillingCycle.YEARLY
                ? "/year"
                : "/month"}
          </span>
        </div>
      </div>
      <Divider />
      <PlanFeatureList features={plan.features} />
    </div>

    <div class="mt-auto pt-6 mx-6 flex cw:flex-row flex-col justify-center">
      {#if isCurrentPlan && currentPlan?.cycle === period && currentPlan?.status === PlanStatus.ACTIVE}
        <div class="space-y-2">
          <Button
            label="Cancel Subscription"
            icon="cross"
            type={ButtonVariant.DANGER}
            style={ButtonStyle.OUTLINED}
            isLoading={progressState === "cancelling"}
            size={$view.isConstrainedWidth ? Size.md : Size.lg}
            onclick={() => {
              progressState = "cancelling";
              emitCancel();
            }}
          />
          <p class="text-center text-sm text-fgs3">
            Access until end of billing period
          </p>
        </div>
      {:else if isCurrentPlan && currentPlan?.cycle !== period && currentPlan?.status === PlanStatus.ACTIVE}
        <Button
          label={`Switch to ${period.toLowerCase()}`}
          icon="proceed"
          isLoading={progressState === "switching"}
          type={ButtonVariant.PRIMARY}
          style={ButtonStyle.OUTLINED}
          size={$view.isConstrainedWidth ? Size.md : Size.lg}
          onclick={() => {
            progressState = "switching";
            emitSwitch();
          }}
        />
      {:else if isUpgrade(plan)}
        <Button
          label="Upgrade"
          icon="arrow-up"
          isLoading={progressState === "upgrading"}
          type={ButtonVariant.PRIMARY}
          size={$view.isConstrainedWidth ? Size.md : Size.lg}
          onclick={() => {
            progressState = "upgrading";
            emitSwitch();
          }}
        />
      {:else if isDowngrade(plan)}
        <Button
          label={`Switch to ${plan.name}`}
          icon="proceed"
          isLoading={progressState === "downgrading"}
          type={ButtonVariant.PRIMARY}
          style={ButtonStyle.OUTLINED}
          size={$view.isConstrainedWidth ? Size.md : Size.lg}
          onclick={() => {
            progressState = "downgrading";
            emitSwitch();
          }}
        />
      {:else}
        <Button
          label="Choose Plan"
          icon="proceed"
          type={ButtonVariant.PRIMARY}
          isLoading={progressState === "initiating"}
          style={plan.isPopular ? ButtonStyle.DEFAULT : ButtonStyle.OUTLINED}
          size={$view.isConstrainedWidth ? Size.md : Size.lg}
          onclick={() => {
            progressState = "initiating";
            emitChoose();
          }}
        />
      {/if}
    </div>
    <div class="mt-2 mx-auto text-b3 text-fgs2">
      {#if period === BillingCycle.YEARLY}
        That's <b>
          {#if discountedPrice}
            ${discountedPrice}
          {:else}
            ${actualPrice.toFixed(2)}
          {/if}
        </b>
        per month billed yearly
      {:else if period === BillingCycle.LIFETIME}
        Get lifetime for the price of just 3 years!
      {/if}
    </div>
  </div>
</div>
