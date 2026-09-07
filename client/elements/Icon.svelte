<script lang="ts">
  import Settings from "@21n/icons/Settings.svelte";
  import PieChart from "@21n/icons/PieChart.svelte";
  import Bolt from "@21n/icons/Bolt.svelte";
  import Home from "@21n/icons/Home.svelte";
  import Stack from "@21n/icons/Stack.svelte";
  import { ChatIconVariant, IconVariant } from "@21n/types/icon.type";
  import ChevronDouble from "@21n/icons/ChevronDouble.svelte";
  import { Placement, Orientation } from "@21n/types/direction.enum";
  import { Size } from "@21n/types/size.enum";
  import Command from "@21n/icons/Command.svelte";
  import Chevron from "@21n/icons/Chevron.svelte";
  import Clock from "@21n/icons/Clock.svelte";
  import Bell from "@21n/icons/Bell.svelte";
  import Swatch from "@21n/icons/Swatch.svelte";
  import Cube from "@21n/icons/Cube.svelte";
  import Data from "@21n/icons/Data.svelte";
  import AcademicCap from "@21n/icons/AcademicCap.svelte";
  import Chat from "@21n/icons/Chat.svelte";
  import List from "@21n/icons/List.svelte";
  import Widget from "@21n/icons/Widget.svelte";
  import Fire from "@21n/icons/Fire.svelte";
  import Arrow from "@21n/icons/Arrow.svelte";
  import Plus from "@21n/icons/Plus.svelte";
  import Cross from "@21n/icons/Cross.svelte";
  import Trash from "@21n/icons/Trash.svelte";
  import Music from "@21n/icons/Music.svelte";
  import Pencil from "@21n/icons/Pencil.svelte";
  import Play2 from "@21n/icons/Play2.svelte";
  import ArrowsPointingOut from "@21n/icons/ArrowsPointingOut.svelte";
  import ArrowsPointingIn from "@21n/icons/ArrowsPointingIn.svelte";
  import Minus from "@21n/icons/Minus.svelte";
  import History from "@21n/icons/History.svelte";
  import Code from "@21n/icons/Code.svelte";
  import BarChart from "@21n/icons/BarChart.svelte";
  import LineChart from "@21n/icons/LineChart.svelte";
  import AreaChart from "@21n/icons/AreaChart.svelte";
  import Folder from "@21n/icons/Folder.svelte";
  import SidebarToggle from "@21n/icons/SidebarToggle.svelte";
  import Info from "@21n/icons/Info.svelte";
  import Link from "@21n/icons/Link.svelte";
  import Tag from "@21n/icons/Tag.svelte";
  import Image from "@21n/icons/Image.svelte";
  import Share from "@21n/icons/Share.svelte";
  import Users from "@21n/icons/Users.svelte";
  import Copy from "@21n/icons/Copy.svelte";
  import ArrowPath from "@21n/icons/ArrowPath.svelte";
  import Sun from "@21n/icons/Sun.svelte";
  import Heart from "@21n/icons/Heart.svelte";
  import Rocket from "@21n/icons/Rocket.svelte";
  import Archive from "@21n/icons/Archive.svelte";
  import Search from "@21n/icons/Search.svelte";
  import Ellipsis from "@21n/icons/Ellipsis.svelte";
  import Upload from "@21n/icons/Upload.svelte";
  import Bars from "@21n/icons/Bars.svelte";
  import Squares from "@21n/icons/Squares.svelte";
  import Pomodoro from "@21n/icons/Pomodoro.svelte";
  import Download from "@21n/icons/Download.svelte";
  import Bookmark from "@21n/icons/Bookmark.svelte";
  import Pause from "@21n/icons/Pause.svelte";
  import Adjustments from "@21n/icons/Adjustments.svelte";
  import Pip from "@21n/icons/Pip.svelte";
  import Zen from "@21n/icons/Zen.svelte";
  import Envelope from "@21n/icons/Envelope.svelte";
  import Youtube from "@21n/branding/external/logos/Youtube.svelte";
  import Google from "@21n/branding/external/logos/Google.svelte";
  import Apple from "@21n/branding/external/logos/Apple.svelte";
  import VideoCamera from "@21n/icons/VideoCamera.svelte";
  import QuestionMarkCircle from "@21n/icons/QuestionMarkCircle.svelte";
  import Calendar from "@21n/icons/Calendar.svelte";
  import CalendarDays from "@21n/icons/CalendarDays.svelte";
  import LightBulb from "@21n/icons/LightBulb.svelte";
  import Node from "@21n/icons/Node.svelte";
  import Curation from "@21n/icons/Curation.svelte";
  import Capture from "@21n/icons/Capture.svelte";
  import CheckTwo from "@21n/icons/CheckTwo.svelte";
  import Unpin from "@21n/icons/Unpin.svelte";
  import Microphone from "@21n/icons/Microphone.svelte";
  import Camera from "@21n/icons/Camera.svelte";
  import BarsCenterLeft from "@21n/icons/BarsCenterLeft.svelte";
  import CubeTransparent from "@21n/icons/CubeTransparent.svelte";
  import Stop from "@21n/icons/Stop.svelte";
  import Sparkles from "@21n/icons/Sparkles.svelte";
  import Map from "@21n/icons/Map.svelte";
  import Flag from "@21n/icons/Flag.svelte";
  import LockClosed from "@21n/icons/LockClosed.svelte";
  import Megaphone from "@21n/icons/Megaphone.svelte";
  import Star from "@21n/icons/Star.svelte";
  import FaceSmile from "@21n/icons/FaceSmile.svelte";
  import Grab from "@21n/icons/Grab.svelte";
  import Capture2 from "@21n/icons/Capture2.0.svelte";
  import QueueList from "@21n/icons/QueueList.svelte";
  import AtSymbol from "@21n/icons/AtSymbol.svelte";
  import BookOpen from "@21n/icons/BookOpen.svelte";
  import Square3Stack3d from "@21n/icons/Square3Stack3d.svelte";
  import TableCells from "@21n/icons/TableCells.svelte";
  import GlobeAlt from "@21n/icons/GlobeAlt.svelte";
  import DocumentText from "@21n/icons/DocumentText.svelte";
  import Funnel from "@21n/icons/Funnel.svelte";
  import PaperClip from "@21n/icons/PaperClip.svelte";
  import Eye from "@21n/icons/Eye.svelte";
  import AltText from "@21n/icons/AltText.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import Gift from "@21n/icons/Gift.svelte";
  import LinkArrow2 from "@21n/icons/LinkArrow2.svelte";
  import Pin from "@21n/icons/Pin.svelte";
  import UnWiden from "@21n/icons/UnWiden.svelte";
  import Widen from "@21n/icons/Widen.svelte";
  import Split from "@21n/icons/Split.svelte";
  import ArrowRightLeft from "@21n/icons/ArrowRightLeft.svelte";
  import ArrowUTurnLeft from "@21n/icons/ArrowUTurnLeft.svelte";
  import Warning from "@21n/icons/Warning.svelte";
  import ArrowTurnDownLeft from "@21n/icons/ArrowTurnDownLeft.svelte";
  import CursorArrowRays from "@21n/icons/CursorArrowRays.svelte";
  import Document from "@21n/icons/Document.svelte";
  import MagnifyingGlassPlus from "@21n/icons/MagnifyingGlassPlus.svelte";
  import MagnifyingGlassMinus from "@21n/icons/MagnifyingGlassMinus.svelte";
  import Underline from "@21n/icons/Underline.svelte";
  import Strikethrough from "@21n/icons/Strikethrough.svelte";
  import Highlight from "@21n/icons/Highlight.svelte";
  // import IconifyIcon from "@iconify/svelte";
  import { logger } from "@nucleum/components/debug/logger.client";
  import { isExtensionEnvironment } from "@21n/utils/browser.utils";
  import Crop from "@21n/icons/Crop.svelte";
  import PencilSimpleLine from "@21n/icons/PencilSimpleLine.svelte";
  import Highlighter from "@21n/icons/Highlighter.svelte";
  import PhCrossCircled from "@21n/icons/PhCrossCircled.svelte";
  import PhBookmarks from "@21n/icons/PhBookmarks.svelte";
  import PhArrowElbow from "@21n/icons/PhArrowElbow.svelte";
  import {
    resolveSpriteSheetPath,
    extensionSprites,
    resolveGenericIcon
  } from "@21n/icons-v2/icon.store";
  import { iconMappings } from "@21n/icons-v2/icons.map";
  import SvgSpinnerIcon from "@21n/icons-v2/svgSpinners/SvgSpinnerIcon.svelte";
  import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";

  let {
    icon = undefined,
    id = generateSimpleRandomId(),
    size = Size.md,
    isAccentBgContext = undefined,
    isCustomBgContext = undefined,
    isTabbable = false,
    isFilled = false,
    onclick = void 0,
    class: classListParam = ""
  }: any = $props();
  const resolvedIcon = $derived(icon ? resolveIconName(icon) : undefined);
  const renderedIconifyIcon = $derived(
    resolveRenderedIconForIconify(resolvedIcon, isFilled)
  );

  function resolveIconName(iconName: string): string {
    // If the icon name exists in our generic mappings, resolve it
    if (iconMappings[iconName]) {
      return resolveGenericIcon(iconName);
    }

    // Otherwise return the original icon name (for legacy support)
    return iconName;
  }

  let dev_useIconifyTailwind = false;
  let isUseIconifySprite = true;
  const _classList = $derived(
    resolveClasses(classListParam, isAccentBgContext, isCustomBgContext)
  );
  const variant = $derived(resolveVariant(resolvedIcon, _classList, size));
  const solidOnlyIcons = [
    "chevdoubleleft",
    "chevdoubleright",
    "history",
    "pip",
    "logout",
    "link",
    "google",
    "apple",
    "grab",
    "capture2.0-mini"
  ];
  const strokeOnlyIcons = [
    "link-arrow-left",
    "link-arrow-down",
    "capture",
    "highlight"
  ];

  function resolveClasses(
    clParam: string,
    isAbgContext: boolean | undefined,
    isCuBgContext: boolean | undefined
  ) {
    let classes = "stroke-fgs2";
    if (isAbgContext !== undefined) {
      classes = isAbgContext ? "fill-abg" : "stroke-fgs2";
    } else if (isCuBgContext !== undefined) {
      classes = isCuBgContext ? "fill-cbg" : "stroke-fgs2";
    } else if (clParam) {
      classes = clParam;
    }
    if (
      resolvedIcon &&
      (solidOnlyIcons.includes(resolvedIcon) ||
        resolvedIcon?.includes("-mini")) &&
      classes.includes("stroke-")
    ) {
      const color = classes.split("stroke-")[1];
      classes = `fill-${color}`;
    } else if (
      resolvedIcon &&
      strokeOnlyIcons.includes(resolvedIcon) &&
      classes.includes("fill-")
    ) {
      const color = classes.split("fill-")[1];
      classes = `stroke-${color}`;
    }
    classes = classes + appendIconfiyClasses(classes);
    if (classes.includes("stroke-")) {
      classes = classes + " fill-none";
    } else if (classes.includes("fill-")) {
      classes = classes + " stroke-none";
    }
    return classes;

    function appendIconfiyClasses(classes: string) {
      if (resolvedIcon?.includes(":")) {
        const color = classes.split("stroke-")[1] || classes.split("fill-")[1];
        if (color) return ` text-${color}`;
      }
      return "";
    }
  }
  function resolveVariant(icon: string | undefined, cls: string, size: Size) {
    if (
      (icon && solidOnlyIcons.includes(icon)) ||
      icon?.includes("-mini") ||
      size === Size.xs
    ) {
      return IconVariant.Solid;
    } else {
      return cls.includes("fill-none")
        ? IconVariant.Outline
        : IconVariant.Solid;
    }
  }

  function resolveRenderedIconForIconify(
    icon: string | undefined,
    isFilled: boolean
  ) {
    if (!icon || !icon.includes(":") || icon.includes("text:")) {
      return undefined;
    }
    let renderedIcon = icon;
    if (icon.startsWith("fa6-brands") || icon.startsWith("lets-icons")) {
      renderedIcon = icon;
    } else if (icon.startsWith("ph:")) {
      if (icon.endsWith("-light")) {
        renderedIcon = isFilled ? icon.replace("-light", "-duotone") : icon;
      } else if (icon.endsWith("-thin")) {
        renderedIcon = isFilled ? icon.replace("-thin", "-duotone") : icon;
      } else if (!icon.endsWith("-fill")) {
        renderedIcon = isFilled ? icon + "-fill" : icon;
      }
    } else if (icon.startsWith("solar:")) {
      if (icon.endsWith("-linear")) {
        renderedIcon = isFilled ? icon.replace("-linear", "-bold") : icon;
      } else if (icon.endsWith("-line-duotone")) {
        renderedIcon = isFilled
          ? icon.replace("-line-duotone", "-bold-duotone")
          : icon;
      }
    } else if (icon.startsWith("heroicons:")) {
      renderedIcon = isFilled ? icon + "-solid" : icon;
    } else if (icon.startsWith("mynaui:")) {
      renderedIcon = isFilled ? icon + "-solid" : icon;
    }
    if (dev_useIconifyTailwind) {
      renderedIcon = renderedIcon.replace(":", "--");
    }
    return renderedIcon;
  }

  function resolveSpriteIconPath(iconName: string) {
    let sheet = "sprite";
    if (iconName.startsWith("ph:")) {
      if (iconName.endsWith("-light")) {
        sheet = "sprite-ph-light";
      } else if (iconName.endsWith("-fill")) {
        sheet = "sprite-ph-fill";
      } else if (iconName.endsWith("-thin")) {
        sheet = "sprite-ph-thin";
      } else if (iconName.endsWith("-duotone")) {
        sheet = "sprite-ph-duotone";
      } else {
        sheet = "sprite-ph-base";
      }
    } else if (iconName.startsWith("lucide:")) {
      sheet = "sprite-lucide-base";
    } else if (iconName.startsWith("solar:")) {
      if (iconName.endsWith("-linear")) {
        sheet = "sprite-solar-linear";
      } else if (iconName.endsWith("-bold")) {
        sheet = "sprite-solar-bold";
      } else if (iconName.endsWith("-line-duotone")) {
        sheet = "sprite-solar-line-duotone";
      } else if (iconName.endsWith("-bold-duotone")) {
        sheet = "sprite-solar-bold-duotone";
      } else {
        sheet = "sprite-solar-base";
      }
    }
    const path = resolveSpriteSheetPath(sheet);
    if (isExtensionEnvironment()) {
      // if (!isContentScript()) {
      //   const url = `${path}#${iconName}`;
      //   return chrome.runtime.getURL(url);
      // }
      if (extensionSprites.has(sheet)) {
        const sprite = extensionSprites.get(sheet);
        return `${sprite}#${iconName}`;
      }
      return null;
    }
    return `${path}#${iconName}`;
  }
