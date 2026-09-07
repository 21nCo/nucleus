<script lang="ts">
  import { Size } from "@21n/elements/size.enum";
  import { deepCopy, isValidArrayWithData } from "@21n/shared-utils/obj.utils";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import Button from "@21n/elements/button/Button.svelte";
  import {
    type ISelectPropertyConfig,
    type IUniversalPropertyConfig,
    type IPropertyConfigOption,
    PropertyType,
    UniversalPropertyType
  } from "@nucleum/features/collections/properties/property.type";
  import SelectOptionsEditor from "@nucleum/features/collections/properties/propertyConfig/selectProperty/SelectOptionsEditor.svelte";
  import { ButtonStyle, ButtonVariant } from "@21n/elements/button/button.type";
  import { logger } from "@nucleum/client/runtime/logging/logger";
  import SelectPropertyOptionList from "@nucleum/features/collections/properties/selectProperty/SelectPropertyOptionList.svelte";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import {
    resolveSelectPropertySelection,
    isHighVolumeUniversalType,
    resolveUniversalPropertyOptions
  } from "@nucleum/features/collections/properties/property.utils";
  import { uiState } from "@nucleum/stores/uiState/uiState.store";
  import {
    UIState,
    UIStateScope
  } from "@nucleum/stores/uiState/uiState.type";

  let {
    property,
    isMultiSelect,
    value = $bindable(""),
    onSelect,
    onNewOption,
    onConfigChange
  }: {
    property: {
      id: IRecordId;
      type:
        | PropertyType.SINGLE_SELECT
        | PropertyType.MULTI_SELECT
        | PropertyType.UNIVERSAL;
      config: ISelectPropertyConfig | IUniversalPropertyConfig;
      defaultValue: any;
    };
    isMultiSelect: boolean;
    value?: string | string[];
    onSelect: (value: string | string[]) => void;
    onNewOption: (option: { id: IRecordId; label: string }) => void;
    onConfigChange: (config: any) => void;
  } = $props();
  let searchInputRef = $state<any>();
  let search = $state("");
  let originalConfig:
    | ISelectPropertyConfig
    | IUniversalPropertyConfig
    | undefined;
  let isEditing = $state(false);
  let universalType = $derived(
    property.type === PropertyType.UNIVERSAL
      ? (property.config as IUniversalPropertyConfig)?.type
      : undefined
  );

  let allUniversalOptions = $derived(
    property.type === PropertyType.UNIVERSAL && universalType
      ? resolveUniversalPropertyOptions(universalType)
      : []
  );

  let regularOptions = $derived(
    property.type !== PropertyType.UNIVERSAL
      ? ((property.config as ISelectPropertyConfig)?.options ?? [])
      : []
  );

  let selectConfig = $derived(
    property.type !== PropertyType.UNIVERSAL
      ? (property.config as ISelectPropertyConfig)
      : undefined
  );

  let isHighVolumeType = $derived(
    property.type === PropertyType.UNIVERSAL &&
      universalType &&
      isHighVolumeUniversalType(universalType)
  );

  function getRecentlySelectedOptions(type: UniversalPropertyType): string[] {
    if (!isHighVolumeUniversalType(type)) return [];

    const recent = uiState.getState(UIState.universalPropertyRecents, {
      scope: UIStateScope.PRODUCT,
      subVariables: [type]
    });
    return recent || [];
  }

  function addToRecentlySelectedOptions(
    type: UniversalPropertyType,
    optionId: string
  ): void {
    if (!isHighVolumeUniversalType(type)) return;
    const current = getRecentlySelectedOptions(type);

    const filtered = current.filter((id) => id !== optionId);
    const updated = [optionId, ...filtered].slice(0, 5);

    uiState.setState(UIState.universalPropertyRecents, updated, {
      scope: UIStateScope.PRODUCT,
      subVariables: [type]
    });
  }

  function getOptionsWithRecents(
    type: UniversalPropertyType,
    allOptions: IPropertyConfigOption[],
    search?: string
  ): {
    recentOptions: IPropertyConfigOption[];
    filteredOptions: IPropertyConfigOption[];
  } {
    if (!isHighVolumeUniversalType(type)) {
      const filtered = search
        ? allOptions.filter((option) =>
            option.label?.toLowerCase()?.includes(search.toLowerCase())
          )
        : allOptions;
      return { recentOptions: [], filteredOptions: filtered };
    }

    const recentIds = getRecentlySelectedOptions(type);
    const recentOptions = recentIds
      .map((id) => allOptions.find((option) => option.id === id))
      .filter(Boolean) as IPropertyConfigOption[];

    const filteredOptions = allOptions.filter((option) => {
      const matchesSearch =
        !search || option.label?.toLowerCase()?.includes(search.toLowerCase());
      const isNotRecent = !recentIds.includes(option.id);
      return matchesSearch && isNotRecent;
    });

    const filteredRecentOptions = search
      ? recentOptions.filter((option) =>
          option.label?.toLowerCase()?.includes(search.toLowerCase())
        )
      : recentOptions;

    return { recentOptions: filteredRecentOptions, filteredOptions };
  }

  let recentOptionsAndFiltered = $derived.by(() =>
    property.type === PropertyType.UNIVERSAL && universalType
      ? getOptionsWithRecents(universalType, allUniversalOptions, search)
      : { recentOptions: [], filteredOptions: [] }
  );
  let recentOptions = $derived(recentOptionsAndFiltered.recentOptions);
  let filteredOptions = $derived(recentOptionsAndFiltered.filteredOptions);
  let options = $derived(
    property.type === PropertyType.UNIVERSAL
      ? filteredOptions
      : regularOptions.filter((x) =>
          x.label?.toLowerCase()?.includes(search.toLowerCase())
        )
  );

  function onselect(e: CustomEvent<string>) {
    const val = e.detail;
    value = resolveSelectPropertySelection(value, val, { isMultiSelect });

    if (
      property.type === PropertyType.UNIVERSAL &&
      universalType &&
      isHighVolumeUniversalType(universalType)
    ) {
      addToRecentlySelectedOptions(universalType, val);
    }

    onSelect(value);
  }

  function onenter(e: any) {
    if (
      property.type === PropertyType.UNIVERSAL ||
      options.length > 0 ||
      !e.detail
    ) {
      return;
    }
    const newOption = {
      id: property.id,
      label: e.detail.value
    };
    onNewOption(newOption);
    search = "";
  }
  function onSave() {
    propagateConfigChange();
    isEditing = false;
  }

  function propagateConfigChange() {
    logger.log({
      at: "propagateConfigChange",
      config: property.config
    });
    const changes = {
      id: property.id,
      config: property.config,
      defaultValue: property.defaultValue
    };
    onConfigChange(changes);
  }
