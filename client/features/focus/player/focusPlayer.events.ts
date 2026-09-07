/**
 * Event used by fullscreen focus controls to request immediate focus-player PiP.
 */
export const focusPlayerPipRequestEvent = "pointron:focus-player:pip-request";

/**
 * Dispatches a synchronous focus-player PiP request from controls outside the mini player.
 */
export function dispatchFocusPlayerPipRequest(sourceEvent: Event) {
  window.dispatchEvent(
    new CustomEvent<{ sourceEvent: Event }>(focusPlayerPipRequestEvent, {
      detail: { sourceEvent }
    })
  );
}
