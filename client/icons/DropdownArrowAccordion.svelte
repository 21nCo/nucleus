<script lang="ts">
  import { AccordionState } from "@21n/elements/accordion/accordionState.enum";

  let {
    width = 10,
    height = 7,
    state,
    isActive = false,
    opacity = 1
  }: {
    width?: number;
    height?: number;
    state: AccordionState;
    isActive?: boolean;
    opacity?: number;
  } = $props();

</script>

<svg
  class={`transform transition duration-200 rotate-0 ease-in-out ${
    state === AccordionState.collapsed && `rotate-[-90deg]`
  }`}
  {width}
  {height}
  viewBox="0 0 10 7"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M0.230169 0.709376C0.528748 0.422281 1.00353 0.43159 1.29063 0.730169L5 4.66792L8.70938 0.730169C8.99647 0.431591 9.47125 0.422281 9.76983 0.709376C10.0684 0.996471 10.0777 1.47125 9.79063 1.76983L5.54063 6.26983C5.39922 6.41689 5.20401 6.5 5 6.5C4.79599 6.5 4.60078 6.41689 4.45938 6.26983L0.209376 1.76983C-0.0777189 1.47125 -0.0684095 0.996471 0.230169 0.709376Z"
    style={`fill: ${
      isActive
        ? `rgba(var(--colors-bgs1),${opacity})`
        : `rgba(var(--colors-fgs1),${opacity})`
    };`}
  />
</svg>
