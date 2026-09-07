import InlineToolBar from "@nucleum/features/memory/pdfAnnotator/toolbar/InlineToolBar.svelte";

export default {
  component: InlineToolBar,
  parameters: { layout: "centered" }
};

export const Default = {};

export const WithProps = {
  component: InlineToolBar,
  args: {}
};
