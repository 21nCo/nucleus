import type { Meta, StoryObj } from "@storybook/svelte";

import ToolBar from "@nucleum/features/memory/pdfAnnotator/toolbar/ToolBar.svelte";
import ToolBarBoundStory from "@nucleum/features/memory/pdfAnnotator/toolbar/ToolBarBoundStory.svelte";

const meta = {
  title: "Products/Memotron/PdfAnnotator/ToolBar",
  component: ToolBar,
  parameters: { layout: "centered" }
} satisfies Meta<ToolBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithProps: Story = {
  args: {}
};

export const BoundPropsPropagateToParent: StoryObj<typeof ToolBarBoundStory> = {
  render: () => ({
    Component: ToolBarBoundStory
  })
};
