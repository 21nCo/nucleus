<script lang="ts">
  import { appConstants, appStore } from "@nucleum/stores/app.store";
  import { userPreferences } from "@nucleum/stores/preferences/user-preferences.store";
  import { onMount } from "svelte";
  import { AppSkin, Theme } from "@21n/theme/appearance.type";
  import { Size } from "@21n/elements/size.enum";
  import appearance from "@nucleum/stores/appearance.store";
  import ColorSchemeSelector from "@nucleum/application/settings/appearance/ColorSchemeSelector.svelte";
  import SwitchInput from "@21n/elements/toggle/SwitchInput.svelte";
  import InlineInfoBanner from "@21n/elements/text/InlineInfoBanner.svelte";
  import ScrollView from "@21n/layout/scrollView/ScrollView.svelte";
  import OptionSelector from "@21n/elements/select/OptionSelector.svelte";
  import { Orientation } from "@21n/elements/direction.enum";
  import view from "@nucleum/stores/view.store";
  import TypefaceSelector from "@nucleum/application/settings/appearance/TypefaceSelector.svelte";
  let { parentBackgroundIndex = 1 }: { parentBackgroundIndex?: number } =
    $props();
  void parentBackgroundIndex;
  onMount(() => {
    if ($userPreferences.appearance.skin !== AppSkin.Clean) {
      userPreferences.setAppearance({ skin: AppSkin.Clean });
    }
  });
  function saveColorScheme(e: CustomEvent) {
    appearance.setColorScheme(e.detail);
  }
  function switchTheme(theme: Theme | undefined) {
    if (!theme) return;
    appearance.modifyUserThemeSetting(theme);
  }
  function onTypefaceChange(e: CustomEvent) {
    const selectedTypeface = e.detail;
    userPreferences.setAppearance({ typeface: selectedTypeface });
  }
</script>

<ScrollView class="flex flex-col gap-8" bottomSpacerSize={Size.sm}>
  <TypefaceSelector
    label={{ label: "Font", orientation: Orientation.Vertical }}
    value={$userPreferences.appearance.typeface || "Sen"}
    onSelect={onTypefaceChange}
    size={Size.sm}
    {parentBackgroundIndex}
  />
  <SwitchInput
    checked={$appearance.isSyncWithSystem}
    onChange={(event) => {
      appearance.modifySyncWithSystem(event.detail);
    }}
    isExpanded={true}
    label={{
      label: "Sync theme with system",
      tooltip: {
        body: "Enable this to automatically switch between light and dark themes based on your system settings."
      }
    }}
  />
  {#if $userPreferences?.appearance?.skin === AppSkin.Clean && !$appearance.isSyncWithSystem}
    <OptionSelector
      labelProps={{ label: "Theme", orientation: Orientation.Vertical }}
      options={[
        { label: "Light", value: Theme.LIGHT },
        { label: "Dark", value: Theme.DARK }
      ]}
      size={Size.sm}
      selected={$appearance.userThemeSetting}
      onSelect={(event) => {
        switchTheme(event.detail);
      }}
    />
  {:else if $userPreferences?.appearance?.skin === AppSkin.Glassy}
    <div class="text-b3 text-fgs2">{`[ Experimental theme ]`}</div>
  {/if}
  {#if !$appearance.isSyncWithSystem}
      <ColorSchemeSelector
        theme={$appearance.userThemeSetting}
        selectedSchemeId={$appearance.colorScheme.id}
        onSelect={saveColorScheme}
        size={Size.sm}
      />
  {:else}
    <div class="flex flex-col gap-8">
      <div>
        <ColorSchemeSelector
          label="Light color scheme"
          theme={Theme.LIGHT}
          size={Size.sm}
          selectedSchemeId={$appearance.lightColorSchemeId}
          onSelect={saveColorScheme}
        />
      </div>
      <div>
        <ColorSchemeSelector
          label="Dark color scheme"
          theme={Theme.DARK}
          size={Size.sm}
          selectedSchemeId={$appearance.darkColorSchemeId}
          onSelect={saveColorScheme}
        />
      </div>
    </div>
  {/if}
  <!-- {#if $appStore.isDebugMode}
    <div>
      <Switcher
        label="Glassy theme trails"
        {parentBackgroundIndex}
        items={appConstants.tempColorSchemes}
        selectionStyle={SelectionItemActiveStyle.SIDEBAR}
        onSwitch={onTempSchemeChange}
        bind:selectedIndex={selectedTempSchemeIndex}
      />
    </div>
  {/if} -->

  {#if $appearance.isSyncWithSystem}
    <InlineInfoBanner
      content="Dark and light themes will be switched automatically according to the system setting on your device."
      size={Size.sm}
    />
  {/if}

  {#if !$view.isConstrainedWidth}
    <SwitchInput
      checked={$userPreferences.appearance.isBlurredBgForPopups}
      onChange={(event) => {
        userPreferences.setAppearance({
          isBlurredBgForPopups: event.detail
        });
      }}
      isExpanded={true}
      label={{
        label: "Blurred background for popups",
        tooltip: {
          body: "Enable this to blur the background of popups."
        }
      }}
    />
  {/if}
</ScrollView>
