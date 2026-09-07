<script lang="ts">
  import { Orientation } from "@21n/elements/direction.enum";
  import FormControlLabelWrapper from "@21n/elements/text/formLabel/FormControlLabelWrapper.svelte";
  let {
    value = $bindable(),
    label = undefined,
    info = undefined,
    hour = $bindable(),
    minute = $bindable(),
    labelOrientation = Orientation.Vertical,
    isShowOnlyAfterCurrentTime = false,
    onChange: onValueChange = undefined
  }: {
    value?: string | undefined;
    label?: string | undefined;
    info?: string | undefined;
    hour?: number | undefined;
    minute?: number | undefined;
    labelOrientation?: Orientation;
    isShowOnlyAfterCurrentTime?: boolean;
    onChange?: ((event: CustomEvent<{ value: string }>) => void) | undefined;
  } = $props();
  let hours = $state<string[]>([]);
  let minutes = $state<string[]>([]);

  $effect(() => {
    if (value) {
      let parts = value.split(":");
      let nextHour = +parts[0];
      let nextMinute = +parts[1];
      if (hour !== nextHour) hour = nextHour;
      if (minute !== nextMinute) minute = nextMinute;
      return;
    }
    if (hour == null && minute == null) {
      hour = 0;
      minute = 0;
    }
  });

  $effect(() => {
    if (isShowOnlyAfterCurrentTime) {
      let now = new Date();
      hours = Array.from({ length: 24 - now.getHours() }, (_, i) =>
        (i + now.getHours()).toString().padStart(2, "0")
      );
      if (hour == now.getHours()) {
        minutes = Array.from({ length: 60 - now.getMinutes() }, (_, i) =>
          (i + now.getMinutes()).toString().padStart(2, "0")
        );
      } else {
        minutes = Array.from({ length: 60 }, (_, i) =>
          i.toString().padStart(2, "0")
        );
      }
    } else {
      hours = Array.from({ length: 24 }, (_, i) =>
        i.toString().padStart(2, "0")
      );
      minutes = Array.from({ length: 60 }, (_, i) =>
        i.toString().padStart(2, "0")
      );
    }
  });

  function emitChange() {
    value = `${hour}:${minute}`;
    const changeEvent = new CustomEvent<{ value: string }>("change", {
      detail: { value: hour + ":" + minute }
    });
    onValueChange?.(changeEvent);
  }
</script>

<FormControlLabelWrapper
  props={{
    label: label ?? "",
    tooltip: { body: info ?? "" },
    orientation: labelOrientation
  }}
>
  <div class="flex items-center space-x-2">
    <select
      class="bg-bgs2 p-2 border rounded-lg"
      bind:value={hour}
      onchange={emitChange}
    >
      {#each hours as hour}
        <option value={+hour}>{hour}</option>
      {/each}
    </select>

    <span class="text-gray-400">:</span>

    <select
      class="bg-bgs2 p-2 border rounded-lg"
      bind:value={minute}
      onchange={emitChange}
    >
      {#each minutes as minute}
        <option value={+minute}>{minute}</option>
      {/each}
    </select>
  </div>
</FormControlLabelWrapper>
