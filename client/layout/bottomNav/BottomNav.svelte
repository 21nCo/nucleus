<script lang="ts">
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import { hTrail } from "../topNav/tabs/tabs.store";
  import TopBarResourceItem from "../topNav/tabs/TopBarResourceItem.svelte";
  import TopNavLeftLogo from "../topNav/TopNavLeftLogo.svelte";
  import type { Action } from "@nucleum/client/config/action.enum";
  import { isRecordId } from "@nucleum/datafn/resource.utils";
  import context from "@nucleum/stores/context.store";
  import { cn } from "@21n/utils/ui.utils";

  function handleClick(item: Action | IRecordId) {
    hTrail.activate(item);
  }
</script>

<div
  class={cn("relative flex w-full min-h-11 h-11 bg-bgs2", {
    "border-t border-brs3": !$context.experiments?.isEnableRoundedMain
  })}
>
  <TopNavLeftLogo
    action={"cross"}
    callback={() => {
      hTrail.clear();
    }}
  />
  <div class="flex items-center gap-6 px-3 relative trail overflow-x-auto">
    {#each $hTrail.path as item (item)}
      <TopBarResourceItem
        {item}
        onClick={() => handleClick(item)}
        isInterimTab={isRecordId(item)}
        isTrail
        onClose={() => {
          hTrail.remove(item);
        }}
      />
    {/each}
  </div>
</div>

<style>
  .trail::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    height: 50%;
    width: 100%;
    z-index: 0;
    opacity: 0.7;
    border-bottom: 1px dashed rgb(var(--colors-fgs4));
  }
</style>