</script>

{#snippet iconContent()}
  {#if resolvedIcon?.includes(":") && renderedIconifyIcon}
    {@const sizeClass =
      size === Size.xxl
        ? "w-12 h-12"
        : size === Size.xl
          ? "w-7 h-7"
          : size === Size.lg
            ? "w-6 h-6"
            : size === Size.md
              ? "w-5 h-5"
              : size === Size.sm
                ? "w-4 h-4"
                : size === Size.xs
                  ? "w-3 h-3"
                  : "w-2 h-2"}
    {#if resolvedIcon.startsWith("svg-spinners")}
      <div class={cn(_classList, "iconifysvg", sizeClass, renderedIconifyIcon)}>
        <SvgSpinnerIcon icon={resolvedIcon} />
      </div>
    {:else if isUseIconifySprite}
      <svg class={cn(_classList, "iconifysvg", sizeClass)}>
        <use href={resolveSpriteIconPath(renderedIconifyIcon)} />
      </svg>
    {:else if dev_useIconifyTailwind}
      <span class="iconify text-fgs1 {renderedIconifyIcon} w-5 h-5"></span>
    {:else}
      <!-- <div
        class={cn(renderedIconifyIcon, {
          "w-14 h-14": size === Size.xxl,
          "w-8 h-8": size === Size.xl,
          "w-6 h-6": size === Size.lg,
          "w-[1.25rem] h-[1.25rem]": size === Size.md,
          "w-4 h-4": size === Size.sm,
          "w-3 h-3": size === Size.xs
        })}
      >
        <IconifyIcon
      icon={renderedIconifyIcon}
      width={sizePx}
      height={sizePx}
      class={_classList + " iconifysvg "}
    />
      </div> -->
    {/if}
  {:else if resolvedIcon?.includes("text:")}
    {@const sizeClass =
      size === Size.xxl
        ? "w-12 h-12"
        : size === Size.xl
          ? "w-7 h-7"
          : size === Size.lg
            ? "w-6 h-6"
            : size === Size.md
              ? "w-5 h-5"
              : "w-4 h-4"}
    <span
      class={cn(
        _classList,
        "iconifysvg flex items-center justify-center",
        sizeClass
      )}
    >
      {resolvedIcon.split("text:")[1]}
    </span>
  {:else if resolvedIcon}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={resolvedIcon.includes("-mini") &&
      resolvedIcon !== "capture2.0-mini"
        ? "0 0 20 20"
        : resolvedIcon == "capture2.0" || resolvedIcon === "capture2.0-mini"
          ? "0 0 52 52"
          : "0 0 24 24"}
      class={cn(
        "flex items-center justify-center",
        _classList,
        {
          "w-3 h-3": resolvedIcon.includes("-mini")
        },
        !resolvedIcon.includes("-mini") && {
          "w-8 h-8": size === Size.xl,
          "w-6 h-6": size === Size.lg,
          "w-[1.25rem] h-[1.25rem]": size === Size.md,
          "w-4 h-4": size === Size.sm,
          "w-3 h-3": size === Size.xs
        }
      )}
    >
      {#if icon === "home"}
        <Home {variant} />
      {:else if icon === "bolt"}
        <Bolt {variant} />
      {:else if icon === "bolt-micro"}
        <Bolt variant={IconVariant.Micro} />
      {:else if icon === "chart"}
        <PieChart {variant} />
      {:else if icon === "barchart"}
        <BarChart {variant} />
      {:else if icon === "barchart-presentation"}
        <BarChart {variant} style="presentation" />
      {:else if icon === "areachart"}
        <AreaChart {variant} />
      {:else if icon === "linechart"}
        <LineChart {variant} />
      {:else if icon === "settings"}
        <Settings {variant} />
      {:else if icon === "rectangle-stack" || icon === "goals"}
        <Stack {variant} />
      {:else if icon === "command"}
        <Command {variant} />
      {:else if icon === "sidebar-toggle"}
        <SidebarToggle {variant} />
      {:else if icon === "info"}
        <Info {variant} />
      {:else if icon === "warning"}
        <Warning {variant} />
      {:else if icon === "link"}
        <Link />
      {:else if icon === "link-mini"}
        <Link variant={IconVariant.Mini} />
      {:else if icon === "tag"}
        <Tag {variant} />
      {:else if icon === "share"}
        <Share {variant} />
      {:else if icon === "share-mini"}
        <Share variant={IconVariant.Mini} />
      {:else if icon === "users"}
        <Users {variant} />
      {:else if icon === "copy"}
        <Copy {variant} />
      {:else if icon === "arrow-path" || icon === "sync"}
        <ArrowPath {variant} />
      {:else if icon === "sun"}
        <Sun {variant} />
      {:else if icon === "clock"}
        <Clock {variant} />
      {:else if icon === "clock-mini"}
        <Clock variant={IconVariant.Mini} />
      {:else if icon === "folder"}
        <Folder {variant} />
      {:else if icon === "history"}
        <History {variant} />
      {:else if icon === "code"}
        <Code {variant} />
      {:else if icon === "bell"}
        <Bell {variant} />
      {:else if icon === "palette"}
        <Swatch {variant} />
      {:else if icon === "cube"}
        <Cube {variant} />
      {:else if icon === "cube-transparent"}
        <CubeTransparent {variant} />
      {:else if icon === "data"}
        <Data {variant} />
      {:else if icon === "list"}
        <List {variant} />
      {:else if icon === "rectangle-group" || icon === "widget"}
        <Widget {variant} />
      {:else if icon === "fire"}
        <Fire {variant} />
      {:else if icon === "music"}
        <Music {variant} />
      {:else if icon === "pencil"}
        <Pencil {variant} />
      {:else if icon === "pencil-mini"}
        <Pencil variant={IconVariant.Mini} />
      {:else if icon === "pencil-square"}
        <Pencil {variant} isWithSquare={true} />
      {:else if icon === "play"}
        <Play2 {variant} />
      {:else if icon === "play-circled"}
        <Play2 {variant} isCircled={true} />
      {:else if icon === "play-circled-mini"}
        <Play2 variant={IconVariant.Mini} isCircled={true} />
      {:else if icon === "plus"}
        <Plus {variant} isCircled={false} />
      {:else if icon === "plus-circled"}
        <Plus {variant} isCircled={true} />
      {:else if icon === "minus"}
        <Minus {variant} isCircled={false} />
      {:else if icon === "minus-circled"}
        <Minus {variant} isCircled={true} />
      {:else if icon === "unpin"}
        <Unpin />
      {:else if icon === "pin"}
        <Pin />
      {:else if icon === "cross-circled"}
        <Cross {variant} isCircled={true} />
      {:else if icon === "cross"}
        <Cross {variant} isCircled={false} />
      {:else if icon === "cross-mini"}
        <Cross isCircled={false} variant={IconVariant.Mini} />
      {:else if icon === "trash"}
        <Trash {variant} />
      {:else if icon === "pause"}
        <Pause {variant} />
      {:else if icon === "chatleftright"}
        <Chat {variant} chatIconVariant={ChatIconVariant.LeftRight} />
      {:else if icon === "chat-bubble-bottom-center"}
        <Chat {variant} chatIconVariant={ChatIconVariant.BottomCenter} />
      {:else if icon === "academic-cap"}
        <AcademicCap {variant} />
      {:else if icon === "chevleft"}
        <Chevron direction={Placement.Left} />
      {:else if icon === "chevright"}
        <Chevron direction={Placement.Right} />
      {:else if icon === "chevdown"}
        <Chevron direction={Placement.Bottom} />
      {:else if icon === "chevup"}
        <Chevron direction={Placement.Top} />
      {:else if icon === "download"}
        <Download {variant} />
      {:else if icon === "arrow-left"}
        <Arrow direction={Placement.Left} />
      {:else if icon === "arrow-right"}
        <Arrow direction={Placement.Right} />
      {:else if icon === "arrow-up"}
        <Arrow direction={Placement.Top} />
      {:else if icon === "arrow-down"}
        <Arrow direction={Placement.Bottom} />
      {:else if icon === "arrow-down-right"}
        <Arrow direction={Placement.BottomRight} />
      {:else if icon === "arrow-down-left"}
        <Arrow direction={Placement.BottomLeft} />
      {:else if icon === "arrow-up-right"}
        <Arrow direction={Placement.TopRight} {variant} />
      {:else if icon === "arrow-up-right-mini"}
        <Arrow direction={Placement.TopRight} variant={IconVariant.Mini} />
      {:else if icon === "arrow-down-right-mini"}
        <Arrow direction={Placement.BottomRight} variant={IconVariant.Mini} />
      {:else if icon === "arrow-right-circled"}
        <Arrow direction={Placement.Right} isCircled={true} {variant} />
      {:else if icon === "arrow-right-circled-mini"}
        <Arrow
          direction={Placement.Right}
          isCircled={true}
          variant={IconVariant.Mini}
        />
      {:else if icon === "arrow-right-mini"}
        <Arrow direction={Placement.Right} variant={IconVariant.Mini} />
      {:else if icon === "full-screen"}
        <ArrowsPointingOut {variant} />
      {:else if icon === "collapse"}
        <ArrowsPointingIn {variant} />
      {:else if icon === "arrow-right-left"}
        <ArrowRightLeft {variant} />
      {:else if icon === "arrow-uturn-left"}
        <ArrowUTurnLeft {variant} />
      {:else if icon === "arrow-turn-down-left"}
        <ArrowTurnDownLeft {variant} />
      {:else if icon === "widen"}
        <Widen />
      {:else if icon === "unwiden"}
        <UnWiden />
      {:else if icon === "split"}
        <Split />
      {:else if icon === "collapse"}
        <ArrowsPointingIn {variant} />
      {:else if icon === "chevdoubleleft"}
        <ChevronDouble direction={Placement.Left} />
      {:else if icon === "chevdoubleright"}
        <ChevronDouble direction={Placement.Right} />
      {:else if icon === "search" && size != Size.xs}
        <Search {variant} />
      {:else if icon === "search" && size === Size.xs}
        <Search variant={IconVariant.Mini} />
      {:else if icon === "heart"}
        <Heart {variant} />
      {:else if icon === "rocket"}
        <Rocket {variant} />
      {:else if icon === "upload"}
        <Upload {variant} />
      {:else if icon === "archive"}
        <Archive {variant} />
      {:else if icon === "image"}
        <Image {variant} />
      {:else if icon === "ellipsis"}
        <Ellipsis orientation={Orientation.Horizontal} />
      {:else if icon === "ellipsis-vertical"}
        <Ellipsis orientation={Orientation.Vertical} />
      {:else if icon === "ellipsis-circled"}
        <Ellipsis orientation={Orientation.Horizontal} isCircled={true} />
      {:else if icon === "bars"}
        <Bars {variant} />
      {:else if icon === "bars-center-left"}
        <BarsCenterLeft {variant} />
      {:else if icon === "squares-2x2"}
        <Squares {variant} />
      {:else if icon === "pomodoro"}
        <Pomodoro {variant} />
      {:else if icon === "bookmark"}
        <Bookmark {variant} />
      {:else if icon === "pip"}
        <Pip {variant} />
      {:else if icon === "zen"}
        <Zen {variant} />
      {:else if icon === "adjustments-vertical"}
        <Adjustments {variant} orientation={Orientation.Vertical} />
      {:else if icon === "adjustments-horizontal"}
        <Adjustments {variant} orientation={Orientation.Horizontal} />
      {:else if icon === "envelope" || icon === "mail"}
        <Envelope {variant} />
      {:else if icon === "google"}
        <Google />
      {:else if icon === "youtube"}
        <Youtube />
      {:else if icon === "apple"}
        <Apple />
      {:else if icon === "video-camera"}
        <VideoCamera {variant} />
      {:else if icon === "help"}
        <QuestionMarkCircle {variant} />
      {:else if icon === "help-mini"}
        <QuestionMarkCircle variant={IconVariant.Mini} />
      {:else if icon === "calendar"}
        <Calendar {variant} />
      {:else if icon === "calendar-days" || icon === "journal"}
        <CalendarDays {variant} />
      {:else if icon === "light-bulb"}
        <LightBulb {variant} />
      {:else if icon === "node"}
        <Node {variant} />
      {:else if icon === "curation"}
        <Curation {variant} />
      {:else if icon === "capture"}
        <Capture />
      {:else if icon === "capture2.0"}
        <Capture2 {variant} />
      {:else if icon === "check-circle"}
        <CheckTwo {variant} isCircled={true} />
      {:else if icon === "microphone"}
        <Microphone {variant} />
      {:else if icon === "camera"}
        <Camera {variant} />
      {:else if icon === "stop"}
        <Stop {variant} />
      {:else if icon === "sparkles"}
        <Sparkles {variant} />
      {:else if icon === "map"}
        <Map {variant} />
      {:else if icon === "flag"}
        <Flag {variant} />
      {:else if icon === "lock-closed"}
        <LockClosed {variant} />
      {:else if icon === "megaphone"}
        <Megaphone {variant} />
      {:else if icon === "star"}
        <Star {variant} />
      {:else if icon === "face-smile"}
        <FaceSmile {variant} />
      {:else if icon === "grab"}
        <Grab {variant} />
      {:else if icon === "queue-list"}
        <QueueList {variant} />
      {:else if icon === "at-symbol"}
        <AtSymbol {variant} />
      {:else if icon === "book-open"}
        <BookOpen {variant} />
      {:else if icon === "square-3-stack-3d"}
        <Square3Stack3d {variant} />
      {:else if icon === "table-cells"}
        <TableCells {variant} />
      {:else if icon === "globe-alt"}
        <GlobeAlt {variant} />
      {:else if icon === "document"}
        <Document {variant} />
      {:else if icon === "document-text"}
        <DocumentText {variant} />
      {:else if icon === "funnel"}
        <Funnel {variant} />
      {:else if icon === "paper-clip"}
        <PaperClip {variant} />
      {:else if icon === "eye" || icon === "bird"}
        <Eye {variant} />
      {:else if icon === "alt-text"}
        <AltText />
      {:else if icon === "gift"}
        <Gift {variant} />
      {:else if icon === "crop"}
        <Crop {variant} />
      {:else if icon === "edit"}
        <PencilSimpleLine {variant} />
      {:else if icon === "highlighter"}
        <Highlighter {variant} />
      {:else if icon === "x-circle"}
        <PhCrossCircled {variant} />
      {:else if icon === "bookmarks"}
        <PhBookmarks {variant} />
      {:else if icon === "arrow-elbow-down-left"}
        <PhArrowElbow variant="down-left" />
      {:else if icon === "arrow-elbow-right-up"}
        <PhArrowElbow variant="right-up" />
      {:else if icon === "magnifying-glass-plus"}
        <MagnifyingGlassPlus {variant} />
      {:else if icon === "magnifying-glass-minus"}
        <MagnifyingGlassMinus {variant} />
      {:else if icon === "underline"}
        <Underline {variant} />
      {:else if icon === "strikethrough"}
        <Strikethrough {variant} />
      {:else if icon === "highlight"}
        <Highlight />
      {:else if icon === "cursor-arrow-rays"}
        <CursorArrowRays {variant} />
      {:else if icon === "link-arrow-left"}
        <LinkArrow2 />
      {:else if icon === "link-arrow-down"}
        <LinkArrow2 direction={Placement.Bottom} />
      {:else if icon === "login"}
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
        />
      {:else if icon === "logout"}
        <path
          fill-rule="evenodd"
          d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm10.72 4.72a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h10.94l-1.72-1.72a.75.75 0 010-1.06z"
          clip-rule="evenodd"
        />
      {/if}
    </svg>
  {/if}
{/snippet}

{#if onclick || isTabbable}
  <button
    {id}
    class={cn("relative inline-flex items-center justify-center")}
    tabindex={isTabbable ? 0 : -1}
    {onclick}
  >
    {@render iconContent()}
  </button>
{:else}
  <span
    {id}
    class={cn("relative inline-flex items-center justify-center")}
    aria-hidden="true"
  >
    {@render iconContent()}
  </span>
{/if}

<style>
  :global(.iconifysvg *) {
    stroke-width: initial !important;
  }
</style>
