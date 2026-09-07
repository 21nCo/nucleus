<script lang="ts">
  import { GlobalEvent, type Event as AppEvent } from "@nucleum/stores/notifications/event.enum";
  import type { InlineToast } from "@nucleum/stores/notifications/notification.type";
  import { onMount } from "svelte";
  let {
    event,
    inlineToastId = undefined,
    onInlineToast = undefined,
    onNav = undefined
  }: {
    event: AppEvent[];
    inlineToastId?: string | undefined;
    onInlineToast?:
      | ((event: CustomEvent<InlineToast>) => void)
      | undefined;
    onNav?: ((event: CustomEvent<any>) => void) | undefined;
  } = $props();

  function handleInlineToast(e: CustomEvent<InlineToast>) {
    const toast = e.detail;
    if (
      event.includes(GlobalEvent.INLINE_TOAST) &&
      (!inlineToastId || toast.id === inlineToastId)
    ) {
      onInlineToast?.(new CustomEvent("inlinetoast", { detail: toast }));
    }
  }

  function handleEvent(e: CustomEvent<{ event: AppEvent; value?: unknown }>) {
    if (event.some((x: AppEvent) => x === e.detail.event)) {
      if (e.detail.event === GlobalEvent.NAV) {
        onNav?.(new CustomEvent("nav", { detail: e.detail.value }));
      }
    }
  }

  onMount(() => {
    const inlineToastHandler: EventListener = (windowEvent) => {
      handleInlineToast(windowEvent as CustomEvent<InlineToast>);
    };
    const eventHandler: EventListener = (windowEvent) => {
      handleEvent(windowEvent as CustomEvent<{ event: AppEvent; value?: unknown }>);
    };
    window.addEventListener("inlinetoast", inlineToastHandler);
    window.addEventListener("event", eventHandler);
    return () => {
      window.removeEventListener("inlinetoast", inlineToastHandler);
      window.removeEventListener("event", eventHandler);
    };
  });
</script>
