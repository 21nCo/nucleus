<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import { isValidEmail } from "@21n/shared-utils/text.utils";
  import { stringify } from "@21n/shared-utils/json.utils";

  let { product }: { product: any } = $props();
  let emailEntered = "";
  let errorMessage: string | undefined = undefined;
  let successMessage: string | undefined = undefined;
  let previousEmailEntered = "";
  const subscriptionUrl =
    "https://3yin6uycm6.execute-api.us-east-1.amazonaws.com/prod/utils/communication";
  $effect(() => {
    if (emailEntered === previousEmailEntered) return;
    previousEmailEntered = emailEntered;
    errorMessage = undefined;
  });
  async function handleSubmit() {
    if (!isValidEmail(emailEntered)) {
      successMessage = undefined;
      errorMessage = "Please enter valid email address";
      return;
    }
    let response = await fetch(subscriptionUrl, {
      method: "POST",
      body: stringify({
        email: emailEntered,
        product
      })
    });
    let responseBody = await response.json();
    if (responseBody && responseBody.code == 1) {
      errorMessage = undefined;
      successMessage = responseBody.message;
      setTimeout(() => {
        emailEntered = "";
      }, 2000);
    } else {
      successMessage = undefined;
      errorMessage = responseBody.message;
    }
    clearMessages();
  }
  function clearMessages() {
    setTimeout(() => {
      successMessage = undefined;
      errorMessage = undefined;
    }, 3000);
  }
</script>

<div class="flex flex-col gap-2 items-center justify-center">
  <div class="flex items-center justify-center flex-wrap gap-4">
    <TextInput
      placeholder="enter your email"
      bind:value={emailEntered}
    />
    <Button label="Get early access" type="primary" onclick={handleSubmit} />
  </div>
  <div class="h-6">
    {#if errorMessage}
      <div class="text-ars1">{errorMessage}</div>
    {/if}
    {#if successMessage}
      <div class="text-ags1">{successMessage}</div>
    {/if}
  </div>
</div>
