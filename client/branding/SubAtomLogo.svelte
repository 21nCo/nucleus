<script lang="ts">
  import { onMount } from "svelte";
  import { ClientStorageKey } from "@nucleum/persistence/persistence.type";
  import { clientStorage } from "@nucleum/persistence/persistence.utils";
  import { Size } from "@21n/types/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import MemotronLogo from "./MemotronLogo.svelte";
  import PointronLogo from "./PointronLogo.svelte";
  import NucleusLogo from "./NucleusLogo.svelte";
  import NucleusAnimation from "./NucleusAnimation.svelte";
  let {
    subatom = $bindable(undefined),
    size = Size.md,
    isShowAnimation = false,
    variant = "primary"
  }: {
    subatom?: string | undefined;
    size?: Size.sm | Size.md | Size.xs;
    isShowAnimation?: boolean;
    variant?: "accent" | "subtle" | "primary";
  } = $props();
  const resolvedSubatom = $derived(subatom === "nucleus" ? "nucleum" : subatom);
  let cssRoot = $state<HTMLElement | null>(null);
  let logoRoot = $state<HTMLElement | null>(null);

  onMount(async () => {
    if (!subatom)
      subatom =
        (await clientStorage.get(ClientStorageKey.PRODUCT)) ?? "tidigit";
  });
  const width = $derived(size === Size.md ? 180 : size === Size.sm ? 30 : 25);
  const threadColor = $derived(
    variant === "accent"
      ? "rgba(var(--colors-aps1), 0.5)"
      : variant === "subtle"
        ? "rgba(var(--colors-fgs3), 0.4)"
        : "rgba(var(--colors-fgs1), 0.45)"
  );
  const bgColor = $derived(
    variant === "accent"
      ? "rgba(var(--colors-aps2), 0.05)"
      : variant === "subtle"
        ? "rgba(var(--colors-bgs3), 0.5)"
        : "rgba(var(--colors-bgs2), 0.5)"
  );
  onMount(() => {
    cssRoot = logoRoot;
    cssRoot?.style.setProperty("--thread-color", threadColor);
  });
  $effect(() => {
    bgColor;
    if (!cssRoot) {
      return;
    }
    cssRoot.style.setProperty("--thread-color", threadColor);
  });
</script>

<div class="relative">
  <div
    bind:this={logoRoot}
    class={cn({
      "w-16 h-16": size === Size.md,
      "w-8 h-8": size === Size.sm,
      "w-6 h-6": size === Size.xs
    })}
    style="clip-path: url(#{resolvedSubatom}-logoClip);"
  >
    {#if isShowAnimation}
      {#if resolvedSubatom === "nucleum"}
        <NucleusAnimation />
      {:else}
        <div class="section section-horizontal"></div>
        <div class="section section-diagonal-1"></div>
        <div class="section section-diagonal-2"></div>
      {/if}
    {:else}
      <svg
        viewBox="0 0 462 462"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="absolute"
      >
        {#if resolvedSubatom === "nucleum"}
          <NucleusLogo {width} />
        {:else if resolvedSubatom === "pointron"}
          <PointronLogo {width} />
        {:else if resolvedSubatom === "memotron"}
          <MemotronLogo {width} />
        {/if}
      </svg>
    {/if}
  </div>
  {#if resolvedSubatom !== "nucleum" && isShowAnimation}
    <svg
      viewBox="0 0 462 462"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="absolute"
    >
      <defs>
        <clipPath
          id={`${resolvedSubatom}-logoClip`}
          clipPathUnits="objectBoundingBox"
          transform="scale(0.002165 0.002165)"
        >
          {#if resolvedSubatom === "nucleum"}
            <NucleusLogo {width} />
          {:else if resolvedSubatom === "pointron"}
            <PointronLogo {width} />
          {:else if resolvedSubatom === "memotron"}
            <MemotronLogo {width} />
          {/if}
        </clipPath>
      </defs>
    </svg>
  {/if}
</div>

<style>
  .section {
    position: absolute;
    width: 100%;
    height: 33.33%;
  }

  .section-horizontal {
    top: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent 0px,
      transparent 1.5px,
      var(--thread-color) 1.5px,
      var(--thread-color) 2px
    );
    animation: wave-1 2s ease-in-out infinite;
  }

  .section-diagonal-1 {
    top: 33.33%;
    background: repeating-linear-gradient(
      45deg,
      transparent 0px,
      transparent 1.5px,
      var(--thread-color) 1.5px,
      var(--thread-color) 2px
    );
    background-size: 2.83px 2.83px;
    animation: wave-2 2s ease-in-out 0.4s infinite;
  }

  .section-diagonal-2 {
    top: 66.66%;
    background: repeating-linear-gradient(
      -45deg,
      transparent 0px,
      transparent 1.5px,
      var(--thread-color) 1.5px,
      var(--thread-color) 2px
    );
    background-size: 2.83px 2.83px;
    animation: wave-3 2s ease-in-out 0.8s infinite;
  }

  @keyframes wave-1 {
    0%,
    100% {
      opacity: 0.3;
    }
    50% {
      opacity: 1;
    }
  }

  @keyframes wave-2 {
    0%,
    100% {
      opacity: 0.4;
    }
    50% {
      opacity: 1;
    }
  }

  @keyframes wave-3 {
    0%,
    100% {
      opacity: 0.35;
    }
    50% {
      opacity: 1;
    }
  }
</style>
