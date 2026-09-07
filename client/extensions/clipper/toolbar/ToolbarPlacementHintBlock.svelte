<script lang="ts">
  import { Placement } from "@21n/types/direction.enum";
  import { cn } from "@21n/utils/ui.utils";
  import { toolbarState } from "@nucleum/extensions/clipper/contentScripts/store";
  let {
    position = Placement.Bottom
  }: {
    position?: Placement.Bottom | Placement.Left | Placement.Right;
  } = $props();
  let isDraggedOver: boolean = false;
</script>

<div
  class={cn("fixed flex justify-center items-center", {
    "bottom-0 inset-x-0 w-full": position === Placement.Bottom,
    "left-0 inset-y-0 h-full": position === Placement.Left,
    "right-0 inset-y-0 h-full": position === Placement.Right
  })}
>
  <button
    class={cn(
      "flex items-center justify-center p-2 text-center m-4 border rounded-md ",
      {
        "w-3/5 min-h-40": position === Placement.Bottom,
        "h-3/5 min-w-40":
          position === Placement.Left || position === Placement.Right,
        "border-solid border-fgs1 bg-fgs2": isDraggedOver,
        "border-dashed border-fgs1 bg-fgs3 bg-opacity-70": !isDraggedOver
      }
    )}
    ondragover={(event) => {
      event.preventDefault();
      isDraggedOver = true;
    }}
    ondragleave={() => {
      isDraggedOver = false;
    }}
    ondrop={() => {
      isDraggedOver = false;
      console.log({ at: "ondrop", position });
      if (position) {
        toolbarState.changePosition(position);
      }
    }}
  >
    <span class="bg-fgs2 p-2 rounded-md text-bgs2">
      Move here to stick toolbar to the {position.toLowerCase()}
    </span>
  </button>
</div>