</script>

<div class="flex flex-col h--full w-full max-h-96 h-96 bg-bgs2">
  {#if isEditing && selectConfig && property.type !== PropertyType.UNIVERSAL}
    <div class="flex w-full flex-grow">
        <SelectOptionsEditor
          bind:config={selectConfig}
          parentBgIndex={2}
          bind:defaultOptionId={property.defaultValue}
        />
    </div>
  {:else}
    <div class="flex gap-2 px-3 w-full text-b2 py-2">
      <TextInput
        bind:this={searchInputRef}
        bind:value={search}
        onEnter={onenter}
        icon="search"
        placeholder={property.type === PropertyType.UNIVERSAL
          ? "Search options"
          : "Search or type to create new"}
      />
      <!-- TODO - render config settings in popover -->
    </div>
    <div class="flex flex-col gap-6 w-full flex-grow styledscroll">
      {#key search}
        {#if isHighVolumeType && recentOptions.length > 0}
          <SelectPropertyOptionList
            options={recentOptions}
            {value}
            {isMultiSelect}
            isPreventTagStyle={property.type === PropertyType.UNIVERSAL}
            groupLabel="Recently used"
            onSelect={onselect}
          />
        {/if}

        {#if property.config && "groups" in property.config && property.config?.groups && isValidArrayWithData(property.config?.groups)}
          {#each property.config?.groups as group}
            <SelectPropertyOptionList
              groupId={group.id}
              groupLabel={group.label}
              isPreventTagStyle={property.type === PropertyType.UNIVERSAL}
              {value}
              {options}
              {isMultiSelect}
              onSelect={onselect}
            />
          {/each}
        {/if}
        <SelectPropertyOptionList
          {options}
          {value}
          {isMultiSelect}
          isPreventTagStyle={property.type === PropertyType.UNIVERSAL}
          isPreventDefaultGroupLabel={!(
            property.config &&
            "groups" in property.config &&
            property.config?.groups
          ) ||
            (property.config &&
              "groups" in property.config &&
              property.config?.groups?.length === 0)}
          onSelect={onselect}
        />
        {#if search && !options.length && (!isHighVolumeType || !recentOptions.length)}
          <div class="text-b2 text-fgs3 px-3 py-2">
            No results found.
            {#if property.type !== PropertyType.UNIVERSAL}
              Press Enter to create new
            {/if}
          </div>
        {/if}
      {/key}
    </div>
  {/if}
  {#if property.type !== PropertyType.UNIVERSAL}
    <button
      class="flex justify-center items-center h-12 min-h-12 bg--bgs2 w-full"
      onclick={(e) => {
        e.stopPropagation();
      }}
    >
      {#if isEditing}
        <div class="flex gap-3 items-center justify-between w-full px-4">
          <Button
            label="Cancel"
            icon="cross"
            style={ButtonStyle.PLAIN}
            size={Size.xs}
            onclick={() => {
              if (originalConfig) {
                property.config = originalConfig;
              }
              isEditing = false;
            }}
          />
          <Button
            label="Save"
            icon="ph:check"
            type={ButtonVariant.PRIMARY}
            style={ButtonStyle.DEFAULT}
            size={Size.xs}
            onclick={onSave}
          />
        </div>
      {:else}
        <Button
          label="Edit options"
          isUnderlined={true}
          style={ButtonStyle.PLAIN}
          size={Size.xs}
          onclick={() => {
            originalConfig = deepCopy(property.config);
            isEditing = true;
          }}
        />
      {/if}
    </button>
  {/if}
</div>
