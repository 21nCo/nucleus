<script lang="ts">
  import CarbonChart from "@nucleum/components/charts/CarbonChart.svelte";
  import { ChartType } from "@21n/types/analytics.type";
  import { Size } from "@21n/types/size.enum";
  import { formatSeconds } from "@21n/utils/time.utils";
  import { cn } from "@21n/utils/ui.utils";

  let {
    size = Size.md,
    label,
    total = undefined,
    actual = undefined,
    percentage = undefined,
    guageType = "semi"
  }: {
    size?: Size;
    label: string;
    total?: number;
    actual?: number;
    percentage?: number;
    guageType?: string;
  } = $props();

  let options = $derived({
    width:
      guageType == "semi"
        ? size == Size.sm
          ? "70px"
          : "90px"
        : size == Size.sm
          ? "40px"
          : size == Size.md
            ? "100px"
            : "120px",
    height:
      guageType == "semi"
        ? size == Size.sm
          ? "25px"
          : "50px"
        : size == Size.sm
          ? "40px"
          : size === Size.md
            ? "100px"
            : "120px",
    arcWidth: size == Size.sm ? 4 : size === Size.md ? 8 : 10,
    valueFontSize: (_val: any) => {
      return size == Size.sm ? 12 : size === Size.md ? 16 : 20;
    },
    deltaFontSize: (_val: any) => {
      return size == Size.sm ? 12 : size === Size.md ? 12 : 36;
    },
    guageType
  });
  let data = $derived.by(() => {
    try {
      return [
        {
          group: "value",
          value: percentage ?? (actual && total ? (actual / total) * 100 : 0)
        }
      ];
    } catch (e) {
      console.error(e);
      return undefined;
    }
  });
</script>

{#if data}
  <div class="flex flex-col max-h-40 gap-0.5">
    <CarbonChart type={ChartType.GUAGE} {data} additionalOptions={options} />
    <div class="flex flex-col justify-center items-center">
      {#if size != Size.sm}
        <div
          class={cn("text-fgs2", {
            "text-b3": size === Size.lg || size === Size.xl,
            "text-b4": size === Size.md
          })}
        >
          {formatSeconds(actual ?? 0)} / {formatSeconds(total ?? 0)}
        </div>
      {/if}
      <div
        class={cn({
          "text-b2": size === Size.md,
          "text-b3": size === Size.sm
        })}
      >
        {label ?? ""}
      </div>
    </div>
  </div>
{/if}
