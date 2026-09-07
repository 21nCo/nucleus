<script lang="ts">
  import DurationInput from "@21n/elements/input/durationInput/DurationInput.svelte";
  import { Orientation } from "@21n/types/direction.enum";
  let {
    estimatedTime = 0,
    onChange
  }: {
    estimatedTime?: number;
    onChange: (event: CustomEvent<{ value: number }>) => void;
  } = $props();
  if (!estimatedTime) estimatedTime = 0;
</script>

<div class="w-60 lg:w-96 z-50 text-fgs1">
  <div
    class="flex flex-col w-full gap-2 items-center bg-bgs1 border border-brs3 rounded-xl p-4 shadow-md"
  >
    <div class="w-full h-full">
      <DurationInput
        bind:value={estimatedTime}
        label={{
          label: "Estimated time",
          orientation: Orientation.Vertical
        }}
        onChange={onChange}
      />
    </div>
  </div>
</div>
