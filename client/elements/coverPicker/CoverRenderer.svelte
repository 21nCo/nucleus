<script lang="ts">
  import { imageRepositioner } from "@nucleum/actions/imageRepositioning.action";
  import {
    FileType,
    type IImageRepositionerOptions
  } from "@nucleum/features/files/file.type";
  import FileView from "@nucleum/features/files/FileView.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import { gradientsList } from "@21n/elements/colorPicker/gradients/gradients";
  import { debouncer } from "@21n/utils/utils";
  let {
    cover,
    class: classList = "",
    repositionParams = undefined,
    isLazyLoad = false,
    onReposition = undefined,
    onRepositionDebounced = undefined
  }: {
    cover: string;
    class?: string;
    repositionParams?: IImageRepositionerOptions | undefined;
    isLazyLoad?: boolean;
    onReposition?: ((event: CustomEvent<number>) => void) | undefined;
    onRepositionDebounced?: ((event: CustomEvent<number>) => void) | undefined;
  } = $props();
  const noopReposition = (_event: CustomEvent<number>) => {};

  function handlePositionChange(newPosition: number) {
    onReposition?.(
      new CustomEvent("reposition", {
        detail: newPosition
      })
    );
    debouncedRepositionPropagation(newPosition);
  }
  const debouncedRepositionPropagation = debouncer((newPosition: number) => {
    onRepositionDebounced?.(
      new CustomEvent("repositionDebounced", {
        detail: newPosition
      })
    );
  }, 1000);
</script>

{#if typeof cover === "string" && cover.includes("hex_")}
  <div
    class={cn("w-full h-full", classList)}
    style="background-color: {cover.replace('hex_', '')};"
  ></div>
{:else if typeof cover === "string" && cover.includes("gradient_")}
  <div
    class={cn(
      "w-full h-full",
      classList,
      gradientsList.find(
        (gradient) => gradient.id == cover.replace("gradient_", "")
      )?.gradient
    )}
  ></div>
{:else if typeof cover === "string" && cover.includes("unsplash_")}
  <img
    src={cover.split("unsplash_")[1]}
    alt="Unsplash cover"
    draggable={false}
    class={cn("h-full w-full object-cover", classList)}
    use:imageRepositioner={{
      onPositionChange: handlePositionChange,
      ...(repositionParams ?? {
        enabled: false
      })
    }}
  />
{:else}
  <FileView
    id={cover}
    {repositionParams}
    {isLazyLoad}
    type={FileType.IMAGE}
    class={cn("h-full w-full object-cover", classList)}
    onReposition={onReposition ?? noopReposition}
    onRepositionDebounced={onRepositionDebounced ?? noopReposition}
  />
{/if}
