<script lang="ts">
  import { logger } from "@nucleum/components/debug/logger.client";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import Button from "@21n/elements/button/Button.svelte";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import Icon from "@21n/elements/Icon.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import InlineErrorMessage from "@21n/elements/text/InlineErrorMessage.svelte";
  import ScrollViewBottomSpacer from "@21n/layout/scrollView/ScrollViewBottomSpacer.svelte";
  import { toasts } from "@nucleum/stores/notification.store";
  import view from "@nucleum/stores/view.store";
  import { ButtonVariant } from "@21n/types/button.type";
  import type { IRecordId } from "@21n/types/data.type";
  import { InputStyle } from "@21n/types/input.type";
  import { cn } from "@21n/utils/ui.utils";
  import type {
    ILinkTag,
    ILinkTagGroup
  } from "@nucleum/features/memory/linking/link.type";
  import LinkTagsGroup from "@nucleum/features/memory/linking/LinkTagsGroup.svelte";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { toSvelteStore } from "@datafn/svelte";
  import { generateResourceId } from "@nucleum/datafn/id.utils";
  import { activeResourceFilter } from "@21n/utils/utils";

  let {
    accessPoint = null
  }: {
    accessPoint?: ResourceAccessPoint | null;
  } = $props();
  let inputValue = $state("");
  let errorMessage = $state<string | null>(null);
  let isAddFocused = $state(false);
  const linkTagStore = toSvelteStore<ILinkTag[]>(
    datafn.linkTag.signal({
      select: ["id", "label", "group", "updatedAt", "createdAt"]
    }),
    { initialData: [] }
  );
  const linkTags = $derived($linkTagStore.data);
  const groups = $derived.by(() =>
    resolveLinkTagGroups(linkTags).filter((group): group is ILinkTagGroup =>
      Boolean(group)
    )
  );

  function resolveLinkTagGroups(data: ILinkTag[]): ILinkTagGroup[] {
    const groupsArray = data?.reduce(
      (acc, item) => {
        const group = item.group ?? "";
        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push(item);
        return acc;
      },
      {} as Record<string, ILinkTag[]>
    );
    const groups = Object.entries(groupsArray).map(([group, items]) => ({
      group,
      items: items.filter(activeResourceFilter)
    }));
    const withoutGroup = groups.find((item) => item.group === "");
    return [withoutGroup, ...groups.filter((item) => item.group !== "")].filter(
      (item): item is ILinkTagGroup => Boolean(item)
    );
  }

  function resolveSavedLinkTag(result: ILinkTag | ILinkTag[] | undefined) {
    return Array.isArray(result) ? result[0] : result;
  }

  function resolveGroupItems(groupName: string) {
    return groups.find((group) => group.group === groupName)?.items ?? [];
  }

  function resolveTagParts(label: string, group?: string) {
    let resolvedLabel = label.trim();
    let resolvedGroup = group?.trim();
    if (!resolvedGroup && resolvedLabel.includes(":")) {
      const [groupPart, ...labelParts] = resolvedLabel.split(":");
      resolvedGroup = groupPart.trim();
      resolvedLabel = labelParts.join(":").trim();
    }
    return {
      label: resolvedLabel,
      group: resolvedGroup?.toLowerCase() ?? ""
    };
  }

  async function saveLinkTag(label: string, group?: string) {
    const next = resolveTagParts(label, group);
    const existingTag = linkTags.find(
      (tag) =>
        tag.label?.toLowerCase() === next.label.toLowerCase() &&
        (tag.group ?? "").toLowerCase() === next.group
    );
    if (existingTag) return existingTag;
    const now = new Date();
    const record = {
      id: generateResourceId(Resource.linkTag),
      ...next,
      createdAt: now,
      updatedAt: now
    };
    await datafn.linkTag.mutate({
      operation: "insert",
      id: record.id,
      record
    });
    return record;
  }

  async function save(params?: { group: string; label: string }) {
    if (!inputValue && !params?.label) {
      errorMessage = "Tag cannot be empty";
      return;
    }
    let result;
    if (params) {
      result = await saveLinkTag(params.label, params.group);
    } else {
      result = await saveLinkTag(inputValue);
    }
    logger.log({ at: "LinkTagsControlPanel save", result });
    const savedLinkTag = resolveSavedLinkTag(result);
    if (savedLinkTag?.label) {
      toasts.success(`**${savedLinkTag.label}** added to link tags`);
    }
    inputValue = "";
  }

  function onRemove(e: CustomEvent<IRecordId>) {
    logger.log({ at: "LinkTagsControlPanel onRemove", id: e.detail });
    datafn.linkTag.mutate({
      operation: "trash",
      id: e.detail
    });
  }

  function onUpdate(e: CustomEvent<{ id: IRecordId; label: string }>) {
    logger.log({ at: "LinkTagsControlPanel onUpdate", ...e.detail });
    datafn.linkTag.mutate({
      operation: "merge",
      id: e.detail.id,
      record: {
        label: e.detail.label
      }
    });
  }

  function onUpdategroup(e: CustomEvent<{ group: string; newgroup: string }>) {
    const { group, newgroup } = e.detail;
    const tags = resolveGroupItems(group).map((item) => item.id);
    logger.log({
      at: "LinkTagsControlPanel onUpdategroup",
      group,
      newgroup,
      tags
    });
    if (tags)
      datafn.linkTag.mutate(
        tags.map((id) => ({
          operation: "merge",
          id,
          record: { group: newgroup }
        }))
      );
  }

  async function onBulkDelete(e: CustomEvent<string>) {
    const group = e.detail;
    const tags = resolveGroupItems(group).map((item) => item.id);
    logger.log({ at: "LinkTagsControlPanel onBulkDelete", group, tags });
    if (tags)
      await datafn.linkTag.mutate(
        tags.map((id) => ({
          operation: "trash",
          id
        }))
      );
    else toasts.error("No tags to delete");
  }
