import type { Meta, StoryObj } from "@storybook/svelte";

import TodayButton from "@21n/elements/button/TodayButton.svelte";
import { selectedTimePeriod } from "@nucleum/stores/app.store";

const currentDate = new Date();
currentDate.setMonth(currentDate.getMonth() - 1);
selectedTimePeriod.set(currentDate);
const meta = {
  component: TodayButton,
  argTypes: {
    parentBackgroundIndex: {
      control: { type: "number", min: 0, max: 3, step: 1 }
    }
  }
} satisfies Meta<TodayButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    parentBackgroundIndex: 0
  }
};
