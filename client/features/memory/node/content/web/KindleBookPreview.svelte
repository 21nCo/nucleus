<script lang="ts">
  import type { IKindleBook } from "@nucleum/features/memory/node/node.type";
  let { node }: { node: IKindleBook } = $props();
</script>

<div class="w-full h-full mo:p-4 flex justify-center items-center">
  <div
    class="flex flex-col gap-5 p-4 border border-brs3 rounded-md mo:w-full w-3/4"
  >
    <div class="flex w-full gap-3">
      <img
        class="rounded-md border border-brs2"
        src={node.body.imageUrl}
        alt="Book cover"
      />
      <div class="flex flex-col gap-2 items-start justify-between">
        <div class="flex flex-col gap-2 items-start">
          <div class="font-medium text-h3 mo:text-h5 text-left">
            {node.label}
          </div>
          <div class="text-b2 text-fgs2">
            Author: {node.body.author}
          </div>
        </div>
        <div>
          <div class="text-b3 text-fgs3 text-left">
            Last annotated: {node.body.lastAnnotatedDate}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
