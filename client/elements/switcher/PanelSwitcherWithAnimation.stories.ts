import type { Meta, StoryObj } from "@storybook/svelte";

import PanelSwitcherWithAnimation from "@21n/elements/switcher/PanelSwitcherWithAnimation.svelte";

import { Size } from "@21n/elements/size.enum";
import { PanelSwitcherStyle } from "@21n/elements/switcher/switcher.enum";
const meta = {
  title: "Elements/Switcher/PanelSwitcherWithAnimation",
  component: PanelSwitcherWithAnimation,
  argTypes: {
    items: { control: { type: "object" } },
    value: { control: "text" },
    style: PanelSwitcherStyle,
    interval: { control: "number" }
  }
} satisfies Meta<PanelSwitcherWithAnimation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Bar: Story = {
  args: {
    items: ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"],
    value: "Item 2",
    style: PanelSwitcherStyle.BAR,
    interval: 4000
  }
};

export const Train: Story = {
  args: {
    items: ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"],
    value: "Item 2",
    style: PanelSwitcherStyle.TRAIN,
    interval: 4000
  }
};
