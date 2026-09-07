<script lang="ts">
  import Table2 from "@21n/elements/table/Table2.svelte";
  import { NodeType } from "@nucleum/features/memory/node/node.type";
  import { TableCellType } from "@21n/types/table.type";
  import { BlockAction } from "@nucleum/features/memory/markdown/md.type";
  import MdShortcutText from "@nucleum/features/memory/markdown/shortcuts/MdShortcutText.svelte";
  const data = [
    {
      id: BlockAction.INSERT,
      description: "Insert a new block"
    },
    {
      id: BlockAction.MENTION,
      description: "Mention a node or a collection"
    },
    {
      id: BlockAction.DUPLICATE,
      description: "Duplicate current block"
    },
    {
      id: BlockAction.MOVEUP,
      description: "Move the block up"
    },
    {
      id: BlockAction.MOVEDOWN,
      description: "Move the block down"
    },
    {
      id: NodeType.HEADING1,
      description: "Headings"
    },
    {
      id: NodeType.QUOTE,
      description: "Quote"
    },
    {
      id: NodeType.CALLOUT,
      description: "Callout"
    },
    {
      id: NodeType.CODE,
      description: "Code"
    },
    {
      id: NodeType.LIST,
      description: "Unordered list"
    },
    {
      id: NodeType.ORDERED_LIST,
      description: "Ordered list"
    },
    {
      id: NodeType.CHECKLIST,
      description: "Check list"
    },
    {
      id: NodeType.DIVIDER,
      description: "Divider"
    },
    {
      id: NodeType.DOUBLE_DIVIDER,
      description: "Double divider"
    }
  ];
</script>

<Table2
  columns={[
    { label: "Description", key: "description", width: 3 },
    {
      label: "Shortcut",
      key: "shortcut",
      type: TableCellType.CUSTOM,
      component: MdShortcutText
    }
  ]}
  {data}
/>
