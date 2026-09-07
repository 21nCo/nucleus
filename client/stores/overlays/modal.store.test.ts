import { beforeEach, describe, expect, it, vi } from "vitest";
import { get } from "svelte/store";
import { AccessMode } from "@nucleum/datafn/resource.type";
import modalEvent, {
  configureOverlayHost,
  fullScreen,
  player
} from "./modal.store";

const host = {
  onDismiss: vi.fn(),
  openFullscreen: vi.fn(),
  closeFullscreen: vi.fn(),
  resolvePlayer: vi.fn(() => "mini-player")
};

beforeEach(() => {
  vi.clearAllMocks();
  configureOverlayHost(host);
  modalEvent.reset();
  fullScreen.set({ path: undefined });
  player.reset();
  history.replaceState({}, "", "/");
});

describe("overlay shell contract", () => {
  it("publishes dismissal after hiding the requested modal", () => {
    modalEvent.notify({ path: "finished", isShow: true });
    host.onDismiss.mockImplementationOnce(() => {
      expect(get(modalEvent)).toEqual({ path: "finished", isShow: false });
    });
    modalEvent.hide("finished");
    expect(host.onDismiss).toHaveBeenCalledWith("finished");
  });

  it("opens fullscreen and returns to its associated mini player", () => {
    fullScreen.show("focus");
    expect(fullScreen.get().path).toBe("focus");
    expect(host.openFullscreen).toHaveBeenCalledWith("focus");
    fullScreen.hide();
    expect(host.resolvePlayer).toHaveBeenCalledWith("focus");
    expect(player.get()).toEqual({
      action: "mini-player",
      isMiniOn: true,
      isPipOn: false
    });
    expect(fullScreen.get().path).toBeUndefined();
    expect(host.closeFullscreen).toHaveBeenCalledOnce();
  });

  it("preserves an active picture-in-picture player when leaving fullscreen", () => {
    fullScreen.show("focus");
    player.togglePip("existing-player");
    fullScreen.hide();
    expect(player.get()).toEqual({
      action: "existing-player",
      isMiniOn: true,
      isPipOn: true
    });
    expect(host.closeFullscreen).toHaveBeenCalledOnce();
  });

  it("does not open a mini player during a session reset", () => {
    fullScreen.show("focus");
    fullScreen.hide(false);
    expect(host.resolvePlayer).not.toHaveBeenCalled();
    expect(player.get().isMiniOn).toBe(false);
    expect(host.closeFullscreen).toHaveBeenCalledOnce();
    fullScreen.hide(false);
    expect(host.closeFullscreen).toHaveBeenCalledOnce();
  });

  it("restores the fullscreen path from the existing URL key", () => {
    expect(fullScreen.restore()).toBeUndefined();
    history.replaceState({}, "", `/?${AccessMode.FULL}=focus`);
    expect(fullScreen.restore()).toBe(true);
    expect(fullScreen.get().path).toBe("focus");
    expect(host.openFullscreen).toHaveBeenCalledWith("focus");
  });
});
