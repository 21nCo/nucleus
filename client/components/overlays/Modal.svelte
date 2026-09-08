<script lang="ts">
  import type { Snippet } from "svelte";
  import modalEvent from "@nucleum/stores/overlays/modal.store";
  import { confirmationNotification } from "@nucleum/stores/notification.store";
  import { fade } from "svelte/transition";
  import ModalHeader from "@21n/elements/modal/ModalHeader.svelte";
  import { generateUID } from "@21n/utils/utils";
  import { Size } from "@21n/elements/size.enum";
  import { Orientation, Placement } from "@21n/elements/direction.enum";
  import { cn } from "@21n/utils/ui.utils";
  import appearance from "@nucleum/stores/appearance.store";
  import ColorLayer from "@21n/layout/layers/themeLayer/ColorLayer.svelte";
  import { requireResourceActionHost } from "@nucleum/stores/resources/resource-action-host";
  import { logger } from "@nucleum/client/runtime/logging/logger";
  import { resolveModalOnFront } from "@21n/utils/browser.utils";
  import { AccessMode } from "@nucleum/datafn/resource.type";
  import view from "@nucleum/stores/view.store";
  import { userPreferences } from "@nucleum/stores/preferences/user-preferences.store";
  import context from "@nucleum/stores/context.store";
  import { OperatingSystem } from "@nucleum/client/runtime/context.type";
  let {
    index = 0,
    show = $bindable(true),
    title = "",
    isShowOverlay = true,
    isOnRight = false,
    alignment = Placement.Center,
    isDismissable = true,
    isUseDialog = false,
    size = Size.md,
    orientation = Orientation.Vertical,
    hasCantileverButtons = false,
    isDynamicSize = false,
    id = generateUID(),
    children = undefined
  }: {
    index?: number;
    show?: boolean;
    title?: string;
    isShowOverlay?: boolean;
    isOnRight?: boolean;
    alignment?: Placement;
    isDismissable?: boolean;
    isUseDialog?: boolean;
    size?: Size;
    orientation?: Orientation;
    hasCantileverButtons?: boolean;
    isDynamicSize?: boolean;
    id?: string;
    children?: Snippet | undefined;
  } = $props();
  void isOnRight;
  let dialog = $state<HTMLDialogElement | undefined>();
  let focusTrap = $state<HTMLDivElement | undefined>();
  $effect(() => {
    if (show && dialog && !dialog.open) {
      dialog.showModal();
    }
  });

  /**
   * This is triggered when the overlay is clicked.
   *
   * @param event
   */
  const overlayClicked = (event: any) => {
    if (
      (event.target.nodeName === "DIALOG" ||
        event.target?.classList?.contains("pop-overlay") ||
        event.target?.classList?.contains("popover") ||
        event.target?.id === id) &&
      isDismissable
    ) {
      close();
    }
  };

  function close() {
    const frontModal = resolveModalOnFront();
    logger.log({ at: "Modal.svelte close", id, frontModal });
    confirmationNotification.reset();
    if (frontModal?.id?.includes("-resource")) {
      requireResourceActionHost().close({ accessMode: AccessMode.POP });
    }
    if (!frontModal || id != frontModal?.id) return;
    show = false;
    modalEvent.hide(id, "Modal.svelte");
  }

  /**
   * This is to prevent the dialog from closing when the user presses `Escape` key from any input element inside the dialog.
   * @param e
   */
  function handleClose(e: any) {
    void e;
    dialog?.showModal();
  }

  function resolveSizeClasses() {
    if (isDynamicSize) {
      return {};
    }
    return {
      "w-full h-full min-h-screen min-w-screen": size === Size.full,
      "w-[20rem] tp:w-[25rem] h-[25rem] min-h-[20rem]": size === Size.xs,
      "w-[55rem] 2k:w-[65rem] h-full dp:h-full tp:h-[60rem] vm:h-[60rem] 2k:h-full":
        orientation === Orientation.Vertical && size === Size.xxl,
      "w-[45rem] 2k:w-[55rem] h-full tp:h-[60rem] dp:h-full vm:h-[60rem]  2k:h-full":
        orientation === Orientation.Vertical && size === Size.xl,
      "w-[40rem] 2k:w-[45rem] h-9/10 vm:h-[55rem] tp:h-[55rem] 2k:h-[60rem]":
        orientation === Orientation.Vertical && size === Size.lg,
      "w-[30rem] 2k:w-[35rem] h-[40rem] 2k:h-[50rem]":
        orientation === Orientation.Vertical && size === Size.md,
      "w-[30rem] 2k:w-[35rem] h-[30rem] 2k:h-[40rem]":
        orientation === Orientation.Vertical && size === Size.sm,
      "w-[80rem] 2k:w-[110rem] h-[56rem] 2k:h-full vm:h-[80rem]":
        orientation === Orientation.Horizontal && size === Size.xxl,
      "w-[70rem] 2k:w-[100rem] h-[56rem] 2k:h-[70rem] vm:h-[70rem]":
        orientation === Orientation.Horizontal && size === Size.xl,
      "w-[60rem] 2k:w-[80rem] h-[50rem] 2k:h-[60rem]":
        orientation === Orientation.Horizontal && size === Size.lg,
      "w-[50rem] 2k:w-[60rem] h-[40rem] 2k:h-[50rem]":
        orientation === Orientation.Horizontal && size === Size.md,
      "max-w-9/10": hasCantileverButtons && !$view.isConstrainedWidth
    };
  }
