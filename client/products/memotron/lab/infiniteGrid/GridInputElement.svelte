<script lang="ts">
  import GridInputElement from "@nucleum/products/memotron/lab/infiniteGrid/GridInputElement.svelte";
  import { generateUID } from "@21n/utils/utils";
  let {
    size = $bindable(0),
    id,
    top,
    left,
    index,
    childItems = $bindable([]),
    value = $bindable(""),
    onBottomSiblingRequired = undefined,
    onRightSiblingRequired = undefined
  }: {
    size?: number;
    id: string;
    top: number;
    left: number;
    index: { r: number; c: number };
    childItems?: any[];
    value?: string;
    onBottomSiblingRequired?:
      | ((index: { r: number; c: number }) => void)
      | undefined;
    onRightSiblingRequired?:
      | ((index: { r: number; c: number }) => void)
      | undefined;
  } = $props();
  const isChild = $derived(id.split("-")[0] == "child");
  let colors = ["red", "blue", "green", "yellow", "pink"];

  function addChild() {
    childItems = [
      ...childItems,
      {
        id: "child-" + generateUID(),
        value: "child",
        children: [],
        size: size * 0.8,
        top: 0,
        left: 0,
        index: { r: 0, c: 0 }
      }
    ];
  }
</script>

<div
  {id}
  style="position:{!isChild
    ? 'absolute'
    : 'relative'};top:{top}px;left:{left}px;width:{isChild
    ? 'auto'
    : size}px;height:{isChild ? 'auto' : size}px;border:1px solid {colors[
    index.r % colors.length
  ]}; "
>
  <div
    {id}
    style="width:{size * 0.8}px;border:2px solid yellow"
  >
    <span contenteditable="true" bind:innerText={value}></span>
    <button onclick={addChild} style="background-color:gray">+Child</button>
    {#each childItems as child (child.id)}
      <GridInputElement bind:value={child.value} size={size * 0.8} {...child} />
    {/each}
  </div>
  {#if !isChild}
    <button
      id={"sib" + id}
      style="background-color:pink;position:absolute;top:0px;right:0px;width:{size *
        0.1}px;height:{size * 0.9}px;"
      onclick={() => onRightSiblingRequired?.(index)}>+</button
    ><button
      id={"child" + id}
      style="background-color:pink;position:absolute;bottom:0px;left:0px;width:{size *
        0.9}px;height:{size * 0.1}px;"
      onclick={() => onBottomSiblingRequired?.(index)}>+</button
    >{/if}
</div>