</script>

<div
  class={cn("flex flex-col gap-6 pt-3 w-full h-full", {
    "px-4":
      accessPoint === ResourceAccessPoint.LIBRARY ||
      accessPoint === ResourceAccessPoint.BROWSER
  })}
>
  <div class="w-full flex cw:gap-3 gap-4">
    <div
      class={cn(
        "flex-1 flex items-center px-4 h-10 border cw:rounded-md rounded-full",
        {
          "border-aps1": isAddFocused,
          "border-brs3": !isAddFocused
        }
      )}
    >
      <TextInput
        bind:value={inputValue}
        style={InputStyle.PLAIN}
        placeholder="Type relation or group:relation"
        onEnter={() => save()}
        onFocus={() => (isAddFocused = true)}
        onBlur={() => (isAddFocused = false)}
      />
    </div>
    {#if $view.isConstrainedWidth}
      <button
        class="w-14 h-full flex justify-center items-center bg-bgs2 rounded-md"
        onclick={() => save()}
      >
        <Icon icon="plus" />
      </button>
    {:else}
      <Button
        icon="plus"
        label="Add"
        type={ButtonVariant.PRIMARY}
        onclick={() => save()}
      />
    {/if}
  </div>
  {#if errorMessage}
    <InlineErrorMessage bind:error={errorMessage} />
  {/if}
  <div class="flex flex-col flex-grow gap-4 px-0.5 overflow-auto">
    {#if !groups || groups.length === 0 || groups.every((x) => x.items.length === 0)}
      <div class="flex flex-col gap-4 justify-center items-center flex-grow">
        <EmptyStatusView
          mainText="No relations found."
          subText="Add some relations to start using for link relationships."
        />
      </div>
    {:else}
      {#each groups as group}
        {#if group?.items && group.items.length > 0}
          <LinkTagsGroup
            {group}
            onSave={(e) => save(e.detail)}
            onUpdateGroupName={onUpdategroup}
            {onBulkDelete}
            {onRemove}
            {onUpdate}
          />
        {/if}
      {/each}
      <ScrollViewBottomSpacer />
    {/if}
  </div>
  <!-- <InlineInfoBanner
    type={InfoTextType.TIP}
    content="Tip: Use relations to maintain relationship information between nodes."
    action={{
      label: "Learn more",
      action:
        $appStore?.appData?.urls?.kbLinkTags ??
        "https://docs.memotron.io/page/faqs"
    }}
  /> -->
</div>
