<script lang="ts">
  import { dragAndDropStore } from "@nucleum/stores/app.store";
  import view from "@nucleum/stores/view.store";
  import { DragStatus } from "@nucleum/actions/dragstatus.enum";
  let {
    item,
    classList = "",
    isDraggable = false,
    isDragging = false,
    id,
    children
  }: any = $props();
  let ref = $state<any>();
  const handleDragStart = () => {
    // console.log("drag started ",item.label)
    isDragging = true;
    dragAndDropStore.update((x: any) => {
      x = { ...x, dragStatus: DragStatus.STARTED, dragItem: item, dragId: id };
      return x;
    });
  };
  const handleDragEnter = async () => {
    // console.log("drag entered")
    dragAndDropStore.update((x: any) => {
      x = {
        ...x,
        dragStatus: DragStatus.DRAGGING,
        dragEnterItem: item,
        dragEnterId: id
      };
      return x;
    });
    function isInView(element: any) {
      const parentBoundingBox = element.parentElement.getBoundingClientRect();
      const boundingBox = element.getBoundingClientRect();
      // console.log("p and c ",parentBoundingBox,boundingBox);
      return (
        boundingBox.top >= 0 && boundingBox.bottom <= parentBoundingBox.bottom
      );
    }
    let isInV = isInView(ref);
    // console.log("isinView ",isInV,item.label);
    if ($view.isPortrait || !isInV) {
      await ref.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };
  const handleDragEnd = () => {
    // console.log("drag ended")
    isDragging = false;
  };

  const handleDrop = () => {
    // console.log("dropped on",item.label)
    dragAndDropStore.update((x: any) => {
      x = { ...x, dragStatus: DragStatus.DROPPED, dropItem: item, dropId: id };
      return x;
    });
  };
  function onDragOver(event: any) {
    // console.log("drag over",item.label)
    event?.preventDefault();
  }
</script>

<div
  class="{isDraggable ? 'cursor-move' : ''} {classList}"
  draggable={isDraggable}
  ondragstart={(event) => {
    event.stopPropagation();
    handleDragStart();
  }}
  ondragend={(event) => {
    event.stopPropagation();
    handleDragEnd();
  }}
  ondragover={(event) => {
    event.stopPropagation();
    onDragOver(event);
  }}
  ondragenter={async (event) => {
    event.stopPropagation();
    await handleDragEnter();
  }}
  ondrop={(event) => {
    event.stopPropagation();
    handleDrop();
  }}
  onmouseenter={(event) => {
    event.stopPropagation();
  }}
  onmouseleave={(event) => {
    event.stopPropagation();
  }}
  bind:this={ref}
>
  {@render children?.()}
</div>
