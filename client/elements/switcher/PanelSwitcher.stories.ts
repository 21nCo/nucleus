import type { Meta, StoryObj } from "@storybook/svelte";

import PanelSwitcher from "@21n/elements/switcher/PanelSwitcher.svelte";

import { Size } from "@21n/elements/size.enum";
import { PanelSwitcherStyle } from "@21n/elements/switcher/switcher.enum";
const meta = {
  title: "Elements/Switcher/PanelSwitcher",
  component: PanelSwitcher,
  argTypes: {
    activeColor: { control: { type: "range", min: -1, max: 255, step: 1 } },
    isDisableEnabled: { control: "boolean" },
    parentBgIndex: {
      control: { type: "number", min: 0, max: 3, step: 1 }
    }
  },
  args: {
    items: ["Item 1", "Item 2", "Item 3", "Item 4", "Item 5"],
    value: "Item 2",
    activeColor: undefined,
    isDisableEnabled: false,
    parentBgIndex: 2,
    size: Size.md
  }
} satisfies Meta<PanelSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Bar: Story = {
  args: {
    style: PanelSwitcherStyle.BAR
  }
};

export const Train: Story = {
  args: {
    style: PanelSwitcherStyle.TRAIN
  }
};
