<script lang="ts">
  import AvatarRenderer from "@nucleum/client/elements/avatarPicker/AvatarRenderer.svelte";
  import Icon from "@nucleum/client/elements/Icon.svelte";
  import ResourceGridThumbnail from "@nucleum/components/records/ResourceGridThumbnail.svelte";
  import ResourceThumbnailBase from "@nucleum/application/record/thumbnail/ResourceThumbnailBase.svelte";
  import {
    ResourceAccessPoint,
    ResourceAccessPointState
  } from "@nucleum/datafn/resource.type";
  import { Arrangement } from "@21n/elements/direction.enum";
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@nucleum/client/utils/ui.utils";
  import { countNavItems } from "@nucleum/features/spaces/combination/combination.utils";
  import type { ISideNavCombination } from "@nucleum/features/spaces/combination/combination.type";

  let {
    item = $bindable(),
    arrangement = Arrangement.LIST,
    size = Size.md,
    accessPoint = ResourceAccessPoint.BROWSER,
    accessPointState = ResourceAccessPointState.DEFAULT,
    onClick = undefined
  }: {
    item: ISideNavCombination;
    arrangement?: Arrangement;
    size?: Size.sm | Size.md;
    accessPoint?: ResourceAccessPoint;
    accessPointState?: ResourceAccessPointState;
    onClick?: ((event: MouseEvent) => void) | undefined;
  } = $props();

  let counts = $derived(countNavItems(item?.items ?? []));
  let title = $derived(item?.label ?? "Untitled space");

  const pluralize = (count: number, noun: string) =>
    `${count} ${noun}${count === 1 ? "" : "s"}`;
</script>

<ResourceThumbnailBase {item} {accessPoint} {arrangement}>
  {#if arrangement === Arrangement.LIST}
    <button
      class="flex items-center gap-3 w-full h-20 rounded-md bg-bgs2 border border-transparent hover:border-bgs3 p-3 text-left"
      onclick={onClick}
    >
      {#if item?.avatar}
        <AvatarRenderer avatar={item.avatar} size={Size.lg} />
      {:else}
        <div
          class="flex items-center justify-center w-12 h-12 rounded-md bg-bgs3"
        >
          <Icon icon="combination" size={Size.md} class="stroke-fgs2" />
        </div>
      {/if}
      <div class="flex flex-col flex-grow gap-1 overflow-hidden">
        <div class="flex items-center gap-2">
          <span class="truncate text-b2 font-medium">{title}</span>
          {#if item?.isStarred}
            <Icon icon="star" size={Size.sm} class="stroke-aps1 fill-aps1" />
          {/if}
        </div>
        {#if item?.description}
          <span class="text-b3 text-fgs3 truncate">
            {item.description}
          </span>
        {/if}
        <div class="flex gap-3 text-b3 text-fgs3">
          <span>{pluralize(counts.resources, "resource")}</span>
          {#if counts.sections > 0}
            <span>{pluralize(counts.sections, "section")}</span>
          {/if}
        </div>
      </div>
    </button>
  {:else if arrangement === Arrangement.GRID || arrangement === Arrangement.MASONRY}
    <ResourceGridThumbnail {item} {size} onclick={onClick}>
      <div
        class="flex flex-1 items-center justify-center w-full h-full bg-bgs2 rounded-t-md"
      >
        {#if item?.avatar}
          <AvatarRenderer avatar={item.avatar} size={Size.lg} />
        {:else}
          <Icon icon="combination" size={Size.lg} class="stroke-fgs2" />
        {/if}
      </div>
      {#snippet bottom()}
        <div class="flex flex-col gap-1 w-full">
          <span class="text-b2 font-medium truncate">{title}</span>
          {#if item?.description}
            <span class="text-b3 text-fgs3 truncate">{item.description}</span>
          {/if}
          <div
            class="flex gap-2 text-b3 text-fgs3"
            data-access-point-state={accessPointState}
          >
            <span>{pluralize(counts.resources, "resource")}</span>
            {#if counts.sections > 0}
              <span>{pluralize(counts.sections, "section")}</span>
            {/if}
          </div>
        </div>
      {/snippet}
    </ResourceGridThumbnail>
  {/if}
</ResourceThumbnailBase>
