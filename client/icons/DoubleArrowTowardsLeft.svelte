<script lang="ts">
  import { IconVariant } from "@21n/elements/icon.type";

  let {
    color = "",
    opacity = 1,
    classList = "",
    isActive = false,
    activeColor = "",
    variant = IconVariant.Outline
  }: {
    color?: string;
    opacity?: number;
    classList?: string;
    isActive?: boolean;
    activeColor?: string;
    variant?: IconVariant;
  } = $props();

  const iconFinalColor = $derived(
    isActive
      ? activeColor || color || `rgba(var(--colors-bgs1),${opacity})`
      : color || `rgba(var(--colors-fgs1),${opacity})`
  );
</script>

{#if variant === IconVariant.Outline}
  <svg
    width="12"
    height="11"
    viewBox="0 0 12 11"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      class={classList}
      style={`opacity: ${opacity}; fill: ${iconFinalColor}`}
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M11.7906 10.4495C11.5035 10.7481 11.0287 10.7574 10.7302 10.4703L6.23017 6.22031C6.08311 6.07891 6 5.8837 6 5.67969C6 5.47568 6.08311 5.28047 6.23017 5.13906L10.7302 0.889062C11.0287 0.601967 11.5035 0.611277 11.7906 0.909855C12.0777 1.20843 12.0684 1.68322 11.7698 1.97031L7.83208 5.67969L11.7698 9.38906C12.0684 9.67616 12.0777 10.1509 11.7906 10.4495ZM5.79062 10.4495C5.50353 10.7481 5.02875 10.7574 4.73017 10.4703L0.230167 6.22031C0.0831085 6.07891 -1.37295e-06 5.8837 -1.39079e-06 5.67969C-1.40862e-06 5.47568 0.0831084 5.28047 0.230167 5.13906L4.73017 0.889063C5.02875 0.601967 5.50353 0.611277 5.79062 0.909855C6.07772 1.20843 6.06841 1.68322 5.76983 1.97031L1.83208 5.67969L5.76983 9.38906C6.06841 9.67616 6.07772 10.1509 5.79062 10.4495Z"
    />
  </svg>
{:else if variant === IconVariant.Solid}
  <svg
    width="12"
    height="11"
    viewBox="0 0 12 11"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      class={classList}
      style={`opacity: ${opacity}; fill: ${iconFinalColor}`}
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M11.7906 10.4495C11.5035 10.7481 11.0287 10.7574 10.7302 10.4703L6.23017 6.22031C6.08311 6.07891 6 5.8837 6 5.67969C6 5.47568 6.08311 5.28047 6.23017 5.13906L10.7302 0.889062C11.0287 0.601967 11.5035 0.611277 11.7906 0.909855C12.0777 1.20843 12.0684 1.68322 11.7698 1.97031L7.83208 5.67969L11.7698 9.38906C12.0684 9.67616 12.0777 10.1509 11.7906 10.4495ZM5.79062 10.4495C5.50353 10.7481 5.02875 10.7574 4.73017 10.4703L0.230167 6.22031C0.0831085 6.07891 -1.37295e-06 5.8837 -1.39079e-06 5.67969C-1.40862e-06 5.47568 0.0831084 5.28047 0.230167 5.13906L4.73017 0.889063C5.02875 0.601967 5.50353 0.611277 5.79062 0.909855C6.07772 1.20843 6.06841 1.68322 5.76983 1.97031L1.83208 5.67969L5.76983 9.38906C6.06841 9.67616 6.07772 10.1509 5.79062 10.4495Z"
    />
  </svg>
{/if}
