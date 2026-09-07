<svelte:options runes={true} />

<script lang="ts">
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";
  import "@21n/fonts";
  import "@21n/fonts/styles.css";
  import view from "@nucleum/stores/view.store";
  import { AppSkin } from "@21n/theme/appearance.type";
  import { postDataToParent } from "@nucleum/client/runtime/embed/embed.utils";
  import appearance, {
    fallBackTypefaceString
  } from "@nucleum/stores/appearance.store";
  import ColorLayer from "@21n/layout/layers/themeLayer/ColorLayer.svelte";
  import GlassSkin from "@21n/layout/layers/themeLayer/GlassSkin.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import "@fontsource-variable/space-grotesk";
  import "@fontsource-variable/hanken-grotesk";
  import "@fontsource-variable/sen";
  import "@fontsource/noto-color-emoji";
  // Do not remove this import as it is required for the global css propagation in case of custom colors are absent - ex: PanelSwitcher
  import CustomColorPropagator from "@21n/elements/style/CustomColorPropagator.svelte";
  import { userPreferences } from "@nucleum/stores/preferences/user-preferences.store";
  import { EmbedDataMessage } from "@nucleum/client/runtime/embed/embedMessage.enum";
  import { generateGoogleFontsUrl } from "@21n/layout/layers/themeLayer/fonts.config";

  let {
    children,
    extensionContext = undefined,
    isInlineExtensionContext = false,
    isSheetContext = false
  }: {
    children?: Snippet;
    extensionContext?: string;
    isInlineExtensionContext?: boolean;
    isSheetContext?: boolean;
  } = $props();
  let fontFamily = $state("Avenir");
  let defaultRootFontSize = $state(16);
  let rootFontSize = $state(defaultRootFontSize + 0.6 * $view?.scale);
  let ref: HTMLDivElement;
  const defaultTypeface = "Twenty One Native";
  let typeface = $state(
    $userPreferences?.appearance?.typeface ?? defaultTypeface
  );
  let accessibilitySizingFactor = $state(
    $userPreferences?.accessibilitySizingFactor ?? 1
  );

  onMount(() => {
    refreshTailwind();
    refreshSizing();
    const userPreferencesSub = userPreferences.subscribe((x) => {
      if (!userPreferences.isInitialized) return;
      const preferenceAppearance =
        x.appearance ?? userPreferences.seed.appearance;
      if ((preferenceAppearance.typeface ?? defaultTypeface) !== typeface) {
        typeface = preferenceAppearance.typeface ?? defaultTypeface;
        refreshTailwind();
      }
      if (x.accessibilitySizingFactor !== accessibilitySizingFactor) {
        accessibilitySizingFactor = x.accessibilitySizingFactor ?? 1;
        refreshSizing();
      }
      if (
        $appearance.lightColorSchemeId !==
          preferenceAppearance.lightColorSchemeId ||
        $appearance.darkColorSchemeId !==
          preferenceAppearance.darkColorSchemeId ||
        $appearance.userThemeSetting !==
          preferenceAppearance.userThemeSetting ||
        $appearance.isSyncWithSystem !== preferenceAppearance.isSyncWithSystem
      ) {
        appearance.syncAppearanceFromCloud(preferenceAppearance);
      }
    });
    const appearanceSub = appearance.subscribe(() => {
      refreshTailwind();
    });
    const darkModeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );
    appearance.setSystemTheme(darkModeMediaQuery.matches);
    const onDarkModeChange = (e: MediaQueryListEvent) => {
      appearance.setSystemTheme(e.matches);
    };
    darkModeMediaQuery.addEventListener("change", onDarkModeChange);
    return () => {
      appearanceSub();
      userPreferencesSub();
      darkModeMediaQuery.removeEventListener("change", onDarkModeChange);
    };
  });

  /**
   *
   *
   * _Notes on extension context:_
   * `shadowRoot.host.style.fontSize` doesn't effect the font size of the extension as tailwind relies on root font size for rem units and in a shadow root extention context, rem units are not reliable as web pages may have different root font size. For now, @thedutchcoder/postcss-rem-to-px is being used as a postcss plugin to convert rem to px during build time as a workaround.
   *
   * visibility is set to visible with important to handle cases where the web pages override extension styles like on Reddit website.
   *
   *Note: Setting default root font size (16) as root size for Sheet context as regular calculation is yiedling 14.xx as root size which is resulting in smaller and hard to read text.
   TODO - test other $view.scale cases and the need for having less defaultRootFontSize for $view.scale < 0.55
   *
   */
  function refreshSizing() {
    if (isSheetContext) {
      rootFontSize = defaultRootFontSize;
    } else {
      if (accessibilitySizingFactor == 0) {
        if ($view.scale > 0.55) defaultRootFontSize = 14;
        else defaultRootFontSize = 12;
      } else if (accessibilitySizingFactor == 1) {
        if ($view.scale > 0.55) defaultRootFontSize = 16;
        else if ($view.scale > 0.45) defaultRootFontSize = 14;
        else defaultRootFontSize = 13;
      } else if (accessibilitySizingFactor == 2) {
        if ($view.scale > 0.55) defaultRootFontSize = 18;
        else defaultRootFontSize = 16;
      }
      rootFontSize = defaultRootFontSize + 0.6 * $view.scale;
    }

    const dom = document.getElementById(extensionContext + "-root");
    if (extensionContext) {
      if (dom) {
        const shadowRoot = dom.shadowRoot;
        if (!shadowRoot) return;
        const shadowHost = shadowRoot.host as HTMLElement;
        shadowHost.style.fontSize = `${rootFontSize + 20}px`;
        shadowHost.style.setProperty("visibility", "visible", "important");
        if (isInlineExtensionContext) {
          shadowRoot
            .querySelector<HTMLElement>("#plasmo-shadow-container")
            ?.style.setProperty("z-index", "0");
        }
      } else {
        const csui = document.querySelectorAll("plasmo-csui");
        if (csui.length > 0) {
          Array.from(csui).forEach((element) => {
            const htmlElement = element as HTMLElement;
            if (!htmlElement.style.fontSize) {
              htmlElement.style.setProperty(
                "font-size",
                `${rootFontSize + 20}px`,
                "important"
              );
              htmlElement.style.setProperty(
                "visibility",
                "visible",
                "important"
              );
            }
          });
        }
      }
    } else if (!extensionContext) {
      document.documentElement.style.fontSize = `${rootFontSize}px`;
    }
  }

  /**
   *
   * Sending the colorscheme to the parent in embed context.
   *
   * Note: most of the colors are reassigned to new object instead of posting $appearance.colorScheme directly as the original json contains keys which are not accepted by the iOS app.
   */
  function refreshTailwind() {
    fontFamily = typeface + ", " + fallBackTypefaceString;
    if (extensionContext && ref) {
      const element = ref as unknown as HTMLElement;
      element.style.setProperty("--fontFamily-sans-0", fontFamily);
      element.style.fontFamily = fontFamily;
      return;
    }
    document.documentElement.style.setProperty(
      "--fontFamily-sans-0",
      fontFamily
    );
    if ($appearance?.colorScheme)
      postDataToParent(EmbedDataMessage.COLORS, {
        id: $appearance?.colorScheme?.id,
        label: $appearance?.colorScheme?.label,
        isDark: $appearance?.colorScheme?.isDark ?? false,
        theme: $appearance?.colorScheme?.theme ?? "",
        colors: {
          bgs1: $appearance?.colorScheme?.colors.bgs1 ?? "",
          bgs2: $appearance?.colorScheme?.colors.bgs2 ?? "",
          bgs3: $appearance?.colorScheme?.colors.bgs3 ?? "",
          bgs4: $appearance?.colorScheme?.colors.bgs4 ?? "",
          fgs1: $appearance?.colorScheme?.colors.fgs1 ?? "",
          fgs2: $appearance?.colorScheme?.colors.fgs2 ?? "",
          fgs3: $appearance?.colorScheme?.colors.fgs3 ?? "",
          fgs4: $appearance?.colorScheme?.colors.fgs4 ?? "",
          aps1: $appearance?.colorScheme?.colors.aps1 ?? "",
          aps2: $appearance?.colorScheme?.colors.aps2 ?? "",
          aps3: $appearance?.colorScheme?.colors.aps3 ?? "",
          ass1: $appearance?.colorScheme?.colors.ass1 ?? "",
          ass2: $appearance?.colorScheme?.colors.ass2 ?? "",
          ass3: $appearance?.colorScheme?.colors.ass3 ?? "",
          brs1: $appearance?.colorScheme?.colors.brs1 ?? "",
          brs2: $appearance?.colorScheme?.colors.brs2 ?? "",
          brs3: $appearance?.colorScheme?.colors.brs3 ?? ""
        }
      });
  }

  const fontsWithoutTabularSupport = [
    "Albert Sans",
    "Arvo",
    "Comic Neue",
    "Didact Gothic",
    "DM Sans",
    "Lexend",
    "Maven Pro",
    "Oxygen",
    "Parkinsans",
    "Poppins",
    "Quicksand"
  ];
  const fontsToEnlargeNumbersForGrid = ["Sen"];
  const fontsWithNoisyGridNumbers = ["Albert Sans","DM Sans","Space Grotesk", "Twenty One Native"];

  function resolveNumberTypeface(typeface: string) {
    if (fontsWithoutTabularSupport.includes(typeface))
      return "Twenty One Native, Sen, Hanken Grotesk, system-ui, sans-serif";
    else return typeface;
  }

  function resolveNumberGridSize(typeface: string) {
    if (
      fontsToEnlargeNumbersForGrid.includes(typeface) ||
      fontsWithNoisyGridNumbers.includes(typeface)
    )
      return "0.9rem";
    else return "0.85rem";
  }

  function resolveNumberGridTypeface(typeface: string) {
    if (fontsWithNoisyGridNumbers.includes(typeface))
      return "Sen, Hanken Grotesk, system-ui, sans-serif";
    else return typeface;
  }
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link
    rel="preconnect"
    href="https://fonts.gstatic.com"
    crossorigin="anonymous"
  />
  <link href={generateGoogleFontsUrl()} rel="stylesheet" />
