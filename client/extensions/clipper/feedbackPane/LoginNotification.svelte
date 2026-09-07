<script lang="ts">
  import SubAtomLogo from "@21n/branding/SubAtomLogo.svelte";
  import Button from "@21n/elements/button/Button.svelte";
  import { ButtonVariant } from "@21n/types/button.type";
  import { extractProduct } from "@21n/shared-utils/utils";
  import FeedbackPaneBase from "@nucleum/extensions/clipper/feedbackPane/FeedbackPaneBase.svelte";
  let {
    code,
    isWithoutToolbarContext = false,
    onclick = undefined,
    onLater = undefined
  }: {
    code: number;
    isWithoutToolbarContext?: boolean;
    onclick?: ((event: MouseEvent) => void) | undefined;
    onLater?: (() => void) | undefined;
  } = $props();
  const product = extractProduct(window.location.hostname);
  const isSelfPage = product.product === "memotron";
  void isSelfPage;
</script>

<FeedbackPaneBase {isWithoutToolbarContext}>
  <div class="flex flex-col gap-3 h-60 justify-between">
    <div class="flex flex-col items-center">
      <SubAtomLogo subatom="memotron" />
      <div>Memotron</div>
    </div>
    <div class="flex w-full h-full justify-center items-center text-center">
      {#if code === 1}
        Login successful. Please close this page.
      {:else if code === -2}
        Logged out. Please login again to continue
      {:else if code === -3}
        Login not found. Please login to continue
      {:else}
        No Login found. Please login to save to Memotron
      {/if}
    </div>
    {#if code !== 1}
      <div class="flex gap-2 justify-center items-center">
        <Button
          icon="log-in"
          label="Login"
          type={ButtonVariant.PRIMARY}
          {onclick}
        />
        <Button
          icon="clock"
          label="I'll login later"
          onclick={() => {
            onLater?.();
          }}
        />
      </div>
    {/if}
  </div>
</FeedbackPaneBase>
