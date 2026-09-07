import type { Meta, StoryObj } from "@storybook/svelte";
import GridInputElement from "@nucleum/products/memotron/lab/infiniteGrid/GridInputElement.svelte";
import GridInputElementBoundStory from "./GridInputElementBoundStory.svelte";

const meta = {
  title: "Products/Memotron/Lab/GridInputElement",
  component: GridInputElement,
  parameters: { layout: "centered" },
  args: {
    id: "temp",
    size: 100,
    top: 0,
    left: 0,
    value: "type here",
    childItems: [],
    index: { r: 0, c: 0 }
  }
} satisfies Meta<GridInputElement>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const BoundValueAndChildrenPropagateToParent: Story = {
  render: () => ({
    Component: GridInputElementBoundStory
  })
};
