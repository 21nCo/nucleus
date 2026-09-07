import TextHiglighter from "@nucleum/features/memory/pdfAnnotator/TextHiglighter.svelte";
export default {
  component: TextHiglighter,
  parameters: { layout: "centered" }
};

export const Default = {};

export const withProps = {
  Component: TextHiglighter,
  args: {
    rects: [
      {
        x1: 281.8453369140625,
        y1: 608.4444236755371,
        x2: 399.70068359375,
        y2: 621.7777976989746,
        width: 816,
        height: 1056,
        pageNumber: 1
      }
    ]
  }
};