</svelte:head>

<!--Note: The font weight and tracking corrections are applied for each typeface. Space Grotesk is falling back to next available typeface if font-normal (or 400) is used. For some reason, 401 and beyond is working fine. -->
<div
  bind:this={ref}
  id={extensionContext ? "nthemeclipper" : "ntheme"}
  class={cn("flex h-full w-full", {
    "tracking-[0.01em]": typeface === "Hanken Grotesk",
    "font-[350]": typeface === "Sora",
    "font-[401]": typeface === "Space Grotesk",
    "font-[500]": typeface === "Quicksand",
    glassy: $userPreferences?.appearance?.skin == AppSkin.Glassy,
    dark: $appearance?.colorScheme?.isDark
  })}
  style:--number-typeface={resolveNumberTypeface(typeface)}
  style:--number-grid-size={resolveNumberGridSize(typeface)}
  style:--number-grid-typeface={resolveNumberGridTypeface(typeface)}
>
  <ColorLayer>
    {@render children?.()}
  </ColorLayer>
  <GlassSkin />
</div>

<style>
  /* TODO  - clipper case - the need for below typeface settings  */

  #nthemeclipper {
    font-family:
      SenVariable,
      Sen,
      Space Grotesk,
      Sora,
      Hanken Grotesk,
      system-ui,
      -apple-system,
      sans-serif !important;
  }
  /* .glass {
    background-image: url(back.png);
  } */

  :root {
    --number-fallback-typeface:
      Twenty One Native, Sen, Hanken Grotesk, system-ui, sans-serif;
    --number-grid-fallback-typeface: Sen, Hanken Grotesk, system-ui, sans-serif;
  }

  /**
  * Adds support for typefaces that doesn't have tabular support for numbers
  */
  :global(.tabular-nums) {
    font-variant-numeric: tabular-nums;
    font-family: var(--number-typeface, var(--number-fallback-typeface));
  }

  /**
  * Adds support for typefaces that has noise when the numbers are arranged in a grid like in Calendar view or date picker.
  */
  :global(.number-grid-size) {
    font-size: var(--number-grid-size, 1) !important;
    font-family: var(
      --number-grid-typeface,
      var(--number-grid-fallback-typeface)
    );
  }

  .glassylavendar {
    background: linear-gradient(
      to left bottom,
      rgb(165, 180, 252),
      rgb(192, 132, 252)
    );
  }
  .glassytest {
    background: linear-gradient(
      to left bottom,
      rgb(17, 24, 39),
      rgb(75, 85, 99)
    );
  }
  .glassysoftmetal {
    background: conic-gradient(
      at left bottom,
      rgb(199, 210, 254),
      rgb(71, 85, 105),
      rgb(199, 210, 254)
    );
  }
  .glassyice {
    background: linear-gradient(
      to left bottom,
      rgb(255, 228, 230),
      rgb(204, 251, 241)
    );
  }
  .glassypowerpuff {
    background: linear-gradient(
      to left bottom,
      rgb(56, 189, 248),
      rgb(251, 113, 133),
      rgb(163, 230, 53)
    );
  }
  .glassymidnight {
    background: linear-gradient(
      to left bottom,
      rgb(29, 78, 216),
      rgb(30, 64, 175),
      rgb(17, 24, 39)
    );
  }
  .glassysunset {
    background: linear-gradient(
      to right top,
      rgb(199, 210, 254),
      rgb(254, 202, 202),
      rgb(254, 249, 195)
    );
  }
  .glassygunmetal {
    background: linear-gradient(
      to left bottom,
      rgb(229, 231, 235),
      rgb(156, 163, 175),
      rgb(75, 85, 99)
    );
  }
  .glassygotham {
    background: linear-gradient(
      to right top,
      rgb(55, 65, 81),
      rgb(17, 24, 39),
      rgb(0, 0, 0)
    );
  }
  .glassy5 {
    /* Created with https://www.css-gradient.com */
    background: #1c684e;
    background: -webkit-linear-gradient(top left, #1c684e, #76c574);
    background: -moz-linear-gradient(top left, #1c684e, #76c574);
    background: linear-gradient(to bottom right, #1c684e, #76c574);
  }
  .glassyblue {
    /* https://www.css-gradient.com/?c1=4facaf&c2=3c3263&gt=l&gd=dtr */
    background: #4facaf;
    background: -webkit-linear-gradient(top right, #4facaf, #3c3263);
    background: -moz-linear-gradient(top right, #4facaf, #3c3263);
    background: linear-gradient(to bottom left, #4facaf, #3c3263);
  }

  .glassyrainbow {
    /* Created with https://www.css-gradient.com */
    background: #3c98a8;
    background: -webkit-linear-gradient(bottom left, #3c98a8, #d700ae);
    background: -moz-linear-gradient(bottom left, #3c98a8, #d700ae);
    background: linear-gradient(to top right, #3c98a8, #d700ae);
  }
  .glassy4old {
    /* https://www.css-gradient.com/?c1=8a8397&c2=11858a&gt=l&gd=dbl */
    background: #8a8397;
    background: -webkit-linear-gradient(bottom left, #8a8397, #11858a);
    background: -moz-linear-gradient(bottom left, #8a8397, #11858a);
    background: linear-gradient(to top right, #8a8397, #11858a);
  }
  .glassy4 {
    /* https://www.css-gradient.com/?c1=8a8397&c2=11858a&gt=l&gd=dbl */
    background: #11858a;
    background: -webkit-linear-gradient(bottom left, #11858a, #8a8397);
    background: -moz-linear-gradient(bottom left, #11858a, #8a8397);
    background: linear-gradient(to top right, #11858a, #8a8397);
  }
  .glassygreeny {
    /* https://www.css-gradient.com/?c1=246773&c2=969e53&gt=l&gd=dbl */
    background: #246773;
    background: -webkit-linear-gradient(bottom left, #246773, #969e53);
    background: -moz-linear-gradient(bottom left, #246773, #969e53);
    background: linear-gradient(to top right, #246773, #969e53);
  }
  .glassygreenlight {
    /* light */
    /* https://www.css-gradient.com/?c1=c8cbe6&c2=8afdbc&gt=l&gd=dbl */
    /* Created with https://www.css-gradient.com */
    background: #c8cbe6;
    background: -webkit-linear-gradient(bottom left, #c8cbe6, #8afdbc);
    background: -moz-linear-gradient(bottom left, #c8cbe6, #8afdbc);
    background: linear-gradient(to top right, #c8cbe6, #8afdbc);
  }
  .glassy7 {
    /* https://www.css-gradient.com/?c1=f63251&c2=eaac89&gt=l&gd=dbl */
    /* Created with https://www.css-gradient.com */
    background: #f63251;
    background: -webkit-linear-gradient(bottom left, #f63251, #eaac89);
    background: -moz-linear-gradient(bottom left, #f63251, #eaac89);
    background: linear-gradient(to top right, #f63251, #eaac89);
  }
</style>
