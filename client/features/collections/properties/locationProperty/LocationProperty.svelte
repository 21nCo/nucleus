<script lang="ts">
  import PointInMap from "@nucleum/components/maps/PointInMap.svelte";
  let {
    location = undefined
  }: {
    location?:
      | {
          latitude?: number;
          longitude?: number;
        }
      | undefined;
  } = $props();
</script>

<PointInMap {location} />
