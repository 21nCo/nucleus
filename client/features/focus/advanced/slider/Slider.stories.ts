import type { Meta, StoryObj } from "@storybook/svelte";
import Slider from "@nucleum/features/focus/advanced/slider/Slider.svelte";

/**
 * some description
 */
const meta = {
  component: Slider
} satisfies Meta<Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
