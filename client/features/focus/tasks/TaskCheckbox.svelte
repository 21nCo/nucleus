<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import type { IRecordId } from "@21n/types/data.type";
  import { Size } from "@21n/types/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import type { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { resolveUnixTimestamp } from "@21n/shared-utils/time.utils";

  let {
    isChecked = $bindable(false),
    id,
    size = Size.md,
    accessPoint,
    isAccentBg = false,
    onToggle = undefined
  }: {
    isChecked?: boolean;
    id: IRecordId;
    size?: Size;
    accessPoint: ResourceAccessPoint;
    isAccentBg?: boolean;
    onToggle?: ((event: CustomEvent<IRecordId>) => void) | undefined;
  } = $props();

  function handleToggle(event: MouseEvent) {
    event.stopPropagation();
    isChecked = !isChecked;
    datafn.task.mutate({
      operation: "merge",
      id,
      record: {
        id,
        isChecked,
        completedAtUnix: isChecked ? resolveUnixTimestamp() : null
      },
      context: accessPoint
    });
    const toggleEvent = new CustomEvent<IRecordId>("toggle", { detail: id });
    onToggle?.(toggleEvent);
  }
</script>

<button
  aria-label={isChecked ? "Mark task incomplete" : "Mark task complete"}
  data-testid={`task-checkbox:${id}`}
  onclick={handleToggle}
>
  <div
    class={cn("rounded-md flex items-center justify-center border", {
      "bg-aps1 border-transparent": isChecked && !isAccentBg,
      "bg-ccs3 border-transparent": isChecked && isAccentBg,
      "border-fgs4": !isChecked && !isAccentBg,
      "border-cbg": !isChecked && isAccentBg,
      "w-4 h-4": size === Size.md,
      "w-5 h-5": size === Size.lg
    })}
  >
    {#if isChecked}
      <Icon
        icon="ph:check"
        class={cn({ "text-abg": !isAccentBg, "text-ccs1": isAccentBg })}
        size={Size.sm}
      />
    {/if}
  </div>
</button>
