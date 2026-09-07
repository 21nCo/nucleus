import type { Meta, StoryObj } from "@storybook/svelte";
import OptionSelector from "@21n/elements/select/OptionSelector.svelte";
import { Size } from "@21n/elements/size.enum";
import { OptionSelectorStyle } from "@21n/elements/select/select.type";
import { Orientation } from "@21n/elements/direction.enum";

const meta = {
  title: "Elements/Select/OptionSelector",
  component: OptionSelector,
  argTypes: {
    size: {
      control: { type: "select" },
      options: [Size.sm, Size.md]
    }
  },

  args: {
    options: [
      { value: "chevup", label: "chevup", icon: "chevup", isDisabled: false },
      {
        value: "chevdown",
        label: "chevdown",
        icon: "chevdown",
        isDisabled: false
      },
      { value: "cross", label: "cross", icon: "cross", isDisabled: false }
    ],
    selected: "chevup",
    size: Size.md,
    parentBgIndex: 2,
    labelProps: {
      label: "sample items",
      orientation: Orientation.Vertical
    },
    iconOrientation: Orientation.Horizontal
  }
} satisfies Meta<OptionSelector>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    style: OptionSelectorStyle.TRAIN,
    iconOrientation: Orientation.Horizontal
  }
};

export const Train: Story = {
  args: {
    style: OptionSelectorStyle.TRAIN,
    iconOrientation: Orientation.Horizontal
  }
};
export const TrainVerticalIcon: Story = {
  args: {
    style: OptionSelectorStyle.TRAIN,
    iconOrientation: Orientation.Vertical
  }
};
export const Outline: Story = {
  args: {
    style: OptionSelectorStyle.OUTLINE,
    iconOrientation: Orientation.Horizontal
  }
};
export const OutlineVerticalIcon: Story = {
  args: {
    style: OptionSelectorStyle.OUTLINE,
    iconOrientation: Orientation.Vertical
  }
};
export const CheckCircle: Story = {
  args: {
    style: OptionSelectorStyle.CHECK_CIRCLE,
    iconOrientation: Orientation.Horizontal
  }
};
// export const CheckCircleVerticalicon: Story = {
//   args: {
//     style: OptionSelectorStyle.CHECK_CIRCLE,
//     iconOrientation: Orientation.Vertical,
//   }
// };
