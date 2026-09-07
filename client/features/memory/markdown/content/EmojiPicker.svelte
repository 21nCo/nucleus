<script lang="ts">
  import { emojis } from "@21n/elements/avatarPicker/avatars";
  import { userPreferences } from "@nucleum/stores/preferences/user-preferences.store";
  import { onMount } from "svelte";
  import { cn } from "$lib/client/utils/ui.utils";
  import {
    AvatarType,
    type AvatarWithCode,
    type EmojiAvatar,
    type IAvatar
  } from "@21n/elements/avatarPicker/avatar.type";

  let {
    searchQuery = $bindable(""),
    isPopoverContext = false,
    onNoresults,
    onSelect
  }: {
    searchQuery?: string;
    isPopoverContext?: boolean;
    onNoresults?: (() => void) | undefined;
    onSelect?: ((event: CustomEvent<{ emoji: AvatarWithCode<EmojiAvatar> }>) => void) | undefined;
  } = $props();
  void isPopoverContext;

  type EmojiData = IAvatar;
  type EmojiEntry = [IAvatar];

  let activeCategory: string = "";
  let emojisWithCategories: Record<string, EmojiEntry[]> = {
    "Frequently Used": [],
    ...(emojis as Record<string, EmojiEntry[]>)
  };

  let storeEmojis = emojisWithCategories;
  let storeEmojisKey = Object.keys(storeEmojis);

  let displayEmojis: Record<string, EmojiEntry[]> = {};
  let emojisParentContainer: HTMLDivElement;
  let selectedIndex = 0;
  let flatEmojiList: EmojiEntry[] = [];

  $effect(() => {
    filterEmojis(searchQuery);
  });

  function resolveEmojiData(emoji: EmojiEntry | undefined) {
    return emoji?.[0];
  }

  function isEmojiAvatar(
    emoji: IAvatar | undefined
  ): emoji is AvatarWithCode<EmojiAvatar> {
    return Boolean(emoji && "code" in emoji && emoji.type === AvatarType.EMOJI);
  }

  function resolveEmojiCode(emoji: EmojiEntry) {
    const emojiData = resolveEmojiData(emoji);
    return isEmojiAvatar(emojiData) ? emojiData.code : "";
  }

  function updateUsedEmojis(prefs: any) {
    storeEmojis["Frequently Used"] = prefs.avatarPicker.usedEmojis
      ?.slice(0, 20)
      .filter((emote: EmojiEntry) => (resolveEmojiData(emote)?.frequency ?? 0) > 2);
  }

  onMount(() => {
    const userPrefSub = userPreferences.subscribe((prefs) => {
      updateUsedEmojis(prefs);
    });
    return () => {
      if (userPrefSub) userPrefSub();
    };
  });

  function filterEmojis(query: string) {
    const searchValue = query.trim().toLowerCase();
    if (!searchValue) {
      displayEmojis = {};
      flatEmojiList = [];
      selectedIndex = 0;
      if (onNoresults) onNoresults();
      return;
    }
    
    let tempEmojis: Record<string, EmojiEntry[]> = {};
    let tempFlatList: EmojiEntry[] = [];
    let totalCount = 0;
    const maxResults = 50;
    
    for (let key of storeEmojisKey) {
      if (totalCount >= maxResults) break;
      
      const emojiList = storeEmojis[key as keyof typeof storeEmojis];
      if (!emojiList) continue;
      
      for (let emoji of emojiList) {
        if (totalCount >= maxResults) break;

        let emojiName = resolveEmojiData(emoji)?.name?.toLowerCase();
        if (emojiName && emojiName.includes(searchValue)) {
          if (tempEmojis[key] === undefined) tempEmojis[key] = [];
          tempEmojis[key].push(emoji);
          tempFlatList.push(emoji);
          totalCount++;
        }
      }
    }
    displayEmojis = tempEmojis;
    flatEmojiList = tempFlatList;
    selectedIndex = 0;
    
    if (totalCount === 0) {
      if (onNoresults) onNoresults();
    }
  }

  function addToUsedList(emoji: AvatarWithCode<EmojiAvatar>) {
    const usedEmojis = [...($userPreferences.avatarPicker.usedEmojis ?? [])];
    let index = usedEmojis.findIndex((el: EmojiEntry) => {
      const usedEmoji = resolveEmojiData(el);
      return (
        usedEmoji?.name === emoji.name &&
        (isEmojiAvatar(usedEmoji) ? usedEmoji.code === emoji.code : false)
      );
    });
    if (index === -1) {
      let tempEmoji = { ...emoji } as AvatarWithCode<EmojiAvatar>;
      tempEmoji.type = AvatarType.EMOJI;
      tempEmoji.frequency = 1;
      usedEmojis.push([tempEmoji]);
    } else {
      const usedEmoji = resolveEmojiData(usedEmojis[index]);
      if (usedEmoji) {
        usedEmoji.frequency = (usedEmoji.frequency ?? 0) + 1;
      }
    }

    usedEmojis.sort(
      (a: EmojiEntry, b: EmojiEntry) =>
        (resolveEmojiData(b)?.frequency ?? 0) -
        (resolveEmojiData(a)?.frequency ?? 0)
    );
    userPreferences.setAvatarPicker({ usedEmojis });
  }

  function itemClickHandler(emoji: EmojiEntry) {
    const selectedEmoji = resolveEmojiData(emoji);
    if (!isEmojiAvatar(selectedEmoji)) return;
    addToUsedList(selectedEmoji);
    const event = new CustomEvent<{ emoji: AvatarWithCode<EmojiAvatar> }>(
      "select",
      {
        detail: { emoji: selectedEmoji }
      }
    );
    onSelect?.(event);
  }

  export function key(key: string) {
    if (key === "ArrowDown") {
      selectedIndex = Math.min(selectedIndex + 1, flatEmojiList.length - 1);
      scrollToSelected();
    } else if (key === "ArrowUp") {
      selectedIndex = Math.max(selectedIndex - 1, 0);
      scrollToSelected();
    } else if (key === "Enter") {
      if (flatEmojiList[selectedIndex]) {
        itemClickHandler(flatEmojiList[selectedIndex]);
      }
    }
  }

  function scrollToSelected() {
    const selectedElement = document.querySelector(
      `.emoji-item[data-index="${selectedIndex}"]`
    );
    if (selectedElement && emojisParentContainer) {
      selectedElement.scrollIntoView({
        block: "nearest",
        behavior: "smooth"
      });
    }
  }

  function getCategoryForEmoji(emoji: EmojiEntry): string {
    for (const [category, emojiList] of Object.entries(displayEmojis)) {
      if (Array.isArray(emojiList) && emojiList.includes(emoji)) {
        return category;
      }
    }
    return "";
  }
</script>

<div class="flex flex-col bg-bgs1 max-h-80 w-full shadow-lg rounded-md border border-brs1">
  <div
    bind:this={emojisParentContainer}
    class="flex-1 overflow-y-auto py-1"
  >
    {#if flatEmojiList.length === 0}
      <div class="text-center text-fgs3 py-4 text-b3">
        No emojis found
      </div>
    {:else}
      {#each flatEmojiList as emoji, index}
        <button
          class={cn(
            "emoji-item w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-bgs2 transition-colors cursor-pointer",
            {
              "bg-bgs2": index === selectedIndex
            }
          )}
          data-index={index}
          onclick={() => itemClickHandler(emoji)}
        >
          <span class="text-lg flex-shrink-0">
            {@html resolveEmojiCode(emoji)}
          </span>
          <span class="text-b3 text-fgs2 truncate">
            {emoji[0]?.name}
          </span>
        </button>
      {/each}
    {/if}
  </div>
</div>
