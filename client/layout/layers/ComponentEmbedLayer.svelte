<script lang="ts">
  import NotificationListener from "@21n/elements/listeners/NotificationListener.svelte";
  import { EmbedDataMessage } from "@nucleum/client/runtime/embed/embedMessage.enum";
  import { GlobalEvent } from "@nucleum/stores/notifications/event.enum";
  import { postDataToParent } from "@nucleum/client/runtime/embed/embed.utils";
  import { onMount } from "svelte";
  let {
    bg = undefined,
    isBackNavigable = false
  }: {
    bg?: number | undefined;
    isBackNavigable?: boolean;
  } = $props();
  void bg;

  onMount(() => {
    postDataToParent(
      EmbedDataMessage.ENABLE_GESTURE_NAVIGATION,
      isBackNavigable
    );

    return () => {
      postDataToParent(EmbedDataMessage.ENABLE_GESTURE_NAVIGATION, false);
    };
  });

  function onNav() {
    setTimeout(
      () =>
        postDataToParent(
          EmbedDataMessage.ENABLE_GESTURE_NAVIGATION,
          isBackNavigable
        ),
      200
    );
  }
</script>

<NotificationListener event={[GlobalEvent.NAV]} {onNav} />
