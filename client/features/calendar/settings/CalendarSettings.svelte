<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import Text from "@21n/elements/text/Text.svelte";
  import { TextStyle } from "@21n/types/text.enum";
  import { Size } from "@21n/types/size.enum";
  import { ButtonStyle, ButtonVariant } from "@21n/types/button.type";
  import { preferences } from "@nucleum/stores/preferences/preferences.store";
  import { NodeType } from "@nucleum/features/memory/node/node.type";
  import { generateResourceId } from "@nucleum/datafn/id.utils";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { toasts } from "@nucleum/stores/notification.store";
  import NodularMarkdown from "@nucleum/components/markdown/NodularMarkdown.svelte";
  import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";
  import context from "@nucleum/stores/context.store";
  import type { IMarkdownTemplate } from "@nucleum/components/markdown/md.type";
  import { TimeScaleUnit } from "@21n/types/time.type";
  import { Preference } from "@nucleum/stores/preferences/preferences.type";
  import CalendarNotesTemplateCard from "@nucleum/features/calendar/settings/CalendarNotesTemplateCard.svelte";
  import { generateMarkdownText } from "@nucleum/features/memory/node/node.utils";
  import Switch from "@21n/elements/toggle/Switch.svelte";
  import { Product } from "@21n/types/product.type";
  import { appStore } from "@nucleum/stores/app.store";
  import ScrollViewBottomSpacer from "@21n/layout/scrollView/ScrollViewBottomSpacer.svelte";
  let editingTemplate: TimeScaleUnit | null = null;
  let templateMarkdown: IMarkdownTemplate = getDefaultTemplate();

  function getDefaultTemplate(): IMarkdownTemplate {
    const savedTemplate = preferences.resolve(Preference.NOTES_TEMPLATE, {
      subVariables: [editingTemplate ?? ""]
    });
    if (savedTemplate && typeof savedTemplate === "object") {
      return { ...savedTemplate } as IMarkdownTemplate;
    }
    const newBlockId = generateResourceId(Resource.node);
    return {
      body: {
        blocks: [
          {
            id: newBlockId,
            contentType: NodeType.SIMPLE_TEXT,
            body: ""
          }
        ]
      },
      childrenWithStructure: [],
      rootStructure: []
    };
  }

  function editTemplate(scale: TimeScaleUnit) {
    editingTemplate = scale;
    templateMarkdown = getDefaultTemplate();
  }

  function saveTemplate() {
    preferences.save(
      Preference.NOTES_TEMPLATE,
      {
        ...templateMarkdown,
        text: generateMarkdownText(templateMarkdown.body.blocks)
      },
      {
        subVariables: [editingTemplate ?? ""]
      }
    );
    toasts.success("Notes template saved");
    editingTemplate = null;
    return Promise.resolve(true);
  }

  function resolveDescription(scale: TimeScaleUnit) {
    return (
      preferences.resolve(Preference.NOTES_TEMPLATE, {
        subVariables: [scale]
      }) as IMarkdownTemplate | undefined
    )?.text;
  }

  let showMonthIndicators =
    preferences.resolve(Preference.CALENDAR_TILE_INDICATORS_MONTH) ?? true;
  let showYearIndicators =
    preferences.resolve(Preference.CALENDAR_TILE_INDICATORS_YEAR) ?? true;

  const indicatorSettings = [
    {
      key: "month",
      title: "Month View Indicators",
      description: "Show activity indicators on calendar tiles in month view",
      preference: Preference.CALENDAR_TILE_INDICATORS_MONTH,
      value: () => showMonthIndicators,
      setValue: (val: boolean) => {
        showMonthIndicators = val;
      }
    },
    {
      key: "year",
      title: "Year View Indicators",
      description: "Show activity indicators on calendar tiles in year view",
      preference: Preference.CALENDAR_TILE_INDICATORS_YEAR,
      value: () => showYearIndicators,
      setValue: (val: boolean) => {
        showYearIndicators = val;
      }
    }
  ];
</script>

<div class="flex flex-col gap-6 w-full h-full p-6">
  {#if editingTemplate}
    <div class="flex flex-col gap-4 h-full w-full overflow-y-auto">
      <div class="flex items-center justify-between">
        <Text
          content={`Edit ${editingTemplate} notes template`}
          style={TextStyle.PANEL_HEADING}
        />
        <Button
          icon="cross"
          size={Size.sm}
          onclick={() => (editingTemplate = null)}
        />
      </div>

      <div class="border border-brs3 p-1 rounded-lg min-h-0 flex-grow flex-1">
        <NodularMarkdown
          isNodular={true}
          mdId={generateSimpleRandomId()}
          bind:md={templateMarkdown.body}
          bind:childrenWithStructure={templateMarkdown.childrenWithStructure}
          bind:rootStructure={templateMarkdown.rootStructure}
          params={{ isPreventFocusOnLoad: $context.isTouchDevice }}
        />
      </div>

      <div class="flex gap-2 justify-end">
        <Button
          type={ButtonVariant.SECONDARY}
          style={ButtonStyle.OUTLINED}
          label="Cancel"
          onclick={() => (editingTemplate = null)}
        />
        <Button
          type={ButtonVariant.PRIMARY}
          label="Update"
          icon="save"
          onclick={saveTemplate}
        />
      </div>
    </div>
  {:else}
    <div class="flex flex-col gap-12">
      {#if [Product.NUCLEUM, Product.MEMOTRON].includes($appStore.product)}
        <div class="flex flex-col gap-3">
          <Text content="Templates" style={TextStyle.SECTION_HEADING} />

          <div
            style={"--colw: min(100%, 400px)"}
            class="grid grid-cols-[repeat(auto-fill,minmax(var(--colw),1fr))] w-full gap-3"
          >
            <CalendarNotesTemplateCard
              scale={TimeScaleUnit.DAY}
              description={resolveDescription(TimeScaleUnit.DAY)}
              onEdit={() => editTemplate(TimeScaleUnit.DAY)}
            />
            <CalendarNotesTemplateCard
              scale={TimeScaleUnit.MONTH}
              description={resolveDescription(TimeScaleUnit.MONTH)}
              onEdit={() => editTemplate(TimeScaleUnit.MONTH)}
            />
            <CalendarNotesTemplateCard
              scale={TimeScaleUnit.YEAR}
              description={resolveDescription(TimeScaleUnit.YEAR)}
              onEdit={() => editTemplate(TimeScaleUnit.YEAR)}
            />
          </div>
        </div>
      {/if}
      <div class="flex flex-col gap-3">
        <Text content="Calendar Indicators" style={TextStyle.SECTION_HEADING} />

        <div class="flex flex-col gap-3">
          {#each indicatorSettings as setting (setting.key)}
            <div
              class="flex items-center justify-between p-3 rounded-md border border-brs2 bg-bgs2"
            >
              <div class="flex flex-col gap-1">
                <Text content={setting.title} style={TextStyle.FORM_LABEL} />
                <span class="text-b2 text-fgs3">{setting.description}</span>
              </div>
              <Switch
                on={setting.value()}
                onChange={() => {
                  const newValue = !setting.value();
                  setting.setValue(newValue);
                  preferences.save(setting.preference, newValue);
                }}
              />
            </div>
          {/each}
        </div>
      </div>
      <ScrollViewBottomSpacer />
    </div>
  {/if}
</div>
