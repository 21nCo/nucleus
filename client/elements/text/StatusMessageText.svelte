<script lang="ts">
  import {
    StatusMessageType,
    type StatusMessage
  } from "@21n/elements/feedback/statusMessage.type";
  let {
    message,
  }: {
    message: StatusMessage;
  } = $props();

  $effect(() => {
    if (!message.message) return;
    const timer = setTimeout(() => {
      message.message = undefined;
      message.type = StatusMessageType.DEFAULT;
    }, 3000);
    return () => clearTimeout(timer);
  });
</script>

{#if message?.message}
  <div
    class="text-center {message?.type === StatusMessageType.ERROR
      ? 'text-ars1'
      : message?.type === StatusMessageType.SUCCESS
        ? 'text-ags1'
        : ''}"
  >
    {message?.message}
  </div>
{/if}
