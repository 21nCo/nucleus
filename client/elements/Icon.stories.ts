import type { Meta, StoryObj } from "@storybook/svelte";
import Icon from "@21n/elements/Icon.svelte";
import { Size } from "@21n/elements/size.enum";
import { IconVariant } from "@21n/elements/icon.type";
import { icons } from "@21n/icons/catalog";
const meta = {
  component: Icon,
  argTypes: {
    icon: { control: { type: "select" }, options: [...icons] },
    variant: {
      control: { type: "select" },
      options: [
        IconVariant.Outline,
        IconVariant.Solid,
        IconVariant.Micro,
        IconVariant.Mini,
        IconVariant.Duotone
      ]
    },
    size: {
      control: { type: "select" },
      options: [Size.xs, Size.sm, Size.md, Size.lg, Size.xl]
    },
    isActive: Boolean,
    color: { control: "text" },
    bgColorHue: { control: { type: "range", min: -1, max: 255, step: 1 } },
    isOutlineForActive: Boolean
  }
} satisfies Meta<Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: undefined,
    variant: IconVariant.Outline,
    size: Size.md,
    isActive: false,
    color: undefined,
    bgColorHue: undefined,
    isOutlineForActive: false
  }
};
