<script lang="ts">
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { Arrangement } from "@21n/elements/direction.enum";
  let {
    isTail = false,
    arrangement = Arrangement.LIST,
    isConstrainedWidth = false,
    resource = Resource.unknown
  }: {
    isTail?: boolean;
    arrangement?: Arrangement | null;
    isConstrainedWidth?: boolean;
    resource?: Resource;
  } = $props();
  /**
   * @deprecated
   */
</script>

{#if arrangement === Arrangement.LIST}
  <div
    class="animate-pulse grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4"
  >
    <div class="rounded-md bg-bgs3 dark:bg-bgs2 h-20" />
    <div class="rounded-md bg-bgs3 dark:bg-bgs2 h-20" />
    <div class="rounded-md bg-bgs3 dark:bg-bgs2 h-20" />
    <div class="rounded-md bg-bgs3 dark:bg-bgs2 h-20" />
  </div>
{:else if isConstrainedWidth}
  <div
    class="animate-pulse grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4"
  >
    <div class="rounded-md bg-bgs3 dark:bg-bgs2 h-32" />
    <div class="rounded-md bg-bgs3 dark:bg-bgs2 h-32" />
    <div class="rounded-md bg-bgs3 dark:bg-bgs2 h-32" />
    <div class="rounded-md bg-bgs3 dark:bg-bgs2 h-32" />
  </div>
{:else if isTail}
  <div class="animate-pulse rounded-md bg-bgs3 dark:bg-bgs2 mo:h-10 h-60" />
  <div class="animate-pulse rounded-md bg-bgs3 dark:bg-bgs2 mo:h-10 h-60" />
  <div class="animate-pulse rounded-md bg-bgs3 dark:bg-bgs2 mo:h-10 h-60" />
  <div class="animate-pulse rounded-md bg-bgs3 dark:bg-bgs2 mo:h-10 h-60" />
{:else}
  <div
    class="animate-pulse grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-4"
  >
    <div class="rounded-md bg-bgs3 dark:bg-bgs2 mo:h-10 h-60" />
    <div class="rounded-md bg-bgs3 dark:bg-bgs2 mo:h-10 h-60" />
    <div class="rounded-md bg-bgs3 dark:bg-bgs2 mo:h-10 h-60" />
    <div class="rounded-md bg-bgs3 dark:bg-bgs2 mo:h-10 h-60" />
    <div class="rounded-md bg-bgs3 dark:bg-bgs2 mo:h-10 h-60" />
  </div>
{/if}
