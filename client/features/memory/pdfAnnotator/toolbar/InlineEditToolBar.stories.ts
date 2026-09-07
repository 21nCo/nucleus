import InlineEditToolBar from "@nucleum/features/memory/pdfAnnotator/toolbar/InlineEditToolBar.svelte";
export default {
  component: InlineEditToolBar,
  parameters: { layout: "centered" }
};

export const Default = {};

export const withProps = {
  Component: InlineEditToolBar,
  args: { editable: true }
};
