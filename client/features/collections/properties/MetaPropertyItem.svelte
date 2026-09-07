<script lang="ts">
  import { get } from "svelte/store";
  import FormControlLabel from "@21n/elements/text/formLabel/FormControlLabel.svelte";
  import { userPreferences } from "@nucleum/stores/preferences/user-preferences.store";
  import { formatDatetime } from "@21n/utils/time.utils";
  import {
    type IProperty,
    PropertyType
  } from "@nucleum/features/collections/properties/property.type";
  import ColorsProperty from "@nucleum/features/collections/properties/colorsProperty/ColorsProperty.svelte";
  import LocationProperty from "@nucleum/features/collections/properties/locationProperty/LocationProperty.svelte";
  import type { ICollectionItem } from "@nucleum/features/collections/collection.type";
  let {
    property,
    item
  }: {
    property: IProperty;
    item: ICollectionItem | null | undefined;
  } = $props();

  function resolveMetadata() {
    if (item && "metadata" in item) return item.metadata;
    return undefined;
  }

  function resolveItemDate(value: Date | string | number | undefined) {
    if (!value) return undefined;
    return new Date(value);
  }

  function resolveItemDateLabel(value: Date | string | number | undefined) {
    const date = resolveItemDate(value);
    if (!date) return "";
    return formatDatetime(get(userPreferences), date);
  }

  function resolveFallbackLabel() {
    if (property.type === PropertyType.CREATED_TIME) {
      return "Created";
    } else if (property.type === PropertyType.MODIFIED_TIME) {
      return "Modified";
    } else if (property.type === PropertyType.LOCATION) {
      return "Location";
    }
    return "Unknown";
  }
</script>

<div class="flex flex-col w-full items-start">
  <FormControlLabel
    props={{
      label: property.label ? property.label : resolveFallbackLabel()
    }}
  />
  {#if property.type === PropertyType.CREATED_TIME}
    {resolveItemDateLabel(item?.createdAt)}
  {:else if property.type === PropertyType.MODIFIED_TIME}
    {resolveItemDateLabel(item?.updatedAt)}
  {:else if property.type === PropertyType.SYSTEM_ID}
    {item?.id?.toString()}
  {:else if property.type === PropertyType.LINKS_COUNT}
    <!-- TODO -->
  {:else if property.type === PropertyType.COLORS}
    <ColorsProperty colors={resolveMetadata()?.colors} />
  {:else if property.type === PropertyType.LOCATION}
    <LocationProperty location={resolveMetadata()?.location} />
  {/if}
</div>
