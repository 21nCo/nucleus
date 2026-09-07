<script lang="ts">
  import DatePicker from "@21n/elements/datetime/DatePicker.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import Rating from "@nucleum/features/collections/properties/ratingProperty/Rating.svelte";
  import SwitchInput from "@21n/elements/toggle/SwitchInput.svelte";
  import view from "@nucleum/stores/view.store";
  import { Orientation } from "@21n/elements/direction.enum";
  import { InputStyle } from "@21n/elements/input/input.type";
  import { enumToString, isValidString } from "@21n/shared-utils/text.utils";
  import { cn } from "@21n/utils/ui.utils";
  import MetaPropertyItem from "@nucleum/features/collections/properties/MetaPropertyItem.svelte";
  import SelectProperty from "@nucleum/features/collections/properties/selectProperty/SelectProperty.svelte";
  import {
    type IProperty,
    type IPropertyValue,
    type ISelectProperty,
    type IUniversalProperty,
    PropertyType,
    textPropertyTypes
  } from "@nucleum/features/collections/properties/property.type";
  import { type IRecordId } from "@nucleum/schema/legacy/data.type";
  import SelectPropertyOption from "@nucleum/features/collections/properties/selectProperty/SelectPropertyOption.svelte";
  import Text from "@21n/elements/text/Text.svelte";
  import { TextStyle } from "@21n/elements/text/text.enum";
  import {
    resolvePropertyDefaultValue,
    resolveIsMultiSelectProperty,
    resolveUniversalPropertyOptions
  } from "@nucleum/features/collections/properties/property.utils";
  import { isValidArrayWithData } from "@21n/shared-utils/obj.utils";
  import { resourceInList } from "@nucleum/datafn/resource.utils";
  import { debouncer } from "@21n/utils/utils";
  import type { InputLabel } from "@21n/elements/input/input.type";
  import type { ICollectionItem } from "@nucleum/features/collections/collection.type";

  let {
    value = null,
    property,
    item = null,
    parentBgIndex = 1,
    isPropertiesPaneContext = false,
    context = "default",
    isReadOnlyMode = false,
    onChange = undefined,
    onNewOption = undefined,
    onConfigChange = undefined
  }: {
    value?: IPropertyValue | null;
    property: IProperty;
    item?: ICollectionItem | null;
    parentBgIndex?: number;
    isPropertiesPaneContext?: boolean;
    context?: "default" | "propertiesPane" | "collectionView";
    isReadOnlyMode?: boolean;
    onChange?: ((event: CustomEvent<any>) => void) | undefined;
    onNewOption?: ((event: CustomEvent<any>) => void) | undefined;
    onConfigChange?: ((event: CustomEvent<any>) => void) | undefined;
  } = $props();
  let _value = $state<IPropertyValue | null>(null);
  let options = $derived.by(() =>
    property.type === PropertyType.SINGLE_SELECT ||
    property.type === PropertyType.MULTI_SELECT ||
    property.type === PropertyType.UNIVERSAL
      ? resolveOptionsForSelect(property)
      : []
  );

  let style = $derived(
    context === "collectionView" ? InputStyle.PLAIN : InputStyle.FILLED
  );

  let label = $derived.by<InputLabel | undefined>(() =>
    context === "collectionView" && property.type !== PropertyType.CHECKBOX
      ? undefined
      : {
          label: property.label ? property.label : enumToString(property.type),
          orientation:
            context === "collectionView"
              ? Orientation.Horizontal
              : Orientation.Vertical
        }
  );

  function assignDefaultValue(value: IPropertyValue | null) {
    if (property.type === PropertyType.DATE && typeof value === "string") {
      const dateObj = new Date(value);
      value = !isNaN(dateObj.getTime()) ? dateObj : null;
    } else if (
      property.type === PropertyType.NUMBER &&
      typeof value === "string"
    ) {
      value = parseFloat(value);
    } else if (
      textPropertyTypes.includes(property.type) &&
      Array.isArray(value)
    ) {
      value = "";
    } else if (resolveIsMultiSelectProperty(property) && value === "none") {
      value = [];
    } else if (
      resolveIsMultiSelectProperty(property) &&
      !Array.isArray(value)
    ) {
      value = value ? [value.toString()] : [];
    }
    if (
      !value ||
      (Array.isArray(value) && value.length === 0) ||
      (property.type === PropertyType.SINGLE_SELECT &&
        typeof value !== "string") ||
      (property.type === PropertyType.NUMBER && typeof value !== "number")
    ) {
      value = resolvePropertyDefaultValue(property.type) ?? null;
    }
    return value;
  }

  $effect(() => {
    _value = assignDefaultValue(value);
  });

  function formatValue(value: any) {
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    return value;
  }

  function resolveOptionsForSelect(
    property: ISelectProperty | IUniversalProperty
  ) {
    if (property.type === PropertyType.UNIVERSAL) {
      if (!property.config) return [];
      return resolveUniversalPropertyOptions(property.config.type);
    }
    return property.config?.options ?? [];
  }

  function propagateChange() {
    const event = new CustomEvent<any>("change", { detail: _value });
    onChange?.(event);
  }

  function resolveLabel(): InputLabel {
    return (
      label ?? {
        label: property.label ? property.label : enumToString(property.type),
        orientation: Orientation.Vertical
      }
    );
  }

  function resolveSelectedOption(value: IPropertyValue | null) {
    const option = options.find(
      (x) =>
        x.id === value || (value === null && x.id === property.defaultValue)
    );
    return option;
  }

  function resolveSelectedOptions(value: IPropertyValue | null) {
    if (!Array.isArray(value)) return [];
    return value
      .map((entry) => options.find((x) => x.id === entry))
      .filter((option): option is NonNullable<typeof option> =>
        Boolean(option)
      );
  }

  function resolveSelectValue(
    value: IPropertyValue | null
  ): string | string[] | null {
    if (typeof value === "string" || Array.isArray(value)) return value;
    return value === null ? null : null;
  }

  function resolveDateValue(value: IPropertyValue | null) {
    return value instanceof Date ? value : undefined;
  }

  function onSelectChange(e: CustomEvent<string | string[] | null>) {
    _value = e.detail;
    const event = new CustomEvent<any>("change", { detail: e.detail });
    onChange?.(event);
  }

  function onDateChange(e: CustomEvent<Date | undefined>) {
    _value = e.detail ?? null;
    const event = new CustomEvent<any>("change", { detail: e.detail });
    onChange?.(event);
  }

  function handleCheckboxChange(event: CustomEvent<boolean>) {
    const changeEvent = new CustomEvent<any>("change", {
      detail: event.detail
    });
    onChange?.(changeEvent);
  }

  const debouncedPropagateChange = debouncer(propagateChange, 1500);
