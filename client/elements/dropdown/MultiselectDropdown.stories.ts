import type { Meta, StoryObj } from "@storybook/svelte";

import MultiselectDropdown from "@21n/elements/dropdown/MultiselectDropdown.svelte";
import { InputStyle } from "@21n/elements/input/input.type";

const meta = {
  title: "Elements/Dropdown/MultiselectDropdown",
  component: MultiselectDropdown,
  argTypes: {
    parentBackgroundIndex: {
      control: { type: "number", min: 0, max: 3, step: 1 }
    }
  },
  args: {
    options: [
      { label: "Item 1", value: "item1", icon: "cross", disabled: false },
      { label: "Item 2", value: "item2", icon: "plus", disabled: false },
      { label: "Item 3", value: "item3", icon: "minus", disabled: false },
      { label: "Item 4", value: "item4", icon: "chevup", disabled: false },
      { label: "Item 5", value: "item5", icon: "chevdown", disabled: false }
    ],
    selected: ["item2", "item3"],
    parentBackgroundIndex: 2,
    placeholder: "multiselect an item",
    containerId: "1234",
    style: InputStyle.BORDERED
  }
} satisfies Meta<MultiselectDropdown>;

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