</script>

{#if show}
  {#if alignment === Placement.Right}
    <div
      class="popover-container fixed right-8 bg-bgs2 z-50 rounded-md overflow-y-auto"
      style="height:min-content;bottom: 5%;"
    >
      {#if title}
        <ModalHeader
          {title}
          onClose={() => {
            show = false;
          }}
        />
      {/if}
      <div class="popover-body w-full overflow-y-auto">
        <ColorLayer>
          {@render children?.()}
        </ColorLayer>
      </div>
    </div>
  {:else}
    {@const isBlurredBg = $userPreferences.appearance?.isBlurredBgForPopups}
    <div
      class={cn(
        "pop-overlay fixed w-screen h-screen z-50",
        {
          "inset-0 m-auto flex justify-center items-center":
            alignment === Placement.Center ||
            !alignment ||
            $view.isConstrainedWidth,
          "bg-opacity-0": !isShowOverlay,
          "mo:p-0 p-3": !isUseDialog && size !== Size.full
        },
        !$view.isConstrainedWidth && {
          "inset-x-0":
            alignment === Placement.TopCenter ||
            alignment === Placement.BottomCenter
        },
        isShowOverlay &&
          !isUseDialog && {
            "bg-black bg-opacity-70": !isBlurredBg,
            "backdrop-blur-xl backdrop-opacity--80 backdrop-brightness--50 backdrop-grayscale bg-fgs4 bg-opacity-50 backdrop-saturate--50":
              isBlurredBg
          }
      )}
      {id}
      data-blank-modal={index}
      data-modal-size={size}
      transition:fade={{ duration: 100 }}
      onclick={overlayClicked}
      role="button"
      onkeydown={() => {}}
      tabindex="0"
    >
      {#if isUseDialog}
        <dialog
          bind:this={dialog}
          id={id + "-modal"}
          data-testid={`modal-${id}`}
          onclose={(event) => {
            event.preventDefault();
            handleClose(event);
          }}
          class={cn(
            "rounded-md flex flex-col p-0 text-fgs1 shadow--bgs4 shadow-xl cw:w-full ch:h-full max-h-full",
            {
              "bg-bgs1 overlay": isShowOverlay,
              "overlay-light": isShowOverlay && !$appearance.colorScheme.isDark,
              "overlay-dark": isShowOverlay && $appearance.colorScheme.isDark,
              "bg-none shadow-lg": !isShowOverlay,
              ...resolveSizeClasses()
            }
          )}
        >
          <div bind:this={focusTrap} tabindex="-1" style="outline: none;"></div>
          <ColorLayer>
            {@render children?.()}
          </ColorLayer>
        </dialog>
      {:else}
        <div
          id={id + "-modal"}
          data-testid={`modal-${id}`}
          class={cn(
            "bg-bgs1 max-h-full cursor-default otopl:pt-12",
            {
              ...resolveSizeClasses(),
              "rounded-md otopl:bg-transparent": size !== Size.full,
              "otopl:bg-bgs1": size === Size.full,
              "mo:rounded-none": size !== Size.full && size !== Size.xs,
              "mo:w-9/10": size === Size.xs,
              "mo:w-full mo:h-full": size !== Size.xs,
              "portrait:w-full": size !== Size.xs && size !== Size.sm
            },
            !$view.isConstrainedWidth && {
              "shadow-xl cw:border-none dark:border-none border border-brs3":
                !isShowOverlay,
              "w-fit h-fit": isDynamicSize,
              "m-auto": alignment === Placement.Center || !alignment,
              "mx-auto":
                alignment === Placement.TopCenter ||
                alignment === Placement.BottomCenter,
              "mt-[12vh] mb-auto": alignment === Placement.TopCenter,
              "mt-auto": alignment === Placement.BottomCenter
            }
          )}
        >
          <ColorLayer>
            {@render children?.()}
          </ColorLayer>
        </div>
      {/if}
    </div>
  {/if}
{/if}

<style>
  .popover-container {
    transform: translate3d(0, 0, 0);
  }

  dialog.overlay::backdrop {
    backdrop-filter: blur(10px) grayscale(100%);
  }

  dialog.overlay-light::backdrop {
    background-color: rgba(0, 0, 0, 0.2);
  }
  dialog.overlay-dark::backdrop {
    background-color: rgba(251, 251, 251, 0.4);
  }
  dialog.bg-none::backdrop {
    background-color: transparent;
  }
</style>
