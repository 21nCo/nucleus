<script lang="ts">
  import { appStore } from "@nucleum/stores/app.store";
  import { debouncer } from "@21n/utils/utils";
  import { onMount } from "svelte";
  let {
    value = $bindable(""),
    selectedColor = { r: 255, g: 0, b: 0, a: 1 },
    onChange = undefined,
    onDebouncedChange = undefined
  }: {
    value?: string;
    selectedColor?: { r: number; g: number; b: number; a: number };
    onChange?:
      | ((payload: {
          rgb: { r: number; g: number; b: number; a: number };
          hex: string;
        }) => void)
      | undefined;
    onDebouncedChange?:
      | ((payload: {
          rgb: { r: number; g: number; b: number; a: number };
          hex: string;
        }) => void)
      | undefined;
  } = $props();
  let canvas = $state<HTMLCanvasElement>();
  let ctx = $state<CanvasRenderingContext2D | null>(null);
  let isDragging = $state(false);

  onMount(() => {
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawColorSpectrum();
  });

  function drawColorSpectrum() {
    const activeCanvas = canvas;
    if (!ctx || !activeCanvas) return;
    const gradient = ctx.createLinearGradient(0, 0, activeCanvas.width, 0);
    gradient.addColorStop(0, "rgb(255, 0, 0)");
    gradient.addColorStop(1 / 6, "rgb(255, 255, 0)");
    gradient.addColorStop(2 / 6, "rgb(0, 255, 0)");
    gradient.addColorStop(3 / 6, "rgb(0, 255, 255)");
    gradient.addColorStop(4 / 6, "rgb(0, 0, 255)");
    gradient.addColorStop(5 / 6, "rgb(255, 0, 255)");
    gradient.addColorStop(1, "rgb(255, 0, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, activeCanvas.width, activeCanvas.height);

    const whiteGradient = ctx.createLinearGradient(
      0,
      0,
      0,
      activeCanvas.height
    );
    whiteGradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    whiteGradient.addColorStop(0.5, "rgba(255, 255, 255, 0)");
    whiteGradient.addColorStop(1, "rgba(0, 0, 0, 0.5)");

    ctx.fillStyle = whiteGradient;
    ctx.fillRect(0, 0, activeCanvas.width, activeCanvas.height);
  }

  function handleMouseDown(event: MouseEvent) {
    isDragging = true;
    updateColor(event);
  }

  function handleMouseMove(event: MouseEvent) {
    if (isDragging) {
      updateColor(event);
    }
  }

  function handleMouseUp() {
    isDragging = false;
  }

  function updateColor(event: MouseEvent) {
    const activeCanvas = canvas;
    if (!ctx || !activeCanvas) return;
    const rect = activeCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const imageData = ctx.getImageData(x, y, 1, 1);
    const [r, g, b] = imageData.data;
    selectedColor = { r, g, b, a: 1 };
    value = `#${selectedColor.r.toString(16).padStart(2, "0")}${selectedColor.g.toString(16).padStart(2, "0")}${selectedColor.b.toString(16).padStart(2, "0")}`;
    onChange?.({
      rgb: selectedColor,
      hex: value
    });
    debouncedChangePropagation();
  }

  const debouncedChangePropagation = debouncer(() => {
    onDebouncedChange?.({
      rgb: selectedColor,
      hex: value
    });
  }, 1000);
</script>

<div class="flex flex-col items-center space-y-6 p-4">
  <div class="relative">
    <canvas
      bind:this={canvas}
      width="400"
      height="250"
      class="cursor-crosshair rounded-lg shadow-inner"
      onmousedown={handleMouseDown}
      onmousemove={handleMouseMove}
      onmouseup={handleMouseUp}
      onmouseleave={handleMouseUp}
    ></canvas>
    <div
      class="absolute inset-0 rounded-lg border border-brs3 shadow-sm pointer-events-none"
    ></div>
  </div>
  {#if $appStore.isDebugMode}
    <div class="text-center">
      <p class="font-semibold text-lg mb-2">Selected Color: {value}</p>
      <div class="flex items-center justify-center space-x-4">
        <div
          class="w-16 h-16 rounded-full shadow-md border-2 border-white"
          style="background-color: rgb({selectedColor.r}, {selectedColor.g}, {selectedColor.b});"
        ></div>
        <div class="text-left">
          <p>R: {selectedColor.r}</p>
          <p>G: {selectedColor.g}</p>
          <p>B: {selectedColor.b}</p>
        </div>
      </div>
    </div>
  {/if}
</div>
