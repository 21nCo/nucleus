<script lang="ts">
  import { onMount } from "svelte";
  import { type IAction } from "@nucleum/application/commandBar/action.type";
  import ModalLayout from "@nucleum/application/modal/ModalLayout.svelte";
  import context from "@nucleum/stores/context.store";
  import { postMessageToParent } from "@nucleum/client/runtime/embed/embed.utils";
  import { EmbedMessage } from "@nucleum/client/runtime/embed/embedMessage.enum";
  import { appStore } from "@nucleum/stores/app.store";
  import PageError from "@nucleum/application/error/PageError.svelte";
  import { resizeListener } from "@nucleum/actions/resize.action";
  import { setContext } from "svelte";
  import { writable, type Writable } from "svelte/store";
  import { Context } from "@nucleum/stores/appStore.type";
  import type { IContainer } from "../layout.type";
  const containerStore = writable<IContainer | undefined>(undefined);
  setContext<Writable<IContainer | undefined>>(
    Context.CONTAINER,
    containerStore
  );
  let {
    action = null,
    path = "",
    params = {},
    isPreventErrorFeedback = false
  }: {
    action?: IAction | null;
    path?: string;
    params?: any;
    isPreventErrorFeedback?: boolean;
  } = $props();

  let containerElement: HTMLDivElement | undefined;
  const resolvedAction = $derived.by(() => {
    if (action) return action;
    if (!path) return null;
    let nextAction = appStore.resolveComponentFromPath(path);
    if (!nextAction && path.includes("/")) {
      const pathWithPrefixStripped = path.split("/")[1];
      nextAction = appStore.resolveComponentFromPath(pathWithPrefixStripped);
    }
    return nextAction;
  });
  const resolvedParams = $derived.by(() => ({
    ...(resolvedAction?.componentParams ?? {}),
    ...(params ?? {})
  }));

  function measureContainer(element: HTMLDivElement) {
    const rect = element.getBoundingClientRect();
    containerStore.set({
      width: rect.width,
      height: rect.height,
      landscapiness: rect.width / rect.height,
      isPortrait: rect.width / rect.height < 1
    });
  }

  onMount(() => {
    if ($context.isSheet) postMessageToParent(EmbedMessage.SHEET_MOUNTED);
    if (containerElement) {
      measureContainer(containerElement);
    }
  });
</script>

{#if $context.isSheet && resolvedAction?.component}
  {@const ResolvedComponent = resolvedAction.component}
  <ModalLayout path={resolvedAction.action} params={resolvedAction.modalParams ?? {}}>
    <ResolvedComponent {...resolvedParams} />
  </ModalLayout>
{:else if resolvedAction?.component}
  {@const ResolvedComponent = resolvedAction.component}
  <div
    bind:this={containerElement}
    class="flex justify-center w-full h-full"
    use:resizeListener={(e) => {
      containerStore.set(e);
    }}
  >
    <ResolvedComponent {...resolvedParams} />
  </div>
{:else if !isPreventErrorFeedback}
  <PageError isNotFoundPage={true} />
{/if}
