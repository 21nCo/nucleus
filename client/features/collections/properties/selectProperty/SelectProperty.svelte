<script lang="ts">
  import { InputStyle, type InputLabel } from "@21n/elements/input/input.type";
  import { Size } from "@21n/elements/size.enum";
  import Icon from "@21n/elements/Icon.svelte";
  import SelectPropertyOption from "@nucleum/features/collections/properties/selectProperty/SelectPropertyOption.svelte";
  import {
    iconSelectPropertyTypes,
    PropertyType,
    type IPropertyConfigOption,
    type ISelectProperty,
    type IUniversalProperty
  } from "@nucleum/features/collections/properties/property.type";
  import { popover } from "@nucleum/actions/popover.action";
  import SelectPropertyOptionsPopover from "@nucleum/features/collections/properties/selectProperty/SelectPropertyOptionsPopover.svelte";
  import { isValidArrayWithData } from "@21n/shared-utils/obj.utils";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import FormElement from "@21n/elements/FormElement.svelte";
  import IconSelect from "@nucleum/features/collections/properties/selectProperty/IconSelect.svelte";
  let {
    property,
    options,
    style = InputStyle.FILLED,
    label = undefined,
    value = $bindable(null),
    parentBackgroundIndex = 0,
    onChange = undefined,
    onNewOption = undefined,
    onConfigChange = undefined
  }: {
    property: ISelectProperty | IUniversalProperty;
    options: IPropertyConfigOption[];
    style?: InputStyle;
    label?: InputLabel | undefined;
    value?: string | string[] | null;
    parentBackgroundIndex?: number;
    onChange?: ((event: CustomEvent<string | string[]>) => void) | undefined;
    onNewOption?:
      | ((event: CustomEvent<{ id: IRecordId; label: string }>) => void)
      | undefined;
    onConfigChange?: ((event: CustomEvent<any>) => void) | undefined;
  } = $props();
  let isOptionsVisible = $state(false);
  let classList = "relative flex flex-col items-start gap-1 w-full";
  let ref = $state<HTMLElement | undefined>();
  let isMultiSelect = $derived(
    property.type === PropertyType.MULTI_SELECT ||
      (property.type === PropertyType.UNIVERSAL &&
        property.config?.isMultiSelect)
  );

  let isIconSelectType = $derived(
    property.type === PropertyType.UNIVERSAL &&
      property.config?.type &&
      iconSelectPropertyTypes.includes(property.config.type)
  );

  function handleSelect(val: string | string[]) {
    value = val;
    if (!isMultiSelect) hidePopover();
    onChange?.(
      new CustomEvent("change", {
        detail: value
      })
    );
  }

  function handleNewOption(option: { id: IRecordId; label: string }) {
    onNewOption?.(
      new CustomEvent("newOption", {
        detail: option
      })
    );
    hidePopover();
  }
  function handleConfigChange(changes: any) {
    property.config = changes.config;
    onConfigChange?.(
      new CustomEvent("configChange", {
        detail: changes
      })
    );
  }

  function hidePopover() {
    ref?.dispatchEvent(new CustomEvent("hide"));
  }

  function onPopoverChange(e: Event) {
    const detail = (e as CustomEvent<{ open?: boolean }>).detail;
    isOptionsVisible = detail?.open ?? false;
  }

  function resolvePropertyId() {
    if ("id" in property && property.id) {
      return property.id.toString();
    }
    return "";
  }

  function shouldShowPlaceholder(val: string | string[] | null) {
    return (
      isEmptyValue() ||
      isEmptyMultiSelect() ||
      isInvalidSingleSelect() ||
      isInvalidStringValue()
    );

    function isEmptyValue() {
      return !val || val === "none";
    }

    function isEmptyMultiSelect() {
      return isMultiSelect && Array.isArray(val) && val.length === 0;
    }

    function isInvalidSingleSelect() {
      return (
        !isMultiSelect &&
        Array.isArray(val) &&
        (val.length !== 1 ||
          (val.length === 1 && !options?.some((x) => x.id === val[0])))
      );
    }

    function isInvalidStringValue() {
      return typeof val === "string" && !options?.some((x) => x.id === val);
    }
  }
</script>

<div class={classList}>
  <FormElement
    class="w-full"
    style={isIconSelectType ? InputStyle.PLAIN : style}
    {label}
    parentBgIndex={parentBackgroundIndex}
    isFocused={isOptionsVisible}
  >
    {#if isIconSelectType}
      <IconSelect {options} {value} onSelect={handleSelect} {isMultiSelect} />
    {:else}
      <div
        class="flex justify-between gap-4 w-full p-2"
        bind:this={ref}
        use:popover={{
          content: SelectPropertyOptionsPopover,
          id: "select-options-popover",
          isSpanToTriggerWidth: true,
          componentProps: {
            property: {
              id: resolvePropertyId(),
              type: property.type,
              config:
                property.type === PropertyType.UNIVERSAL
                  ? {
                      options,
                      type: property.config?.type
                    }
                  : property.config,
              defaultValue: property.defaultValue
            },
            isMultiSelect,
            value,
            onNewOption: handleNewOption,
            onConfigChange: handleConfigChange,
            onSelect: handleSelect
          }
        }}
        onchange={onPopoverChange}
      >
        {#if shouldShowPlaceholder(value)}
          <span class="placeholder">
            Select {property?.label?.toLowerCase()}
          </span>
        {:else if value && isMultiSelect && isValidArrayWithData(value)}
          <div class="flex gap-2 flex-wrap w-full">
            {#each value as option}
              {@const item = options?.find((x) => x.id === option)}
              {#if item}
                <SelectPropertyOption
                  item={property.type === PropertyType.UNIVERSAL
                    ? {
                        ...item,
                        color: 50
                      }
                    : item}
                  isSelectedContext={true}
                />
              {/if}
            {/each}
          </div>
        {:else if typeof value === "string"}
          {@const item = options?.find((x) => x.id === value)}
          {#if item}
            <SelectPropertyOption
              item={property.type === PropertyType.UNIVERSAL
                ? {
                    ...item,
                    color: 50
                  }
                : item}
              isSelectedContext={true}
            />
          {/if}
        {/if}
        <Icon
          icon={isOptionsVisible ? "chevron-up" : "chevron-down"}
          size={Size.sm}
        />
      </div>
    {/if}
  </FormElement>
</div>
