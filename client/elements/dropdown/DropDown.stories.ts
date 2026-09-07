import type { Meta, StoryObj } from "@storybook/svelte";

import DropDown from "@21n/elements/dropdown/DropDown.svelte";
import { InputStyle } from "@21n/elements/input/input.type";

const meta = {
  title: "Elements/Dropdown/DropDown",
  component: DropDown,
  argTypes: {
    parentBackgroundIndex: {
      control: { type: "number", min: 0, max: 3, step: 1 }
    },
    isActive: { control: "boolean" }
  },
  args: {
    items: [
      { label: "Item 1", value: "item1", icon: "cross", disabled: false },
      { label: "Item 2", value: "item2", icon: "plus", disabled: false },
      { label: "Item 3", value: "item3", icon: "minus", disabled: false }
    ],
    value: "item2",
    parentBackgroundIndex: 2,
    isActive: false,
    style: InputStyle.BORDERED
  }
} satisfies Meta<DropDown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Bordered: Story = {
  args: {
    style: InputStyle.BORDERED
  }
};
export const Plain: Story = {
  args: {
    style: InputStyle.PLAIN
  }
};
export const Filled: Story = {
  args: {
    style: InputStyle.FILLED
  }
};
export const isActive: Story = {
  args: {
    style: InputStyle.BORDERED,
    isActive: true
  }
};
export const isActivePlain: Story = {
  args: {
    style: InputStyle.PLAIN,
    isActive: true
  }
};
export const isActiveFilled: Story = {
  args: {
    style: InputStyle.FILLED,
    isActive: true
  }
};
