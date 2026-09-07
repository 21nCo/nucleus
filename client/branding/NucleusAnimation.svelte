<script lang="ts">
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  let {
    size = Size.md
  }: {
    size?: Size.sm | Size.md | Size.xs;
  } = $props();
</script>

<div class="nucleus-animation">
  <svg
    class={cn({
      "w-16 h-16": size === Size.md,
      "w-8 h-8": size === Size.sm,
      "w-6 h-6": size === Size.xs
    })}
    viewBox="0 0 462 462"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M287.977 130.92C271.068 121.139 251.436 115.541 230.497 115.541C167.008 115.541 115.539 167.01 115.539 230.499C115.539 265.712 131.371 297.227 156.305 318.315M184.195 335.752C198.36 341.993 214.024 345.458 230.497 345.458C293.987 345.458 345.456 293.989 345.456 230.499C345.456 198.826 332.647 170.145 311.926 149.353"
      class="stroke-logo-dark dark:stroke-logo-light rotating-arcs"
      stroke-width="11.125"
      stroke-linecap="round"
    />

    <circle
      cx="230.491"
      cy="230.504"
      r="83.0255"
      class="stroke-logo-dark dark:stroke-logo-light rotating-outer"
      stroke-width="11.125"
    />

    <path
      d="M193.995 195.002C187.835 201.152 183.161 208.957 180.746 217.97C173.423 245.299 189.641 273.389 216.97 280.712C232.127 284.773 247.519 281.594 259.471 273.293M270.194 263.299C274.514 257.921 277.812 251.579 279.712 244.488C287.035 217.159 270.817 189.068 243.488 181.746C229.854 178.093 216.031 180.298 204.691 186.819"
      class="stroke-logo-dark dark:stroke-logo-light rotating-middle"
      stroke-width="11.125"
      stroke-linecap="round"
    />

    <circle
      cx="230.119"
      cy="230.121"
      r="18.4963"
      class="stroke-logo-dark dark:stroke-logo-light nucleus-core"
      stroke-width="11.125"
    />
  </svg>
</div>

<style>
  .nucleus-animation {
    display: inline-block;
  }

  .rotating-arcs {
    transform-origin: 230.5px 230.5px;
    animation: rotate-clockwise 4s linear infinite;
  }

  .rotating-outer {
    transform-origin: 230.491px 230.504px;
    animation: rotate-counterclockwise 6s linear infinite;
  }

  .rotating-middle {
    transform-origin: 230.499px 230.509px;
    animation: rotate-counterclockwise 3s linear infinite;
  }

  .nucleus-core {
    transform-origin: 230.119px 230.121px;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes rotate-clockwise {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes rotate-counterclockwise {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(-360deg);
    }
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }
</style>
