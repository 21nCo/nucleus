<script lang="ts">
  import modalEvent from "@nucleum/application/modal/modal.store";
  import { Action } from "@nucleum/application/commandBar/action.enum";
  import ModalFooter from "@nucleum/application/modal/ModalFooter.svelte";
  import { toasts } from "@nucleum/stores/notification.store";
  import { Size } from "@21n/elements/size.enum";
  import type { Toast } from "@nucleum/stores/notifications/notification.type";
  import ToastNotification from "@21n/elements/feedback/ToastNotification.svelte";
    let {
    id,
  }: {
    id: string;
  } = $props();

  let notification: Toast | undefined;
  if (id) notification = $toasts.find((x: Toast) => x.id == id);
</script>

{#if notification}
  <ToastNotification {notification} isShownAsModal={true} />
{/if}
<ModalFooter
  action={Action.MOBILE_TOAST}
  size={Size.sm}
  primaryAction={{
    label: "Done",
    callback: async () => {
      notification?.callback?.();
      modalEvent.hide(Action.MOBILE_TOAST);
    }
  }}
/>
