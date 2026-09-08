<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import view from "@nucleum/stores/view.store";
  import { cn } from "@21n/utils/ui.utils";
  import PropertyItem from "@nucleum/features/collections/properties/PropertyItem.svelte";
  import {
    resolvePropertiesForCapture,
    resolvePropertiesForNodePage,
    resolveIsMultiSelectProperty
  } from "@nucleum/features/collections/properties/property.utils";
  import { hoverable } from "@nucleum/actions/hover.action";
  import { Size } from "@21n/elements/size.enum";
  import Badge from "@21n/elements/text/Badge.svelte";
  import { ButtonStyle } from "@21n/elements/button/button.type";
  import type {
    ICollectionExpanded,
    ICollectionItem,
    ICollectionItemPropertyValue
  } from "@nucleum/features/collections/collection.type";
  import type {
    IProperty,
    IPropertyConfigOption
  } from "@nucleum/features/collections/properties/property.type";
  import {
    removeDuplicatesFilter,
    resourceInList
  } from "@nucleum/datafn/resource.utils";
  import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { NodeType } from "@nucleum/schema/legacy/node-type.enum";
  import { datafn } from "@nucleum/datafn/datafn.store";
  let {
    types = undefined,
    isIncludeExtendedProperties = true,
    values = $bindable([]),
    item = null,
    resource,
    parentBgIndex = 1,
    context = "capture",
    isReadOnlyMode = false,
    isCollapsed = $bindable(false),
    onChange = undefined,
    onPropertyCount = undefined,
    onShowAll = undefined
  }: {
    types?: ICollectionExpanded[] | undefined;
    isIncludeExtendedProperties?: boolean;
    values?: ICollectionItemPropertyValue[];
    item?: ICollectionItem | null;
    resource: Resource;
    parentBgIndex?: number;
    context?: "capture" | "clip" | "mainpanel" | "rightpanel";
    isReadOnlyMode?: boolean;
    isCollapsed?: boolean;
    onChange?:
      | ((event: CustomEvent<ICollectionItemPropertyValue>) => void)
      | undefined;
    onPropertyCount?: ((count: number) => void) | undefined;
    onShowAll?: (() => void) | undefined;
  } = $props();
  const properties = $derived(resolveProperties(types));
  let isRenderAsColumn = $derived(
    context === "rightpanel" || context === "clip"
  );
  let isCollapserHovered = $state(false);

  function isProperty(value: IProperty | undefined): value is IProperty {
    return Boolean(value);
  }

  function isNodeItem(
    value: ICollectionItem | null
  ): value is ICollectionItem & { contentType: NodeType } {
    return Boolean(value && "contentType" in value);
  }

  $effect(() => {
    onPropertyCount?.(properties.length);
  });

  function resolveProperties(types: ICollectionExpanded[] | undefined) {
    if (!types) return [];
    let propertyConfig = types
      .map((x) => x.properties)
      .flat()
      .filter(isProperty);
    if (isIncludeExtendedProperties) {
      const extendedProps = types
        .map((x) => x.extendProperties)
        .flat()
        .filter((x) => x) as IProperty[];
      propertyConfig = propertyConfig.concat(extendedProps);
      propertyConfig = propertyConfig.filter(removeDuplicatesFilter);
    }
    if (propertyConfig.length === 0) return [];
    if (context === "capture" || context === "clip")
      return resolvePropertiesForCapture(propertyConfig);
    else if (context === "mainpanel")
      return resolvePropertiesForNodePage(propertyConfig);
    else if (context === "rightpanel") return propertyConfig;
    return [];
  }

  async function onNewOption(e: CustomEvent) {
    const property = properties.find(resourceInList(e.detail.id));
    if (!property) return;
    const newOption: IPropertyConfigOption = {
      id: generateSimpleRandomId(),
      label: e.detail.label,
      color: Math.random() * 360
    };
    if (!property.config || !("options" in property.config)) return;
    property.config.options = [...(property.config.options ?? []), newOption];
    await datafn.property.mutate({
      operation: "merge",
      id: property.id,
      record: {
        id: property.id,
        config: property.config
      }
    });
    const currentValue = values?.find(resourceInList(property))?.value;
    const nextValue = resolveIsMultiSelectProperty(property)
      ? [
          ...new Set([
            ...(Array.isArray(currentValue)
              ? currentValue
              : currentValue
                ? [currentValue.toString()]
                : []),
            newOption.id
          ])
        ]
      : newOption.id;
    emitPropertyValue(property.id, nextValue);
  }

  async function onConfigChange(e: CustomEvent) {
    const property = properties.find(resourceInList(e.detail.id));
    if (!property) return;
    await datafn.property.mutate({
      operation: "merge",
      id: property.id,
      record: {
        id: property.id,
        config: e.detail.config,
        defaultValue: e.detail.defaultValue
      }
    });
    property.config = e.detail.config;
    property.defaultValue = e.detail.defaultValue;
  }

  function resolveCollectionIdForProperty(propertyId: string) {
    const directType = types?.find((type) =>
      type.properties?.some(resourceInList(propertyId))
    );
    if (directType?.id) return directType.id;
    const extendedType = types?.find((type) =>
      type.extendProperties?.some(resourceInList(propertyId))
    );
    return extendedType?.typeToExtend?.id ?? extendedType?.id;
  }

  function emitPropertyValue(propertyId: string, value: any) {
    onChange?.(
      new CustomEvent("change", {
        detail: {
          id: propertyId,
          value,
          collectionId: resolveCollectionIdForProperty(propertyId)
        }
      })
    );
  }
