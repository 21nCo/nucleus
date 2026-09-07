<script lang="ts">
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import OptionSelector from "@21n/elements/select/OptionSelector.svelte";
  import Text from "@21n/elements/text/Text.svelte";
  import { Orientation } from "@21n/elements/direction.enum";
  import { Size } from "@21n/elements/size.enum";
  import { TextStyle } from "@21n/elements/text/text.enum";
  import Toggle from "@21n/elements/toggle/Toggle.svelte";
  import { OptionSelectorStyle } from "@21n/elements/select/select.type";
  import FormControlLabel from "@21n/elements/text/formLabel/FormControlLabel.svelte";
  import {
    CollectionLayout,
    CollectionType
  } from "@nucleum/features/collections/collection.type";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import type { IProperty } from "@nucleum/features/collections/properties/property.type";
  import Avatar from "@21n/elements/avatarPicker/Avatar.svelte";
  import { propertyEditorStore } from "@nucleum/features/collections/properties/property.store";
  import { onMount } from "svelte";
  import ModalFooter from "@21n/elements/modal/ModalFooter.svelte";
  import {
    resolveResourceIcon,
    resourceAction
  } from "@nucleum/datafn/resource.utils";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
import { ResourceActionType } from "@nucleum/schema/legacy/resource-action.enum";
  import { logger } from "@nucleum/client/runtime/logging/logger";
  import {
    resolveCollectionResource,
    resolveCollectionTypeIcon,
    resolveCollectionTypeLabel
  } from "@nucleum/features/collections/collection.utils";
  import TypeExtensionAndPropertiesEditor from "@nucleum/features/collections/TypeExtensionAndPropertiesEditor.svelte";
  import { appStore } from "@nucleum/stores/app.store";
  import view from "@nucleum/stores/view.store";
  import TextArea from "@21n/elements/input/TextArea.svelte";
  import { toasts } from "@nucleum/stores/notification.store";
  import { tooltip } from "@nucleum/actions/popover.action";
  import ModalContentPadded from "@21n/elements/modal/ModalContentPadded.svelte";
  import { createDatafnCollection } from "@nucleum/features/collections/collection.store";

  let {
    context = undefined
  }: {
    context?: ResourceAccessPoint | undefined;
  } = $props();
  let title = $state<string>();
  let description = $state<string>();
  let isStarred = $state(false);
  let selectedType = $state(CollectionType.TYPED);
  let selectedView = $state(CollectionLayout.BOARD);
  let isCaptureShortcutEnabled = $state(true);
  let properties = $state<IProperty[]>([]);
  let avatar = $state<any>();
  let coverPhoto = $state<any>();
  let collectibleResources = $derived(
    resolveCollectionResource($appStore.product)
  );
  let resource = $state<Resource>(Resource.node);
  const dev_isShowTypeSelector: boolean = false;

  const formLabelConfig = {
    orientation: Orientation.Vertical
  };

  $effect(() => {
    const defaultResource = collectibleResources[0];
    if (defaultResource && !collectibleResources.includes(resource)) {
      resource = defaultResource;
    }
  });

  onMount(() => {
    propertyEditorStore.reset();
  });

  function generateInfo(selectedType: CollectionType) {
    switch (selectedType) {
      case CollectionType.SYNCED:
        return {
          content:
            "Use synced collections to sync data from external sources or apps.",
          action: {
            label: "Learn more",
            action: $appStore?.appData?.urls?.kbTypedCollections
          }
        };
      case CollectionType.QUERY:
        return {
          content:
            "Use query collections to store data based on a **filter/search query**. You can define the filters to filter the data you want to store. New items will be automatically added based on the filter criteria.",
          action: {
            label: "Learn more",
            action: $appStore?.appData?.urls?.kbQueryCollections
          }
        };
    }
  }

  async function onSave() {
    try {
      logger.log({
        at: "create collection",
        title,
        selectedType
      });
      const propertyEditor = propertyEditorStore.get();
      const result = await createDatafnCollection({
        title,
        description,
        isStarred,
        isCaptureShortcutEnabled,
        selectedType,
        selectedView,
        resource,
        properties: propertyEditor?.properties ?? [],
        typeToExtendId: propertyEditor?.typeToExtend?.id,
        avatar,
        coverPhoto,
        context:
          context ??
          resourceAction(Resource.collection, ResourceActionType.CREATE)
      });
      if (!result) {
        toasts.error("Error creating collection. Please try again.");
        return;
      }
      return true;
    } catch (e) {
      logger.error({ at: "create collection", error: e });
      toasts.error("Error creating collection. Please try again.");
    }
  }
