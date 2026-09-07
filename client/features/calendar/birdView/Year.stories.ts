import type { Meta, StoryObj } from "@storybook/svelte";
import Year from "@nucleum/features/calendar/birdView/Year.svelte";
const meta = {
  component: Year
} satisfies Meta<Year>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
