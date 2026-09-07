<script lang="ts">
  let {
    primary = 0,
    secondary = 0,
    size = 12,
    strokeWidth = 2,
    primaryColor = "stroke-fgs1",
    secondaryColor = "stroke-fgs2",
    secondaryOpacity = 0.3
  }: {
    primary?: number;
    secondary?: number;
    size?: number;
    strokeWidth?: number;
    primaryColor?: string;
    secondaryColor?: string;
    secondaryOpacity?: number;
  } = $props();

  const total = $derived(primary + secondary);
  const primaryPercentage = $derived(total > 0 ? (primary / total) * 100 : 0);
  const secondaryPercentage = $derived(
    total > 0 ? (secondary / total) * 100 : 0
  );
  const radius = $derived((size - strokeWidth) / 2);
  const circumference = $derived(2 * Math.PI * radius);
  const primaryStrokeDasharray = $derived(
    `${(primaryPercentage / 100) * circumference} ${circumference}`
  );
  const secondaryStrokeDasharray = $derived(
    `${(secondaryPercentage / 100) * circumference} ${circumference}`
  );
  const secondaryStrokeDashoffset = $derived(
    -((primaryPercentage / 100) * circumference)
  );
</script>

<svg
  width={size}
  height={size}
  class="transform -rotate-90"
  viewBox="0 0 {size} {size}"
>
  <!-- Primary circle -->
  {#if primaryPercentage > 0}
    <circle
      cx={size / 2}
      cy={size / 2}
      r={radius}
      class={primaryColor}
      stroke-width={strokeWidth}
      fill="none"
      stroke-dasharray={primaryStrokeDasharray}
      stroke-linecap="round"
    />
  {/if}

  <!-- Secondary circle -->
  {#if secondaryPercentage > 0}
    <circle
      cx={size / 2}
      cy={size / 2}
      r={radius}
      class={secondaryColor}
      stroke-width={strokeWidth}
      fill="none"
      stroke-dasharray={secondaryStrokeDasharray}
      stroke-dashoffset={secondaryStrokeDashoffset}
      stroke-linecap="round"
      opacity={secondaryOpacity}
    />
  {/if}
</svg>
