<script lang="ts">
  import type { Resource } from "@nucleum/datafn/resource.enum";
  import context from "@nucleum/stores/context.store";
  import { Embed } from "@21n/types/context.type";
  import { KeyboardKey } from "@21n/types/keyboard.type";
  import GroupItem from "@nucleum/products/memotron/library/search/GroupItem.svelte";

  let {
    searchCallback,
    groups = [],
    isDefaultState = false,
    onExpand = undefined,
    onSelect = undefined
  }: {
    searchCallback: (query: string, resourceType: Resource) => void;
    groups?: any[];
    isDefaultState?: boolean;
    onExpand?: ((event: CustomEvent<{ group: any }>) => void) | undefined;
    onSelect?: ((event: CustomEvent<any>) => void) | undefined;
  } = $props();
  let groupRefs = $state<(GroupItem | undefined)[]>([]);
  let activeGroupIndex = $state(0);

  const groupSwitcherKeys = new Set([
    KeyboardKey.ARROW_LEFT,
    KeyboardKey.ARROW_RIGHT
  ]);
  const resultNavigatorKeys = new Set([
    KeyboardKey.ARROW_UP,
    KeyboardKey.ARROW_DOWN
  ]);

  export function keydown(event: KeyboardEvent) {
    if (groupSwitcherKeys.has(event.key as KeyboardKey)) {
      if (!event.metaKey || !event.shiftKey) return;
      event.preventDefault();
      event.stopPropagation();
      const prevVal = activeGroupIndex;
      if (event.key === KeyboardKey.ARROW_LEFT) {
        activeGroupIndex = Math.max(0, activeGroupIndex - 1);
        if (prevVal === activeGroupIndex) {
          activeGroupIndex = groups.length - 1;
        }
      } else {
        activeGroupIndex = Math.min(groups.length - 1, activeGroupIndex + 1);
        if (prevVal === activeGroupIndex) {
          activeGroupIndex = 0;
        }
      }
      setTimeout(() => {
        groupRefs[prevVal]?.resetSelectedIndex();
      }, 100);
      return;
    }
    if (resultNavigatorKeys.has(event.key as KeyboardKey)) {
      event.preventDefault();
      event.stopPropagation();
      const activeGroup = groupRefs[activeGroupIndex];
      activeGroup?.keydown(event);
      return;
    }
    groupRefs.forEach((group) => group?.keydown(event));
  }

  export function keyup(event: KeyboardEvent) {
    if (groupSwitcherKeys.has(event.key as KeyboardKey)) return;
    if (resultNavigatorKeys.has(event.key as KeyboardKey)) {
      event.preventDefault();
      event.stopPropagation();
      const activeGroup = groupRefs[activeGroupIndex];
      activeGroup?.keyup(event);
      return;
    }
    if (event.key === KeyboardKey.ENTER) {
      const activeGroup = groupRefs[activeGroupIndex];
      activeGroup?.keyup(event);
      return;
    }
    groupRefs.forEach((group) => group?.keyup(event));
  }

  export function search(query?: string) {
    groupRefs.forEach((group) => group?.search(query));
  }
</script>

<div class="grid grid-cols-2 2k:grid-cols-3 cw:grid-cols-1 w-full flex-grow">
  {#each groups as group, index}
    <GroupItem
      bind:this={groupRefs[index]}
      isActive={activeGroupIndex === index && $context.embed !== Embed.HANDSET}
      {isDefaultState}
      {group}
      {index}
      searchCallback={(query) => {
        return searchCallback(query, group.value);
      }}
      {onExpand}
      {onSelect}
    />
  {/each}
</div>
