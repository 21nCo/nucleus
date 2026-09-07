import type { Meta, StoryObj } from "@storybook/svelte";

import FloatingButton from "@21n/elements/button/FloatingButton.svelte";
import { Size } from "@21n/elements/size.enum";
import { ButtonVariant } from "@21n/elements/button/button.type";

const meta: Meta<FloatingButton> = {
  component: FloatingButton,
  argTypes: {
    params: {
      size: {
        control: { type: "select" },
        options: [Size.xxs, Size.xs, Size.sm, Size.md, Size.lg, Size.xl]
      },
      variant: {
        control: { type: "select" },
        options: ["primary", "secondary", "danger"]
      }
    }
  },
  args: {
    params: {
      label: "Close",
      icon: "cross",
      callback: () => Promise.resolve(),
      size: Size.md,
      variant: ButtonVariant.SECONDARY
    }
  }
};

export default meta;
type Story = {
  args: {
    params?: {
      [key: string]: any;
      variant: ButtonVariant;
    };
  };
};

export const Default: Story = {
  args: {
    params: {
      ...meta?.args?.params,
      variant: ButtonVariant.SECONDARY
    }
  }
};

export const Primary: Story = {
  args: {
    params: {
      ...meta?.args?.params,
      variant: ButtonVariant.PRIMARY
    }
  }
};

export const Secondary: Story = {
  args: {
    params: {
      ...meta?.args?.params,
      variant: ButtonVariant.SECONDARY
    }
  }
};

export const Danger: Story = {
  args: {
    params: {
      ...meta?.args?.params,
      variant: ButtonVariant.DANGER
    }
  }
};

export const Tertiary: Story = {
  args: {
    params: {
      ...meta?.args?.params,
      variant: ButtonVariant.TERTIARY
    }
  }
};
