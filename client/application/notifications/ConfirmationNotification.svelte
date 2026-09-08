<script lang="ts">
  import { renderMdAsHtml } from "@21n/elements/markdown/markdown.utils";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import { confirmationNotification } from "@nucleum/stores/notification.store";
  import ModalFooter from "@21n/elements/modal/ModalFooter.svelte";
  import { Action } from "@nucleum/client/config/action.enum";
  import { AlertType } from "@nucleum/stores/notifications/notification.type";
  import { Orientation } from "@21n/elements/direction.enum";
  import InlineErrorMessage from "@21n/elements/text/InlineErrorMessage.svelte";
  import ModalContentPadded from "@21n/elements/modal/ModalContentPadded.svelte";
  import { Size } from "@21n/elements/size.enum";
  let confirmationTextInput: string | undefined;
  let error: string | undefined;
  function resolvePrimaryAction() {
    const notification = $confirmationNotification;
    const confirmAction = notification?.confirmAction;
    const confirmCallback = confirmAction?.callback;
    const runConfirmCallback = async () => {
      const result = (await confirmCallback?.()) ?? true;
      if (result && !(typeof result === "object" && "error" in result)) {
        confirmationNotification.reset();
      }
      return result;
    };
    if (confirmAction) {
      if (notification?.askInputConfirmation) {
        return {
          ...confirmAction,
          callback: async () => {
            if (
              confirmationTextInput ===
              notification.askInputConfirmation
            ) {
              return runConfirmCallback();
            } else {
              error = "Please enter input to confirm";
              return Promise.resolve(false);
            }
          }
        };
      }
      return {
        ...confirmAction,
        callback: async () => {
          return runConfirmCallback();
        }
      };
    } else if (notification?.type === AlertType.ERROR) {
      return {
        label: "OK",
        callback: async () => {
          confirmationNotification.reset();
          return Promise.resolve(true);
        }
      };
    }
    return undefined;
  }
</script>

<div class="flex flex-col gap-4 w-full h-full">
  <ModalContentPadded
    isExtraSmall={true}
    class="flex flex-col justify-between h-full gap-2"
  >
    <div class="text-b1">
      {@html renderMdAsHtml($confirmationNotification?.message ?? "")}
    </div>
    {#if $confirmationNotification?.askInputConfirmation}
      <InlineErrorMessage bind:error />
      <TextInput
        bind:value={confirmationTextInput}
        placeholder={$confirmationNotification?.askInputConfirmation}
        label={{
          label: `Please type "${$confirmationNotification?.askInputConfirmation}" to confirm`,
          orientation: Orientation.Vertical
        }}
      />
    {/if}
  </ModalContentPadded>
  <ModalFooter
    size={Size.sm}
    action={Action.CONFIRMATION}
    primaryAction={resolvePrimaryAction()}
    secondaryAction={$confirmationNotification?.cancelAction ??
      ($confirmationNotification?.type !== AlertType.ERROR
        ? {
            label: "Cancel",
            callback: async () => {
              confirmationNotification.reset();
              return Promise.resolve(true);
            }
          }
        : undefined)}
  />
</div>