</script>

{#if properties && properties.length > 0}
  <div
    class={cn(
      "w-full userdata",
      !isRenderAsColumn &&
        !$view.isConstrainedWidth &&
        resource === Resource.node &&
        isNodeItem(item) &&
        item.contentType === NodeType.NODULAR_MARKDOWN && {
          "pl-8": !isCollapsed,
          "pl-12": isCollapsed
        }
    )}
  >
    <div
      class={cn(
        "flex flex-col rounded-md",
        !isRenderAsColumn && {
          border: true,
          "border-brs3":
            isCollapsed ||
            isCollapserHovered ||
            (resource === Resource.objective && !$view.isConstrainedWidth),
          "border-transparent":
            !isCollapsed &&
            !isCollapserHovered &&
            !(resource === Resource.objective && !$view.isConstrainedWidth)
        }
      )}
    >
      {#if !isRenderAsColumn}
        <button
          class={cn("flex justify-between items-center w-full rounded-md", {
            "px-4 py-2": isCollapsed,
            "mo:px-0 p-4": !isCollapsed
          })}
          onclick={() => {
            isCollapsed = !isCollapsed;
          }}
          use:hoverable={{
            onHover: (val) => (isCollapserHovered = val)
          }}
        >
          <span class="flex items-center gap-2">
            <span class="text-b2 text-fgs3"> Properties </span>
            {#if isCollapsed}
              <Badge text={properties.length} />
            {/if}
          </span>
          <span class="h-3 flex gap-3 items-center">
            {#if isCollapserHovered}
              {#if context === "mainpanel"}
                <Button
                  label="See all"
                  icon="proceed"
                  size={Size.sm}
                  style={ButtonStyle.PLAIN}
                  onclick={(e) => {
                    onShowAll?.();
                    if (e) e.stopPropagation();
                  }}
                />
              {/if}
              <Button
                icon={isCollapsed ? "chevron-down" : "chevron-up"}
                tooltip={isCollapsed ? "Expand" : "Collapse"}
              />
            {/if}
          </span>
        </button>
      {/if}
      {#if !isCollapsed || isRenderAsColumn}
        <div
          class={cn("flex w-full flex-wrap gap-8", {
            "mo:px-0 px-4 pb-4": !isRenderAsColumn,
            "flex-col":
              $view.isPortrait ||
              (isRenderAsColumn && context === "rightpanel") ||
              (isReadOnlyMode && context === "mainpanel")
          })}
        >
          {#each properties as property (property.id)}
            <PropertyItem
              value={values?.find(resourceInList(property))?.value}
              {property}
              {item}
              isPropertiesPaneContext={isRenderAsColumn}
              {isReadOnlyMode}
              {parentBgIndex}
              onChange={(e) => {
                emitPropertyValue(property.id, e.detail);
              }}
              {onNewOption}
              {onConfigChange}
            />
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}
