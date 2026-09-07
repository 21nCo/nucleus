<script lang="ts">
  import appearance from "@nucleum/stores/appearance.store";
  import { retrieveCurrentColors } from "@21n/utils/theme.utils";
  import { onMount, onDestroy } from "svelte";
  let canvasElement: HTMLCanvasElement;
  let canvasContext: CanvasRenderingContext2D;
  let { audioContext }: { audioContext: AudioContext } = $props();
  let analyser: AnalyserNode;
  let dataArray: Uint8Array;
  let bufferLength: number;
  let dataArrayCopy: Uint8Array;
  let animationFrameId: number;
  let variant:
    | "BOTTOM_LEFT"
    | "BOTTOM_CENTER"
    | "CENTER_LEFT"
    | "CENTER_CENTER" = "CENTER_LEFT";

  const currentColors = $derived(retrieveCurrentColors($appearance));
  const bgHsl = $derived(currentColors.bgs1);
  const apHsl = $derived(currentColors.aps1);
  const apHue = $derived(apHsl?.split(" ")[0].split("(")[1]);
  let stream: MediaStream | null = null;

  onMount(() => {
    canvasContext = canvasElement.getContext("2d")!;
    // audioContext = new (window.AudioContext || window.webkitAudioContext)();

    return () => {
      cleanup();
    };
  });

  export async function start(source: any = undefined) {
    let isMicrophone = false;
    if (!source || source === "microphone") {
      isMicrophone = true;
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      source = audioContext.createMediaStreamSource(stream);
    }
    analyser = audioContext.createAnalyser();
    source.connect(analyser);
    if (!isMicrophone) {
      console.log("HTMLAudioElement");
      analyser.connect(audioContext.destination);
    }
    analyser.fftSize = 4096;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    dataArrayCopy = new Uint8Array(bufferLength);
    drawVisualizer();
    // drawWavyOne();
    // drawWavyTwo();
  }

  function cleanup() {
    if (analyser) {
      analyser.disconnect();
    }
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      stream = null;
    }
  }

  export async function stop() {
    cancelAnimationFrame(animationFrameId);
  }
  let scrollOffset = 0;
  function drawVisualizer() {
    animationFrameId = requestAnimationFrame(drawVisualizer);

    analyser.getByteFrequencyData(dataArray);
    // // Shift the old data to the left
    // for (let i = 0; i < bufferLength - 1; i++) {
    //   dataArrayCopy[i] = dataArrayCopy[i + 1];
    // }
    // // Insert the new data at the end
    // dataArrayCopy[bufferLength - 1] = dataArray[bufferLength - 1];
    // console.log({ bgHsl, apHsl, apHue });
    canvasContext.fillStyle = bgHsl;
    canvasContext.fillRect(0, 0, canvasElement.width, canvasElement.height);
    if (variant === "CENTER_CENTER" || variant === "CENTER_LEFT") {
      canvasContext.beginPath();
      canvasContext.moveTo(0, canvasElement.height / 2);
      canvasContext.lineTo(canvasElement.width, canvasElement.height / 2);
      canvasContext.strokeStyle = apHsl;
      canvasContext.lineWidth = 0.5;
      canvasContext.stroke();
    }

    let barWidth = (canvasElement.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i];
      //   canvasContext.fillStyle = "rgb(" + (barHeight + 100) + ",50,50)";
      canvasContext.fillStyle = `hsl(${apHue} ${barHeight + 100}% ${50}%)`;
      if (variant === "CENTER_CENTER" || variant === "BOTTOM_CENTER")
        x =
          i < bufferLength / 2
            ? canvasElement.width / 2 - barWidth * (bufferLength / 2 - i)
            : canvasElement.width / 2 + barWidth * (i - bufferLength / 2);
      const y =
        variant === "BOTTOM_LEFT"
          ? canvasElement.height - barHeight / 2
          : variant === "CENTER_LEFT"
            ? canvasElement.height / 2 - barHeight / 4
            : variant === "BOTTOM_CENTER"
              ? canvasElement.height - barHeight / 2
              : canvasElement.height / 2 - barHeight / 4;

      canvasContext.fillRect(x, y, barWidth, barHeight / 2);

      if (variant === "BOTTOM_LEFT" || variant === "CENTER_LEFT")
        x += barWidth + 1;
    }
  }
  function drawWavyOne() {
    animationFrameId = requestAnimationFrame(drawWavyOne);

    // Get the waveform data
    analyser.getByteTimeDomainData(dataArray);

    // Clear the canvas
    canvasContext.fillStyle = bgHsl;
    canvasContext.fillRect(0, 0, canvasElement.width, canvasElement.height);

    // Draw the first wavy line
    canvasContext.beginPath();
    for (let i = 0; i < bufferLength; i++) {
      let v = dataArray[i] / 128.0; // Normalize to range [0, 2]
      let y = (v * canvasElement.height) / 2; // Scale to the height of the canvas
      let x = i * (canvasElement.width / bufferLength); // Scale to the width of the canvas
      canvasContext.lineTo(x, y);
    }
    canvasContext.strokeStyle = apHsl;
    canvasContext.stroke();

    // Draw the second wavy line
    canvasContext.beginPath();
    for (let i = 0; i < bufferLength; i++) {
      let v = dataArray[i] / 128.0; // Normalize to range [0, 2]
      let y = canvasElement.height - (v * canvasElement.height) / 2; // Scale to the height of the canvas and flip vertically
      let x = i * (canvasElement.width / bufferLength); // Scale to the width of the canvas
      canvasContext.lineTo(x, y);
    }
    canvasContext.strokeStyle = apHsl;
    canvasContext.stroke();
  }
  onDestroy(() => {
    cancelAnimationFrame(animationFrameId);
  });
</script>

<canvas bind:this={canvasElement} width="640" height="180"></canvas>
