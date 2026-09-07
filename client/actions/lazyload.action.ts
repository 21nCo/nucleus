import { generateRandomId } from "@21n/shared-utils/crypto.utils";
import { isValidString } from "@21n/shared-utils/text.utils";
import { logger } from "@nucleum/client/runtime/logging/logger";
import { getImageColors } from "@21n/utils/ui.utils";

/**
 * Lazy loads an image when it is in the viewport.
 * @param image
 * @param src
 * @returns
 */
export function lazyLoad(image: HTMLImageElement, src: string) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        image.src = src;
        observer.unobserve(image);
      }
    });
  });

  observer.observe(image);

  return {
    destroy() {
      observer.unobserve(image);
    }
  };
}

export function fileLoader(
  node: HTMLElement,
  params: {
    source: string | (() => Promise<string>);
    isLazyLoad?: boolean;
  }
) {
  let observer: IntersectionObserver;
  let source = params.source;
  let isLazyLoad = params.isLazyLoad ?? true;
  let blobUrls: string[] = [];

  setupLazyLoad();

  return {
    update(newParams: {
      source: string | (() => Promise<string>);
      isLazyLoad?: boolean;
    }) {
      if (blobUrls.length) {
        for (const url of blobUrls) {
          try {
            URL.revokeObjectURL(url);
          } catch {}
        }
        blobUrls = [];
      }
      source = newParams.source;
      isLazyLoad = newParams.isLazyLoad ?? true;

      if (observer) {
        observer.unobserve(node);
      }

      setupLazyLoad();
    },
    destroy() {
      if (observer) {
        observer.unobserve(node);
      }
      if (blobUrls.length) {
        for (const url of blobUrls) {
          try {
            URL.revokeObjectURL(url);
          } catch {}
        }
        blobUrls = [];
      }
    }
  };

  async function setupLazyLoad() {
    if (!isLazyLoad) {
      await loadSource();
      return;
    }

    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadSource().then(() => {
            observer.unobserve(node);
          });
        }
      });
    });

    observer.observe(node);
  }

  async function loadSource() {
    try {
      if (node instanceof HTMLImageElement) {
        node.src = "https://placehold.co/60x40/darkgrey/darkgrey?text=...";
      }
      const sourceValue =
        typeof source === "function" ? await source() : source;

      if (node instanceof HTMLImageElement) {
        if (blobUrls.length) {
          for (const url of blobUrls) {
            if (url !== node.src) {
              try {
                URL.revokeObjectURL(url);
              } catch {}
            }
          }
          blobUrls = [];
        }
        node.src = sourceValue;
        if (typeof sourceValue === "string" && sourceValue.startsWith("blob:")) {
          blobUrls.push(sourceValue);
        }
      } else if (
        node instanceof HTMLAudioElement ||
        node instanceof HTMLVideoElement
      ) {
        while (node.firstChild) {
          node.removeChild(node.firstChild);
        }
        const sourceElement = document.createElement("source");
        sourceElement.src = sourceValue;
        node.appendChild(sourceElement);
        node.load();
        if (typeof sourceValue === "string" && sourceValue.startsWith("blob:")) {
          blobUrls.push(sourceValue);
        }
      }
    } catch (e) {
      logger.error({ at: "fileLoader.svelte - loadSource", error: e });
    }
  }
}

export function fileLoaderv2(
  node: HTMLElement,
  params: {
    source: string | (() => Promise<string>);
    isLazyLoad?: boolean;
    id?: string | number;
    isApplyBgColorFromImage?: boolean;
    isApplyBgColorToParent?: boolean;
  }
) {
  let observer: IntersectionObserver;
  let source = params.source;
  let isLazyLoad = params.isLazyLoad ?? true;
  let currentId = params.id;
  let dominantColor: string;
  let blobUrls: string[] = [];

  async function loadSource() {
    node.id = `${currentId?.toString() ?? ""}-${generateRandomId()}`;
    try {
      if (node instanceof HTMLImageElement) {
        node.style.opacity = "0";
        node.src =
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        node.classList.add("bg-bgs3");
      }
      const sourceValue =
        typeof source === "function" ? await source() : source;
      if (node instanceof HTMLImageElement && isValidString(sourceValue)) {
        try {
          if (blobUrls.length) {
            for (const url of blobUrls) {
              if (url !== node.src) {
                try {
                  URL.revokeObjectURL(url);
                } catch {}
              }
            }
            blobUrls = [];
          }
          if (params.isApplyBgColorFromImage) {
            node.src = sourceValue;
            const colors = await getImageColors(node);
            dominantColor = colors[0];
            const targetNode = params.isApplyBgColorToParent
              ? node.parentElement
              : node;
            if (targetNode) {
              targetNode.style.backgroundColor = dominantColor;
            }
          } else {
            node.src = sourceValue;
          }
          if (typeof sourceValue === "string" && sourceValue.startsWith("blob:")) {
            blobUrls.push(sourceValue);
          }
          node.classList.remove("bg-bgs3");
          node.style.opacity = "1";
          node.style.transition = "opacity 0.2s ease-in";
        } catch (imgError) {
          console.warn("Failed to load image:", imgError);
          node.classList.remove("bg-bgs3");
          node.style.opacity = "1";
        }
      } else if (
        node instanceof HTMLAudioElement ||
        node instanceof HTMLVideoElement
      ) {
        while (node.firstChild) {
          node.removeChild(node.firstChild);
        }
        const sourceElement = document.createElement("source");
        sourceElement.src = sourceValue;
        node.appendChild(sourceElement);
        node.load();
        if (typeof sourceValue === "string" && sourceValue.startsWith("blob:")) {
          blobUrls.push(sourceValue);
        }
      }
    } catch (e) {
      console.error("Error in fileLoader - loadSource:", e);
    }
  }

  function setupLazyLoad() {
    if (!isLazyLoad) {
      loadSource();
      return;
    }

    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadSource().then(() => {
            observer.unobserve(node);
          });
        }
      });
    });

    observer.observe(node);
  }

  setupLazyLoad();

  return {
    update(newParams: {
      source: string | (() => Promise<string>);
      isLazyLoad?: boolean;
      id?: string | number;
      isApplyBgColorFromImage?: boolean;
      isApplyBgColorToParent?: boolean;
    }) {
      if (blobUrls.length) {
        for (const url of blobUrls) {
          try {
            URL.revokeObjectURL(url);
          } catch {}
        }
        blobUrls = [];
      }
      source = newParams.source;
      isLazyLoad = newParams.isLazyLoad ?? true;

      if (dominantColor && node instanceof HTMLImageElement) {
        const targetNode = newParams.isApplyBgColorToParent
          ? node.parentElement
          : node;
        if (targetNode) {
          if (!newParams.isApplyBgColorFromImage) {
            targetNode.style.removeProperty("background-color");
          } else {
            targetNode.style.backgroundColor = dominantColor;
          }
        }
      }

      if (newParams.id !== currentId) {
        currentId = newParams.id;
        if (observer) {
          observer.unobserve(node);
        }
        setupLazyLoad();
      }
    },
    destroy() {
      if (observer) {
        observer.unobserve(node);
      }
      if (blobUrls.length) {
        for (const url of blobUrls) {
          try {
            URL.revokeObjectURL(url);
          } catch {}
        }
        blobUrls = [];
      }
    }
  };
}
