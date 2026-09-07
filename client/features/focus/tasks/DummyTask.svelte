<script lang="ts">
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import Task from "@nucleum/features/focus/tasks/Task.svelte";

  let {
    id,
    accessPoint = ResourceAccessPoint.SELF
  }: {
    id: any;
    accessPoint?: ResourceAccessPoint;
  } = $props();
</script>

<Task {id} {accessPoint} />
