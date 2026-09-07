<script lang="ts">
  import Email from "@21n/icons/Email.svelte";
  import Link from "@21n/icons/Link.svelte";
  import Web from "@21n/icons/Web.svelte";
  import Phone from "@21n/icons/Phone.svelte";
  import { IdentityProvider } from "@nucleum/client/runtime/account/oauth.type";
  import Behance from "@21n/branding/external/logos/Behance.svelte";
  import Dribbble from "@21n/branding/external/logos/Dribbble.svelte";
  import FiveHundredPx from "@21n/branding/external/logos/FiveHundredPx.svelte";
  import Github from "@21n/branding/external/logos/Github.svelte";
  import Gitlab from "@21n/branding/external/logos/Gitlab.svelte";
  import Linkedin from "@21n/branding/external/logos/Linkedin.svelte";
  import Overflow from "@21n/branding/external/logos/Overflow.svelte";
  import Substack from "@21n/branding/external/logos/Substack.svelte";
  import Twitter from "@21n/branding/external/logos/Twitter.svelte";
  import Youtube from "@21n/branding/external/logos/Youtube.svelte";
  import Medium from "@21n/branding/external/logos/Medium.svelte";
  import Spotify from "@21n/branding/external/logos/Spotify.svelte";
  import Obsidian from "@21n/branding/external/logos/Obsidian.svelte";
  import Notion from "@21n/branding/external/logos/Notion.svelte";
  import Heptabase from "@21n/branding/external/logos/Heptabase.svelte";
  import Capacities from "@21n/branding/external/logos/Capacities.svelte";
  import RoamResearch from "@21n/branding/external/logos/RoamResearch.svelte";
  import Remnote from "@21n/branding/external/logos/Remnote.svelte";
  import Dynalist from "@21n/branding/external/logos/Dynalist.svelte";
  import Ideaflow from "@21n/branding/external/logos/Ideaflow.svelte";
  import Default from "@21n/branding/external/logos/Default.svelte";
  import Icon from "@21n/elements/Icon.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import Mymind from "@21n/branding/external/logos/Mymind.svelte";
  import Anytype from "@21n/branding/external/logos/Anytype.svelte";
  import Liner from "@21n/branding/external/logos/Liner.svelte";
  import Lazy from "@21n/branding/external/logos/Lazy.svelte";
  import Audiopen from "@21n/branding/external/logos/Audiopen.svelte";
  import Logseq from "@21n/branding/external/logos/Logseq.svelte";
  import Tana from "@21n/branding/external/logos/Tana.svelte";
  import Scrintal from "@21n/branding/external/logos/Scrintal.svelte";
  import Pocket from "@21n/branding/external/logos/Pocket.svelte";
  import Instapaper from "@21n/branding/external/logos/Instapaper.svelte";
  import TheBrain from "@21n/branding/external/logos/TheBrain.svelte";
  import ViennaScribe from "@21n/branding/external/logos/ViennaScribe.svelte";
  import MilaNote from "@21n/branding/external/logos/MilaNote.svelte";
  import Noted from "@21n/branding/external/logos/Noted.svelte";
  import Raindrop from "@21n/branding/external/logos/Raindrop.svelte";

  import SvgIcon from "@21n/elements/SVGIcon.svelte";

  type ExternalLogoProvider = {
    icon?: string;
    label?: string;
  };

  let {
    provider = undefined,
    url = undefined,
    width = 20,
    class: className = ""
  }: {
    provider?: IdentityProvider | string | undefined;
    url?: string | undefined;
    width?: number;
    class?: string;
  } = $props();
  let selected = $state<any>(Link);
  const brandfetchKey = import.meta.env.VITE_BRANDFETCH_KEY;
  $effect(() => {
    if (provider === IdentityProvider.GenericLink) selected = Link;
    else if (provider === IdentityProvider.Behance) selected = Behance;
    else if (provider === IdentityProvider.Github) selected = Github;
    else if (provider === IdentityProvider.Dribbble) selected = Dribbble;
    else if (provider === IdentityProvider.Gitlab) selected = Gitlab;
    else if (provider === IdentityProvider.Stackoverflow) selected = Overflow;
    else if (provider === IdentityProvider.FiveHundredPx)
      selected = FiveHundredPx;
    else if (provider === IdentityProvider.Domain) selected = Web;
    else if (provider === IdentityProvider.Phone) selected = Phone;
    else if (provider === IdentityProvider.Email) selected = Email;
    else if (provider === IdentityProvider.Linkedin) selected = Linkedin;
    else if (provider === IdentityProvider.Substack) selected = Substack;
    else if (provider === IdentityProvider.Twitter) selected = Twitter;
    else if (provider === IdentityProvider.Youtube) selected = Youtube;
    else if (provider === IdentityProvider.Medium) selected = Medium;
    else if (provider === IdentityProvider.Spotify) selected = Spotify;
    else selected = Default;
  });
  const icon = $derived(provider);
  const SelectedLogo = $derived(selected);
</script>

{#if icon && icon.includes(":") && !icon.includes("svg:")}
  <Icon {icon} class={className} />
{:else if url && !icon?.includes("svg:")}
  <img
    src={`https://cdn.brandfetch.io/${url}/w/400/h/400?c=${brandfetchKey}`}
    class="rounded-full w-full h-full"
    alt={icon}
  />
{:else if icon}
  <svg
    {width}
    height={width}
    xmlns="http://www.w3.org/2000/svg"
    version="1.1"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    x="0"
    y="0"
    viewBox="0 0 512 512"
    style="enable-background:new 0 0 512 512"
    xml:space="preserve"
    class={cn("flex justify-center items-center", className)}
    id={icon}
  >
    {#if icon.includes("svg:")}
      <SvgIcon icon={icon.replace("svg:", "")} size="fit" />
    {:else if icon === "obsidian"}
      <Obsidian />
    {:else if icon === "notion"}
      <Notion />
    {:else if icon === "capacities"}
      <Capacities />
    {:else if icon === "roam"}
      <RoamResearch />
    {:else if icon === "remnote"}
      <Remnote />
    {:else if icon === "dynalist"}
      <Dynalist />
    {:else if icon === "ideaflow"}
      <Ideaflow />
    {:else if icon === "heptabase"}
      <Heptabase />
    {:else if icon === "mymind"}
      <Mymind />
    {:else if icon === "anytype"}
      <Anytype />
    {:else if icon === "liner"}
      <Liner />
    {:else if icon === "lazy"}
      <Lazy />
    {:else if icon === "audiopen"}
      <Audiopen />
    {:else if icon === "logseq"}
      <Logseq />
    {:else if icon === "tana"}
      <Tana />
    {:else if icon === "scrintal"}
      <Scrintal />
    {:else if icon === "pocket"}
      <Pocket />
    {:else if icon === "instapaper"}
      <Instapaper />
    {:else if icon === "raindrop"}
      <Raindrop />
    {:else if icon === "thebrain"}
      <TheBrain />
    {:else if icon === "viennascribe"}
      <ViennaScribe />
    {:else if icon === "milanote"}
      <MilaNote />
    {:else if icon === "noted"}
      <Noted />
    {:else}
      <SelectedLogo />
    {/if}
  </svg>
{/if}