</script>

<div class="flex w-full h-full items-start">
  <div
    class="flex flex-col h-full gap-4 flex-1 items-center justify-between overflow-auto"
  >
    <ModalContentPadded
      class="flex flex-col gap-8 w-full flex-grow overflow-auto mt-4"
    >
      <div class="flex items-center justify-between w-full gap-2">
        <Text content="Create collection" style={TextStyle.PANEL_HEADING} />
        <span use:tooltip={{ text: "Star collection" }}>
          <Toggle icon="star" bind:on={isStarred} />
        </span>
      </div>
      {#if dev_isShowTypeSelector}
        <div class="flex flex-col w-full gap-6">
          <OptionSelector
            options={[
              CollectionType.TYPED,
              CollectionType.QUERY,
              CollectionType.SYNCED
            ].map((type) => ({
              label: resolveCollectionTypeLabel(type),
              value: type,
              icon: resolveCollectionTypeIcon(type),
              isDisabled: type === CollectionType.SYNCED,
              badge: type === CollectionType.SYNCED ? "planned" : undefined,
              tooltip: generateInfo(type)?.content
            }))}
            style={$view.isConstrainedWidth
              ? OptionSelectorStyle.OUTLINE
              : OptionSelectorStyle.TRAIN}
            labelProps={{
              ...formLabelConfig,
              label: "Collection type"
            }}
            bind:selected={selectedType}
            size={$view.isConstrainedWidth ? Size.sm : Size.md}
            isPreventWrap={$view.isConstrainedWidth}
          />
          <!-- <InlineInfoBanner {...generateInfo(selectedType)} /> -->
        </div>
      {/if}

      {#if collectibleResources.length > 1}
        <OptionSelector
          options={collectibleResources.map((resource) => ({
            value: resource,
            label: `${resource}s`,
            icon: resolveResourceIcon(resource)
          }))}
          style={OptionSelectorStyle.CHECK_CIRCLE}
          size={Size.sm}
          bind:selected={resource}
          labelProps={{
            ...formLabelConfig,
            label: "Resource to collect"
          }}
        />
      {/if}
      <div class="flex flex-col gap-2">
        <FormControlLabel
          props={{
            label:
              selectedType === CollectionType.TYPED
                ? "Avatar and title"
                : "Title"
          }}
        />
        <div class="flex gap-2">
          {#if selectedType === CollectionType.TYPED}
            <span class="w-12 h-full">
              <Avatar bind:avatar isInEditMode={true} />
            </span>
          {/if}
          <TextInput
            bind:value={title}
            width="grow"
            placeholder="Name of the collection"
          />
        </div>
      </div>
      <TextArea
        bind:value={description}
        placeholder="Description (Optional)"
        rows={3}
        label={{ label: "Description", orientation: Orientation.Vertical }}
      />
      {#if selectedType === CollectionType.TYPED}
        <TypeExtensionAndPropertiesEditor
          bind:isCaptureShortcutEnabled
          {resource}
        />
      {/if}
      <!-- <OptionSelector
          options={collectionLayoutOptions}
          iconOrientation={Orientation.Vertical}
          size={$view.isConstrainedWidth ? Size.sm : Size.md}
          labelProps={{
            ...formLabelConfig,
            label: "Default view",
            tooltip: {
              body: "Choose the default view for your collection.",
              actionText: "Learn more about view types",
              action: "/kb/view-types"
            }
          }}
          bind:selected={selectedView}
        /> -->
    </ModalContentPadded>
    <ModalFooter
      action={resourceAction(Resource.collection, ResourceActionType.CREATE)}
      primaryAction={{
        label: "Save",
        callback: onSave
      }}
      secondaryAction={{
        label: "Discard"
      }}
    />
  </div>
</div>
