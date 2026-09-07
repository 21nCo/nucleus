import type { Meta, StoryObj } from "@storybook/svelte";
import Button from "@21n/elements/button/Button.svelte";
import { Size } from "@21n/elements/size.enum";
import { Placement } from "@21n/elements/direction.enum";
import { ButtonStyle, ButtonVariant } from "@21n/elements/button/button.type";

const meta = {
  component: Button,
  argTypes: {
    size: {
      control: { type: "select" },
      options: [Size.xxs, Size.xs, Size.sm, Size.md, Size.lg, Size.xl]
    },
    type: {
      control: { type: "select" },
      options: [
        ButtonVariant.PRIMARY,
        ButtonVariant.SECONDARY,
        ButtonVariant.DANGER
      ]
    },
    tooltipOptions: {
      control: { type: "select" },
      options: [
        Placement.Top,
        Placement.Bottom,
        Placement.Left,
        Placement.Right
      ]
    },
    parentBgIndex: {
      control: { type: "number", min: 0, max: 3, step: 1 }
    },
    style: {
      control: { type: "select" },
      options: [ButtonStyle.DEFAULT, ButtonStyle.PLAIN, ButtonStyle.OUTLINED]
    },
    isDisabled: { control: { type: "boolean" } },
    isLoading: { control: { type: "boolean" } }
  },
  args: {
    size: Size.md,
    isDisabled: false
  }
} satisfies Meta<Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: "Default"
  }
};
export const Primary: Story = {
  args: {
    type: ButtonVariant.PRIMARY,
    label: "Primary"
  }
};

export const Secondary: Story = {
  args: {
    type: ButtonVariant.SECONDARY,
    label: "Secondary"
  }
};

export const Danger: Story = {
  args: {
    type: ButtonVariant.DANGER,
    label: "Danger"
  }
};

export const ButtonWithTooltipDefaultPlacement: Story = {
  args: {
    tooltip: "change tooltip position from below controls",
    label: "TT Button"
  }
};
export const LoadingButton: Story = {
  args: {
    tooltip: "A sample for loading button",
    label: "Loading",
    isLoading: true,
    type: "primary"
  }
};
