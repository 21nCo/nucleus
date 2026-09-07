<script lang="ts">
  import { NodeType } from "@nucleum/features/memory/node/node.type";
  import context from "@nucleum/stores/context.store";
  import { ModifierKey } from "@21n/types/keyboard.type";
  import { resolveShortcutText } from "@nucleum/application/shortcuts/shortcut.utils";
  import { BlockAction, InlineType } from "@nucleum/features/memory/markdown/md.type";

  let {
    row = undefined,
    type = undefined
  }: {
    row?: any | undefined;
    type?: NodeType | InlineType | BlockAction | undefined;
  } = $props();

  const shortcutId = $derived(type ?? row?.id);

  const mdShortcutMap = [
    {
      id: BlockAction.INSERT,
      key: "/"
    },
    {
      id: BlockAction.MENTION,
      key: "@ or [ ]"
    },
    {
      id: BlockAction.DUPLICATE,
      key: "d",
      modifiers: [ModifierKey.META]
    },
    {
      id: BlockAction.MOVEUP,
      key: "up",
      modifiers: [ModifierKey.ALT]
    },
    {
      id: BlockAction.MOVEDOWN,
      key: "down",
      modifiers: [ModifierKey.ALT]
    },
    {
      id: NodeType.HEADING1,
      key: "#"
    },
    {
      id: NodeType.HEADING2,
      key: "##"
    },
    {
      id: NodeType.HEADING3,
      key: "###"
    },
    {
      id: NodeType.HEADING4,
      key: "####"
    },
    {
      id: NodeType.QUOTE,
      key: '" or >'
    },
    {
      id: NodeType.CALLOUT,
      key: "!"
    },
    {
      id: NodeType.CODE,
      key: "```"
    },
    {
      id: NodeType.LIST,
      key: "* or -"
    },
    {
      id: NodeType.ORDERED_LIST,
      key: "1."
    },
    {
      id: NodeType.CHECKLIST,
      key: "+ or [ ]"
    },
    {
      id: NodeType.DIVIDER,
      key: "---"
    },
    {
      id: NodeType.DOUBLE_DIVIDER,
      key: "==="
    }
  ];

  function resolveShortcut() {
    const shortcut = mdShortcutMap.find((x) => x.id === shortcutId);
    if (!shortcut) return shortcutId;
    if (!shortcut.modifiers) {
      return shortcut.key;
    }
    return resolveShortcutText({
      key: shortcut.key,
      modifiers: shortcut.modifiers,
      os: $context.os
    });
  }
</script>

<span class="rounded-md px-2 py-1 flex">
  {resolveShortcut()}
</span>
