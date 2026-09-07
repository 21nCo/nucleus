import CaptureComponent from "@nucleum/components/CaptureComponent.svelte";

export default {
  component: CaptureComponent,
  parameters: { layout: "centered" }
};

export const Default = {};

export const WithProps = {
  args: {
    IconsList: ["music", "microphone", "camera", "video-camera"]
  }
};
