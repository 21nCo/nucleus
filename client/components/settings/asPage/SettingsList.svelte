<script lang="ts">
  import Text from "@21n/elements/text/Text.svelte";
  import { Orientation } from "@21n/types/direction.enum";
  import { TextStyle } from "@21n/types/text.enum";
  import SettingThumbnail from "@nucleum/components/settings/SettingThumbnail.svelte";
  import { appStore } from "@nucleum/stores/app.store";
  import { ActionType } from "@21n/types/action.type";
  import { AppSearchParam } from "@21n/types/appStore.type";
  let {
    items = [],
    sectionName,
    orientation = Orientation.Horizontal
  }: {
    items?: string[];
    sectionName: string;
    orientation?: Orientation;
  } = $props();
  function onClick(item: string) {
    const component = appStore.resolveAction(item);
    if (
      component?.type === ActionType.LINK ||
      component?.type === ActionType.FUNCTION
    )
      appStore.runAction(item, { isReturnIfComponent: true });
    else if (component?.path) appStore.gotoPath(component.path);
    // else appStore.gotoPath("/cp/" + item);
    else
      appStore.toggleSearchParam({
        [AppSearchParam.SETTING]: item
      });
  }
</script>

<div class="flex flex-col gap-2 bg-bgs1 rounded-lg mx-4">
  {#if sectionName}
    <div class="pl-4 pt-4">
      <Text style={TextStyle.SECTION_HEADING} content={sectionName} />
    </div>
  {/if}
  <div
    class={orientation === Orientation.Horizontal
      ? "flex flex-col "
      : "flex flex-wrap gap-2 pl-4"}
  >
    {#if items}
      {#each items as item, index}
        <SettingThumbnail
          {orientation}
          action={item}
          setActiveByPath={true}
          parentBackgroundIndex={1}
          isShowDivider={true}
          isRoundedTop={!sectionName}
          isRoundedBottom={index === items.length - 1}
          onclick={() => {
            onClick(item);
          }}
        />
      {/each}
    {/if}
  </div>
</div>