</script>

<div
  class={cn(
    "flex",
    context !== "collectionView" && {
      "w-60 max-w-md grow": !$view.isPortrait,
      "w-full":
        $view.isPortrait ||
        isPropertiesPaneContext ||
        context === "propertiesPane" ||
        isReadOnlyMode
    }
  )}
>
  {#if isReadOnlyMode}
    <div class="w-full h-full flex flex-col gap-1 justify-center">
      <Text content={property.label} style={TextStyle.SECTION_HEADING_SMALL} />
      <button
        class={cn("text-left text-b2 w-fit", {
          "underline-dotted":
            property.type === PropertyType.URL ||
            property.type === PropertyType.EMAIL
        })}
        onclick={() => {
          if (property.type === PropertyType.URL) {
            const url = _value?.toString().includes("http")
              ? _value.toString()
              : `https://${_value}`;
            window.open(url, "_blank");
          } else if (property.type === PropertyType.EMAIL) {
            window.open(`mailto:${_value}`, "_blank");
          }
        }}
      >
        {#if property.type === PropertyType.SINGLE_SELECT}
          {@const selectedOption = resolveSelectedOption(_value)}
          {#if selectedOption}
            <SelectPropertyOption
              item={selectedOption}
              isSelectedContext={true}
            />
          {:else}
            N/A
          {/if}
        {:else if property.type === PropertyType.RATING && typeof _value === "number"}
          <Rating
            isReadOnlyMode={true}
            avatar={property.config?.avatar}
            value={_value ?? 0}
            count={property.config?.scale ?? 5}
          />
        {:else}
          {_value && isValidString(_value.toString())
            ? formatValue(_value)
            : "N/A"}
        {/if}
      </button>
    </div>
  {:else if property.type === PropertyType.TEXT}
    <TextInput
      {style}
      parentBackgroundIndex={parentBgIndex}
      bind:value={_value}
      {label}
      placeholder="Enter text"
      onChange={debouncedPropagateChange}
    />
  {:else if property.type === PropertyType.NUMBER || property.type === PropertyType.EMAIL || property.type === PropertyType.URL}
    <TextInput
      {style}
      parentBackgroundIndex={parentBgIndex}
      bind:value={_value}
      {label}
      placeholder={`Enter ${property.type}`}
      onChange={debouncedPropagateChange}
      type={property.type}
    />
  {:else if property.type === PropertyType.CHECKBOX && typeof _value === "boolean"}
    <!-- <CheckboxInput bind:checked={property.value} label={details.label} /> -->
    <SwitchInput
      {parentBgIndex}
      bind:checked={_value}
      label={resolveLabel()}
      {style}
      onChange={handleCheckboxChange}
    />
  {:else if property.type === PropertyType.RATING && typeof _value === "number"}
    <Rating
      {parentBgIndex}
      label={resolveLabel()}
      {style}
      avatar={property.config?.avatar}
      bind:value={_value}
      count={property.config?.scale ?? 5}
      {onChange}
    />
  {:else if property.type === PropertyType.SINGLE_SELECT || property.type === PropertyType.MULTI_SELECT || property.type === PropertyType.UNIVERSAL}
    {#if context === "collectionView"}
      {#if isValidArrayWithData(_value)}
        <div class="flex gap-2 flex-wrap w-full">
          {#each resolveSelectedOptions(_value) as option}
            <SelectPropertyOption item={option} isSelectedContext={true} />
          {/each}
        </div>
      {:else if _value && _value !== "none"}
        {@const selectedOption = resolveSelectedOption(_value)}
        {#if selectedOption}
          <SelectPropertyOption
            item={selectedOption}
            isSelectedContext={true}
          />
        {/if}
      {/if}
    {:else}
      <SelectProperty
        {style}
        {label}
        {property}
        {options}
        parentBackgroundIndex={parentBgIndex}
        value={resolveSelectValue(_value)}
        onChange={onSelectChange}
        {onNewOption}
        {onConfigChange}
      />
    {/if}
  {:else if property.type === PropertyType.DATE}
    <DatePicker
      parentBackgroundIndex={parentBgIndex}
      date={resolveDateValue(_value)}
      {label}
      {style}
      onChange={onDateChange}
    />
  {:else if item}
    <MetaPropertyItem {property} {item} />
  {/if}
</div>
