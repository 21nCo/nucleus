<script lang="ts">
  import InlineInfoBanner from "@21n/elements/text/InlineInfoBanner.svelte";
  import { userPreferences } from "@nucleum/stores/preferences/user-preferences.store";
  import { InfoTextType } from "@21n/elements/text/info.type";
  import { formatDatetime } from "@21n/utils/time.utils";
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/elements/size.enum";
  import type { ActiveResourceStore } from "@nucleum/application/record/active-resource.store";
  import { renderMdAsHtml } from "@nucleum/features/memory/markdown/markdown.utils";
  import {
    isShowStatusBanner,
    resolveTrashedAtDate
  } from "@nucleum/datafn/resource.utils";
  import RecordTrashBanner from "@nucleum/application/record/RecordTrashBanner.svelte";
  let { resource }: { resource: ActiveResourceStore<any, any> } = $props();
  const trashedAt = $derived(resolveTrashedAtDate($resource));
</script>

{#if isShowStatusBanner($resource)}
  <div class="flex flex-col gap-4">
    {#if trashedAt}
      <RecordTrashBanner
        deletedAt={trashedAt.toISOString()}
        onRestore={() => {
          resource.restore();
        }}
      />
    {/if}
    {#if $resource.isArchived}
      <InlineInfoBanner
        type={InfoTextType.INFO}
        icon="archive"
        content={"This resource was archived on: *" +
          formatDatetime($userPreferences, new Date($resource.updatedAt)) +
          "*"}
        action={{
          label: "Unarchive",
          callback: async () => {
            return resource.unarchive();
          }
        }}
      />
    {/if}
    {#if $resource.isAncestorInactive}
      <InlineInfoBanner
        type={InfoTextType.INFO}
        icon="cross"
        content={`This resource is inactive because an ancestor is either archived or deleted`}
      />
    {/if}
    {#if $resource.isLocked}
      <div
        class="flex justify-between gap-2 bg-aps3 border-2 border-dotted border-aps2 rounded-md p-2 px-4 text-b2 text-aps1"
      >
        <span class="flex items-center gap-2">
          <Icon icon="lock" class="stroke-aps1" size={Size.sm} />
          <span
            >Locked for editing -
            {@html renderMdAsHtml(
              "*" +
                formatDatetime(
                  $userPreferences,
                  new Date($resource.updatedAt)
                ) +
                "*"
            )}
          </span>
        </span>
        <button
          class="text-b3 font-medium underline"
          onclick={() => {
            resource.toggleLock(false);
          }}>Unlock</button
        >
      </div>
    {:else if $resource.isInReadOnlyMode}
      <div
        class="flex justify-between gap-2 bg-bgs2 border-2 border-dotted border-brs3 rounded-md p-2 px-4 text-b2"
      >
        <span class="flex items-center gap-2">
          <Icon icon="book-open" size={Size.sm} />
          <span>Read mode is turned on</span>
        </span>
        <button
          class="text-b3 font-medium underline"
          onclick={() => {
            resource.toggleReadMode(false);
            // floatingBarRef?.resetToggle();
          }}>turn off</button
        >
      </div>
    {/if}
  </div>
{/if}
